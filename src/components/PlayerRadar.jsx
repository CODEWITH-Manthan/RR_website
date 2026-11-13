import React from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { radarMetrics } from "../utils/pressureIndex.js";
export const PLAYER_COLORS = ["#f666b1", "#7b9fff", "#e8c36b"];
export default function PlayerRadar({ players }) {
  const data = radarMetrics(players[0]).map((m, i) => ({
    metric: m.metric,
    ...Object.fromEntries(players.map((p) => [p.id, radarMetrics(p)[i].value])),
  }));
  return (
    <>
      <div
        className="radar-wrap"
        role="img"
        aria-label="Player evidence radar, 0 to 100. Exact values and sample counts follow in the table."
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <RadarChart data={data} outerRadius="67%">
            <PolarGrid stroke="#3c4865" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: "#bbc6dc", fontSize: 11 }}
            />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "#17213a",
                border: "1px solid #4e5b77",
                borderRadius: 8,
              }}
            />
            <Legend />
            <>
              {players.map((p, i) => (
                <Radar
                  key={p.id}
                  name={p.name}
                  dataKey={p.id}
                  stroke={PLAYER_COLORS[i]}
                  fill={PLAYER_COLORS[i]}
                  fillOpacity={0.12}
                  isAnimationActive={false}
                />
              ))}
            </>
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <p className="chart-explanation">
        All axes: higher is better. Scenario axes use a scope-relative rate
        index; 50 = average. Missing evidence leaves a gap. This radar is not an
        additional PRI formula.
      </p>
      <div className="table-scroll">
        <table>
          <caption className="sr-only">Radar evidence and denominators</caption>
          <thead>
            <tr>
              <th>METRIC</th>
              {players.map((p) => (
                <th key={p.id}>{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.metric}>
                <td>{row.metric}</td>
                {players.map((p) => (
                  <td key={p.id}>
                    {row[p.id] === null ? "—" : row[p.id].toFixed(1)}
                    <small>
                      {i === 0
                        ? `n=${p.pressureBalls} pressure / ${p.normalBalls} normal balls`
                        : i < 3
                          ? `n=${p.sampleSize} pressure samples`
                          : `n=${p.stats[i === 3 ? "chasing" : "death"].balls} balls`}
                    </small>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
