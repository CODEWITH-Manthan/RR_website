/** Single source of truth for PRI, baselines, sample evidence and scouting rules.
 * Differential = clamp(50 + 100 * favourable relative rate change, 0, 100).
 * Consistency = share of >=6-ball pressure innings/spells beating the scope's
 * pooled normal rate. Confidence = 100*n/(n+10). Default weights: 45/35/20.
 * The score is descriptive, not a causal measure or an auction price forecast.
 */
export const DEFAULT_WEIGHTS = {
  differential: 45,
  consistency: 35,
  confidence: 20,
};
export const SCENARIOS = {
  chasing: "Chasing · overs 11+",
  death: "Death · overs 16–20",
  highRate: "Required rate ≥10",
  wicketsDown: "Four wickets down",
};
export const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN").format(value);
const clamp = (value) => Math.max(0, Math.min(100, value));
export const rate = (stats, discipline) =>
  stats?.balls
    ? (stats.runs / stats.balls) * (discipline === "batting" ? 100 : 6)
    : 0;
export function calculatePRI(
  { pressureRate, normalRate, consistency, sampleSize, discipline },
  weights = DEFAULT_WEIGHTS,
) {
  const direction = discipline === "bowling" ? -1 : 1;
  const relativeChange =
    normalRate > 0 ? (direction * (pressureRate - normalRate)) / normalRate : 0;
  const differential = clamp(50 + relativeChange * 100),
    confidence =
      (Math.max(0, sampleSize) / (Math.max(0, sampleSize) + 10)) * 100;
  const safe = Object.fromEntries(
    Object.entries(DEFAULT_WEIGHTS).map(([k, v]) => [
      k,
      Number.isFinite(weights[k]) ? Math.max(0, weights[k]) : v,
    ]),
  );
  const total = Object.values(safe).reduce((a, b) => a + b, 0);
  return {
    score: total
      ? (differential * safe.differential +
          clamp(consistency) * safe.consistency +
          confidence * safe.confidence) /
        total
      : 0,
    differential,
    confidence,
    relativeChange,
  };
}
export function wilsonInterval(successes, n) {
  if (!n) return [0, 100];
  const z = 1.96,
    p = successes / n,
    denominator = 1 + (z * z) / n;
  const mid = (p + (z * z) / (2 * n)) / denominator,
    spread =
      (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denominator;
  return [
    successes === 0 ? 0 : Math.max(0, (mid - spread) * 100),
    successes === n ? 100 : Math.min(100, (mid + spread) * 100),
  ];
}
const phases = ["pressure", "normal", ...Object.keys(SCENARIOS)];
const empty = () => ({
  balls: 0,
  runs: 0,
  wickets: 0,
  dots: 0,
  boundaries: 0,
  samples: {},
});
const newDiscipline = () => Object.fromEntries(phases.map((p) => [p, empty()]));
const sampleCount = (stats) =>
  Object.values(stats.samples).filter((s) => s.balls >= 6).length;
export function buildOverview(
  data,
  league,
  season,
  weights = DEFAULT_WEIGHTS,
  options = {},
) {
  const buckets = data.buckets.filter(
    (b) =>
      (league === "All leagues" || b.league === league) &&
      (season === "All seasons" || b.season === season),
  );
  const merged = new Map();
  for (const b of buckets)
    for (const p of b.players) {
      if (!merged.has(p.id))
        merged.set(p.id, {
          id: p.id,
          name: p.name,
          keeper: p.keeper,
          teams: new Set(),
          battingStyle: "",
          bowlingStyle: "",
          batting: newDiscipline(),
          bowling: newDiscipline(),
        });
      const player = merged.get(p.id);
      (p.teams || []).forEach((t) => player.teams.add(t));
      player.battingStyle = p.battingStyle || player.battingStyle;
      player.bowlingStyle = p.bowlingStyle || player.bowlingStyle;
      for (const d of ["batting", "bowling"])
        for (const phase of phases) {
          const source = p[d][phase];
          if (!source) continue;
          for (const stat of ["balls", "runs", "wickets", "dots", "boundaries"])
            player[d][phase][stat] += source[stat] || 0;
          Object.assign(player[d][phase].samples, source.samples);
        }
    }
  const raw = [...merged.values()],
    baselines = {};
  for (const d of ["batting", "bowling"]) {
    baselines[d] = {};
    for (const phase of phases) {
      const pooled = raw.reduce(
        (a, p) => ({
          balls: a.balls + p[d][phase].balls,
          runs: a.runs + p[d][phase].runs,
        }),
        { balls: 0, runs: 0 },
      );
      baselines[d][phase] = { ...pooled, rate: rate(pooled, d) };
    }
  }
  function summarize(p, discipline) {
    const bat = p.batting.pressure.balls + p.batting.normal.balls,
      bowl = p.bowling.pressure.balls + p.bowling.normal.balls;
    const role = p.keeper
      ? "WK-Batter"
      : bat >= 60 && bowl >= 60
        ? "All-rounder"
        : bowl > bat
          ? "Bowler"
          : "Batter";
    const pressure = p[discipline].pressure,
      normal = p[discipline].normal;
    const samples = Object.values(pressure.samples).filter((s) => s.balls >= 6);
    const good = samples.filter((s) =>
      discipline === "batting"
        ? rate(s, discipline) >= baselines[discipline].normal.rate
        : rate(s, discipline) <= baselines[discipline].normal.rate,
    ).length;
    const inputs = {
      pressureRate: rate(pressure, discipline),
      normalRate: rate(normal, discipline),
      consistency: samples.length ? (100 * good) / samples.length : 0,
      sampleSize: samples.length,
      discipline,
    };
    const stats = Object.fromEntries(
      phases.map((phase) => {
        const s = p[discipline][phase];
        return [
          phase,
          {
            balls: s.balls,
            runs: s.runs,
            wickets: s.wickets,
            rate: rate(s, discipline),
            sampleSize: sampleCount(s),
            dotPct: s.balls ? (100 * s.dots) / s.balls : 0,
            boundaryPct: s.balls ? (100 * s.boundaries) / s.balls : 0,
          },
        ];
      }),
    );
    return {
      id: p.id,
      name: p.name,
      role,
      teams: [...p.teams].sort(),
      battingStyle: p.battingStyle,
      bowlingStyle: p.bowlingStyle,
      ...inputs,
      pressureBalls: pressure.balls,
      normalBalls: normal.balls,
      normalSamples: sampleCount(normal),
      consistencyInterval: wilsonInterval(good, samples.length),
      goodOutcomes: good,
      eligible:
        samples.length >= 5 && pressure.balls >= 30 && normal.balls >= 30,
      stats,
      baselines: baselines[discipline],
      ...calculatePRI(inputs, weights),
    };
  }
  const allPlayers = raw
    .map((p) =>
      summarize(
        p,
        options.discipline ||
          (p.batting.pressure.balls + p.batting.normal.balls >=
          p.bowling.pressure.balls + p.bowling.normal.balls
            ? "batting"
            : "bowling"),
      ),
    )
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.sampleSize - a.sampleSize ||
        a.name.localeCompare(b.name),
    );
  const players = allPlayers.filter((p) => p.eligible);
  return {
    players,
    allPlayers,
    baselines,
    playersAnalysed: raw.length,
    matches: buckets.reduce((n, b) => n + b.matches, 0),
    deliveries: buckets.reduce((n, b) => n + b.deliveries, 0),
    pressureDeliveries: buckets.reduce((n, b) => n + b.pressureDeliveries, 0),
    scenarioCounts: Object.fromEntries(
      Object.keys(SCENARIOS).map((k) => [
        k,
        buckets.reduce((n, b) => n + (b.scenarioCounts?.[k] || 0), 0),
      ]),
    ),
  };
}
export const evidenceRisk = (player) =>
  player.sampleSize >= 30
    ? "Lower"
    : player.sampleSize >= 15
      ? "Moderate"
      : "High";
