import React, { useMemo, useState } from "react";
import {
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
const colors = {
  Batter: "#f25baf",
  "WK-Batter": "#c495f9",
  Bowler: "#628cff",
  "All-rounder": "#e2bd62",
};
function percentile(value, values, reverse) {
  if (values.length <= 1) return 50;
  let below = 0,
    equal = 0;
  for (const v of values) {
    if (v < value) below++;
    if (v === value) equal++;
  }
  const p = (100 * (below + (equal - 1) / 2)) / (values.length - 1);
  return reverse ? 100 - p : p;
}
function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <strong>{p.name}</strong>
      <span>
        {p.role} · n={p.sampleSize} pressure samples
      </span>
      <span>
        Pressure {p.discipline === "batting" ? "SR" : "economy"}:{" "}
        {p.pressureRate.toFixed(1)} · n={p.pressureBalls} balls
      </span>
      <span>
        Normal: {p.normalRate.toFixed(1)} · n={p.normalBalls} balls
      </span>
      <span>
        PRI {p.score.toFixed(1)} / 100 · n={p.sampleSize}
      </span>
    </div>
  );
}
export default function PressureChart({ players, onSelect }) {
  const [discipline, setDiscipline] = useState("batting");
  const eligible = useMemo(() => {
    const cohort = players.filter((p) => p.discipline === discipline);
    const normal = cohort.map((p) => p.normalRate),
      pressure = cohort.map((p) => p.pressureRate);
    return cohort.map((p) => ({
      ...p,
      x: percentile(p.normalRate, normal, discipline === "bowling"),
      y: percentile(p.pressureRate, pressure, discipline === "bowling"),
    }));
  }, [players, discipline]);
  return (
    <section
      className="panel performance-panel"
      aria-labelledby="performance-heading"
    >
      <div className="panel-heading">
        <div>
          <div className="eyebrow">THE PRESSURE TEST</div>
          <h2 id="performance-heading">Who rises to the occasion?</h2>
        </div>
        <span className="quality-chip">n={eligible.length} players</span>
      </div>
      <div className="chart-toolbar">
        <p>Normal vs pressure · within-cohort percentiles</p>
        <div className="segmented" aria-label="Chart discipline">
          <button
            aria-pressed={discipline === "batting"}
            onClick={() => setDiscipline("batting")}
          >
            Batting
          </button>
          <button
            aria-pressed={discipline === "bowling"}
            onClick={() => setDiscipline("bowling")}
          >
            Bowling
          </button>
        </div>
      </div>
      <div
        className="chart-container pressure-map"
        role="img"
        aria-label={`${discipline} pressure map for ${eligible.length} players, higher is better on both percentile axes. Gold/pink top-right marks clutch stars; bubble size represents samples. Exact rates and sample counts are in the accessible data table.`}
      >
        {eligible.length ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <ScatterChart margin={{ top: 22, right: 20, bottom: 25, left: 4 }}>
              <CartesianGrid stroke="#26314b" strokeDasharray="3 6" />
              <XAxis
                type="number"
                dataKey="x"
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fill: "#9aaac6", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                label={{
                  value: "NORMAL PERFORMANCE PERCENTILE →",
                  position: "bottom",
                  fill: "#9aaac6",
                  fontSize: 9,
                  offset: 8,
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                width={40}
                tick={{ fill: "#9aaac6", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <ZAxis type="number" dataKey="sampleSize" range={[35, 260]} />
              <ReferenceArea
                x1={50}
                x2={100}
                y1={50}
                y2={100}
                fill="#d4af37"
                fillOpacity={0.06}
                label={{
                  value: "CLUTCH STARS",
                  position: "insideTopRight",
                  fill: "#d7b968",
                  fontSize: 9,
                }}
              />
              <ReferenceArea
                x1={0}
                x2={50}
                y1={50}
                y2={100}
                fill="#ea1a85"
                fillOpacity={0.035}
                label={{
                  value: "PRESSURE RISERS",
                  position: "insideTopLeft",
                  fill: "#d899c4",
                  fontSize: 9,
                }}
              />
              <ReferenceArea
                x1={0}
                x2={50}
                y1={0}
                y2={50}
                fill="#76869b"
                fillOpacity={0.02}
                label={{
                  value: "AVOID",
                  position: "insideBottomLeft",
                  fill: "#8797b4",
                  fontSize: 9,
                }}
              />
              <ReferenceArea
                x1={50}
                x2={100}
                y1={0}
                y2={50}
                fill="#254aa5"
                fillOpacity={0.035}
                label={{
                  value: "FLAT-TRACK BULLIES",
                  position: "insideBottomRight",
                  fill: "#93a7d2",
                  fontSize: 9,
                }}
              />
              <ReferenceLine x={50} stroke="#78849d" strokeDasharray="4 5" />
              <ReferenceLine y={50} stroke="#78849d" strokeDasharray="4 5" />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ strokeDasharray: "3 3" }}
              />
              {Object.entries(colors).map(([role, color]) => (
                <Scatter
                  key={role}
                  name={role}
                  data={eligible.filter((p) => p.role === role)}
                  fill={color}
                  fillOpacity={0.8}
                  isAnimationActive={false}
                  onClick={(point) => onSelect?.(point.payload || point)}
                  style={{ cursor: onSelect ? "pointer" : "default" }}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <p className="empty-chart">
            No eligible players in this discipline and scope.
          </p>
        )}
      </div>
      <div className="chart-legend">
        {Object.entries(colors).map(([role, color]) => (
          <span key={role}>
            <i style={{ background: color }} />
            {role}
          </span>
        ))}
        <span className="bubble-note">Bubble size = pressure samples</span>
      </div>
      <p className="chart-footnote">
        Y = pressure percentile · Median guides at 50 · Bowling economy is
        reversed · Quadrants are descriptive, not bid advice.
      </p>
      <details className="chart-data">
        <summary>Accessible chart data & player dossiers</summary>
        <div className="table-scroll">
          <table>
            <caption className="sr-only">
              Raw rates and samples underlying the percentile map
            </caption>
            <thead>
              <tr>
                <th>PLAYER</th>
                <th>NORMAL RATE</th>
                <th>PRESSURE RATE</th>
                <th>PRESSURE SAMPLES</th>
              </tr>
            </thead>
            <tbody>
              {eligible.map((p) => (
                <tr key={p.id}>
                  <td>
                    {onSelect ? (
                      <button
                        className="text-button"
                        onClick={() => onSelect(p)}
                      >
                        {p.name}
                      </button>
                    ) : (
                      p.name
                    )}
                  </td>
                  <td>
                    {p.normalRate.toFixed(1)}
                    <small>n={p.normalBalls} balls</small>
                  </td>
                  <td>
                    {p.pressureRate.toFixed(1)}
                    <small>n={p.pressureBalls} balls</small>
                  </td>
                  <td>{p.sampleSize}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
