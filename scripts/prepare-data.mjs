/** Build an auditable dataset from the original pack. Source files are read-only. */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseCSV, deliveryFacts, pressureFlags } from "./data-pipeline.mjs";
const source = path.resolve(
  process.argv[2] || "6af458274c1e8_data_pack/Data Pack",
);
const readCSV = async (name) =>
  parseCSV(await readFile(path.join(source, name), "utf8"));
const empty = () => ({
  balls: 0,
  runs: 0,
  wickets: 0,
  dots: 0,
  boundaries: 0,
  samples: {},
});
const phases = [
  "pressure",
  "normal",
  "chasing",
  "death",
  "highRate",
  "wicketsDown",
];
const disciplineStats = () =>
  Object.fromEntries(phases.map((p) => [p, empty()]));
try {
  const [competitions, matches, balls, eleven, mappings] = await Promise.all(
    [
      "competitions.csv",
      "matches.csv",
      "ball_by_ball.csv",
      "playing_eleven.csv",
      "competition_team_player_mapping.csv",
    ].map(readCSV),
  );
  const comps = new Map(competitions.map((c) => [c.comp_id, c]));
  const matchMap = new Map(matches.map((m) => [m.match_id, m]));
  const keepers = new Set(
    eleven.filter((p) => p.is_wk === "true").map((p) => p.player_id),
  );
  const teams = new Map();
  for (const p of mappings) {
    const k = `${p.comp_id}|${p.player_id}`;
    const names = teams.get(k) || new Set();
    names.add(p.team_name);
    teams.set(k, names);
  }
  const totals = new Map();
  for (const b of balls)
    if (+b.innings === 1)
      totals.set(
        b.match_id,
        (totals.get(b.match_id) || 0) + deliveryFacts(b).totalRuns,
      );
  balls.sort(
    (a, b) =>
      +a.match_id - +b.match_id ||
      +a.innings - +b.innings ||
      +a.innings_ball_num - +b.innings_ball_num,
  );
  const states = new Map(),
    buckets = new Map();
  const audit = {
    rawRows: balls.length,
    includedRows: 0,
    excludedSuperOverRows: 0,
    unmatchedRows: 0,
    ambiguousExtras: 0,
    missingPlayerRows: 0,
    matches: matches.length,
    competitions: competitions.length,
    firstDate: null,
    lastDate: null,
  };
  for (const b of balls) {
    const match = matchMap.get(b.match_id),
      comp = comps.get(match?.comp_id);
    if (!comp) {
      audit.unmatchedRows++;
      continue;
    }
    if (+b.innings > 2) {
      audit.excludedSuperOverRows++;
      continue;
    }
    audit.firstDate =
      !audit.firstDate || match.match_date < audit.firstDate
        ? match.match_date
        : audit.firstDate;
    audit.lastDate =
      !audit.lastDate || match.match_date > audit.lastDate
        ? match.match_date
        : audit.lastDate;
    const league = /^IPL\b/.test(comp.comp_name)
      ? "IPL"
      : comp.match_format === "T20I"
        ? "T20I"
        : "Other T20";
    const key = `${league}|${comp.season}`;
    if (!buckets.has(key))
      buckets.set(key, {
        league,
        season: comp.season,
        deliveries: 0,
        pressureDeliveries: 0,
        scenarioCounts: { chasing: 0, death: 0, highRate: 0, wicketsDown: 0 },
        matches: new Set(),
        players: new Map(),
      });
    const bucket = buckets.get(key),
      inningsKey = `${b.match_id}|${b.innings}`;
    if (!states.has(inningsKey))
      states.set(inningsKey, { runs: 0, wickets: 0, legal: 0 });
    const state = states.get(inningsKey);
    const flags = pressureFlags(
      b,
      state,
      +match.revised_target || (totals.get(b.match_id) || 0) + 1,
      +match.second_inn_revised_overs || 20,
    );
    const facts = deliveryFacts(b);
    audit.ambiguousExtras += Number(facts.ambiguous);
    audit.missingPlayerRows += Number(!b.striker_id || !b.bowler_id);
    for (const discipline of ["batting", "bowling"]) {
      const id = discipline === "batting" ? b.striker_id : b.bowler_id;
      if (!id) continue;
      if (!bucket.players.has(id))
        bucket.players.set(id, {
          id,
          name: discipline === "batting" ? b.striker_name : b.bowler_name,
          keeper: keepers.has(id),
          teams: new Set(),
          battingStyle: "",
          bowlingStyle: "",
          batting: disciplineStats(),
          bowling: disciplineStats(),
        });
      const player = bucket.players.get(id);
      for (const team of teams.get(`${match.comp_id}|${id}`) || [])
        player.teams.add(team);
      if (discipline === "batting")
        player.battingStyle = b.batting_type || player.battingStyle;
      else player.bowlingStyle = b.bowling_type || player.bowlingStyle;
      const countBall =
        discipline === "batting" ? facts.batterBall : facts.legal;
      const runs = discipline === "batting" ? facts.runs : facts.bowlerRuns;
      const wicket =
        discipline === "batting"
          ? facts.wicket && b.dismissed_player_id === id
          : facts.bowlerWicket;
      const selectedPhases = [
        flags.pressure ? "pressure" : "normal",
        ...Object.keys(bucket.scenarioCounts).filter((p) => flags[p]),
      ];
      for (const phase of selectedPhases) {
        const group = player[discipline][phase];
        group.balls += Number(countBall);
        group.runs += runs;
        group.wickets += Number(wicket);
        group.dots += Number(countBall && runs === 0);
        group.boundaries += Number(countBall && facts.boundary);
        const sample = (group.samples[inningsKey] ||= { balls: 0, runs: 0 });
        sample.balls += Number(countBall);
        sample.runs += runs;
      }
    }
    state.runs += facts.totalRuns;
    state.wickets += Number(facts.wicket);
    state.legal += Number(facts.legal);
    bucket.deliveries++;
    bucket.pressureDeliveries += Number(flags.pressure);
    bucket.matches.add(b.match_id);
    audit.includedRows++;
    for (const phase of Object.keys(bucket.scenarioCounts))
      bucket.scenarioCounts[phase] += Number(flags[phase]);
  }
  const result = {
    schemaVersion: 2,
    source: "Supplied SupeRR Selector data pack",
    totalDeliveries: audit.includedRows,
    audit,
    caveat:
      "Source seasons and results are not independently verified. Auction availability, age, nationality and market prices are not supplied.",
    buckets: [...buckets.values()].map((b) => ({
      ...b,
      matches: b.matches.size,
      players: [...b.players.values()].map((p) => ({
        ...p,
        teams: [...p.teams].sort(),
      })),
    })),
  };
  await mkdir("src/data", { recursive: true });
  await writeFile("src/data/analytics.json", JSON.stringify(result));
  console.log(JSON.stringify(audit, null, 2));
} catch (error) {
  console.error(`Data preparation failed: ${error.message}`);
  process.exitCode = 1;
}
