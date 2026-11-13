import React, { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SCENARIOS } from "../utils/pressureIndex.js";
import {
  EmptyState,
  PageHeading,
  PlayerTable,
  Sample,
} from "../components/AnalyticsUI.jsx";
import PlayerRadar from "../components/PlayerRadar.jsx";
function SplitTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <strong>{r.name}</strong>
      <span>
        Player: {r.player === null ? "No data" : r.player.toFixed(1)} · n=
        {r.playerBalls} balls
      </span>
      <span>
        Scope: {r.average === null ? "No data" : r.average.toFixed(1)} · n=
        {r.scopeBalls} balls
      </span>
    </div>
  );
}
export default function Discipline(props) {
  const { discipline, model, onSelect } = props;
  const [selected, setSelected] = useState(""),
    [search, setSearch] = useState("");
  const players = model.players,
    player = players.find((p) => p.id === selected) || players[0];
  const batting = discipline === "batting",
    label = batting ? "Strike rate" : "Economy";
  if (!player)
    return (
      <>
        <PageHeading title={batting ? "Batters." : "Bowlers."}>
          Discipline-specific pressure evidence.
        </PageHeading>
        <EmptyState />
      </>
    );
  const splits = Object.entries(SCENARIOS).map(([key, name]) => ({
    key,
    name: name.split(" · ")[0],
    player: player.stats[key].balls ? player.stats[key].rate : null,
    average: player.baselines[key].balls ? player.baselines[key].rate : null,
    playerBalls: player.stats[key].balls,
    scopeBalls: player.baselines[key].balls,
  }));
  const matches = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="workspace-page">
      <PageHeading
        eyebrow={`${batting ? "BATTING" : "BOWLING"} INTELLIGENCE`}
        title={
          batting
            ? "Make every pressure ball count."
            : "Own the difficult overs."
        }
      >
        {batting
          ? "Strike rate, boundary output and repeatable outcomes."
          : "Economy, wickets and control when the game tightens."}{" "}
        All-rounders are evaluated in this discipline.
      </PageHeading>
      <div className="player-selection panel">
        <div>
          <span className="eyebrow">PLAYER IN FOCUS</span>
          <h2>{player.name}</h2>
          <p>
            {player.role} ·{" "}
            {batting ? player.battingStyle : player.bowlingStyle} · n=
            {player.sampleSize} pressure samples
          </p>
        </div>
        <label>
          Inspect player
          <select
            aria-label={`Select ${discipline} player`}
            value={player.id}
            onChange={(e) => setSelected(e.target.value)}
          >
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <button className="button primary" onClick={() => onSelect(player)}>
          Open player dossier
        </button>
      </div>
      <div className="evidence-grid">
        {[
          {
            name: `Pressure ${label.toLowerCase()}`,
            value: player.pressureRate.toFixed(1),
            n: player.pressureBalls,
            unit: "balls",
          },
          {
            name: `Normal ${label.toLowerCase()}`,
            value: player.normalRate.toFixed(1),
            n: player.normalBalls,
            unit: "balls",
          },
          {
            name: batting ? "Pressure runs" : "Pressure wickets",
            value: batting
              ? player.stats.pressure.runs
              : player.stats.pressure.wickets,
            n: player.pressureBalls,
            unit: "balls",
          },
          {
            name: "Good pressure outcomes",
            value: `${player.consistency.toFixed(0)}%`,
            n: player.sampleSize,
            unit: "samples",
          },
        ].map((m) => (
          <article className="panel evidence-stat" key={m.name}>
            <span>{m.name}</span>
            <strong>{m.value}</strong>
            <Sample n={m.n} unit={m.unit} />
          </article>
        ))}
      </div>
      <div className="detail-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">SITUATION BREAKDOWN</div>
              <h2>Pressure splits vs scope average</h2>
            </div>
          </div>
          <div
            className="split-chart"
            role="img"
            aria-label={`${player.name} ${label} across four pressure scenarios, compared with the selected league and season. Exact values follow.`}
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart
                data={splits}
                margin={{ top: 25, right: 20, left: 0, bottom: 10 }}
              >
                <CartesianGrid stroke="#29354e" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#afbdd5", fontSize: 9 }}
                  interval={0}
                />
                <YAxis tick={{ fill: "#8c9ebd", fontSize: 10 }} />
                <Tooltip content={<SplitTooltip />} />
                <Legend />
                <Bar
                  dataKey="player"
                  name={player.name}
                  fill="#ed57a6"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="average"
                  name="Scope average"
                  fill="#5c7ed2"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="chart-explanation">
            {label} · {batting ? "Higher" : "Lower"} is better. Scenarios
            overlap; do not sum their samples.
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>SCENARIO</th>
                  <th>PLAYER (BALLS)</th>
                  <th>SCOPE (BALLS)</th>
                </tr>
              </thead>
              <tbody>
                {splits.map((s) => (
                  <tr key={s.key}>
                    <td>{SCENARIOS[s.key]}</td>
                    <td>
                      {s.player === null ? "—" : s.player.toFixed(1)}
                      <Sample n={s.playerBalls} unit="balls" />
                    </td>
                    <td>
                      {s.average === null ? "—" : s.average.toFixed(1)}
                      <Sample n={s.scopeBalls} unit="balls" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">PERFORMANCE PROFILE</div>
              <h2>Strength with evidence</h2>
            </div>
          </div>
          <PlayerRadar players={[player]} />
        </section>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">DISCIPLINE RANKING</div>
            <h2>{batting ? "Batting" : "Bowling"} pressure leaders</h2>
          </div>
          <label className="search-field">
            <input
              aria-label={`Search ${discipline} players`}
              placeholder="Find a player…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        <p className="context-note">
          Top 10 of {matches.length} matching players. Use Pressure Index for
          the complete primary-discipline ranking.
        </p>
        {matches.length ? (
          <PlayerTable {...props} players={matches.slice(0, 10)} />
        ) : (
          <EmptyState />
        )}
      </section>
    </div>
  );
}