export function roleNeed(p) {
  if (p.discipline === "bowling")
    return p.stats.death.balls >= 30 ? "Death bowler" : "Bowling depth";
  if (p.role === "WK-Batter") return "Wicketkeeper";
  return p.stats.death.balls >= 30 ? "Finisher" : "Batting depth";
}
export function recommendation(p) {
  if (!p.eligible) return "Insufficient evidence";
  if (p.score >= 70 && p.sampleSize >= 15) return "Bid candidate";
  if (p.score >= 55) return "Scout further";
  return "Skip at premium";
}
/** Explicit planning heuristic. Not historical prices or a market forecast.
 * Per-slot budget * relative PRI * evidence discount; rounded down to 0.1 crore.
 */
export function bidEstimate(p, purse = 45, slots = 6) {
  const budget = Number.isFinite(+purse) ? Math.max(0, +purse) : 0;
  const count = Number.isFinite(+slots) ? Math.max(1, Math.floor(+slots)) : 1;
  const ceiling = p.eligible
    ? Math.floor(
        Math.min(
          budget,
          (budget / count) * (p.score / 70) * (0.5 + p.confidence / 200),
        ) * 10,
      ) / 10
    : 0;
  return { ceiling, low: Math.floor(ceiling * 0.7 * 10) / 10 };
}
export function radarMetrics(p) {
  return [
    { metric: "Differential", value: p.differential },
    { metric: "Consistency", value: p.consistency },
    { metric: "Confidence", value: p.confidence },
    { metric: "Chasing", value: scenarioIndex(p, "chasing") },
    { metric: "Death overs", value: scenarioIndex(p, "death") },
  ];
}
export function scenarioIndex(p, key) {
  const s = p.stats[key],
    base = p.baselines[key];
  if (!s.balls || !base.balls || !base.rate) return null;
  return clamp(
    50 +
      (100 * (p.discipline === "bowling" ? -1 : 1) * (s.rate - base.rate)) /
        base.rate,
  );
}
