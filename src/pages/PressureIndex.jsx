import React, { useMemo, useState } from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { DEFAULT_WEIGHTS } from "../utils/pressureIndex.js";
import PressureChart from "../components/PressureChart.jsx";
import {
  EmptyState,
  ExportButton,
  PageHeading,
  PlayerTable,
  downloadCSV,
} from "../components/AnalyticsUI.jsx";
export default function PressureIndex(props) {
  const { overview, weights, setWeights, league, season } = props;
  const [query, setQuery] = useState(""),
    [role, setRole] = useState("All roles"),
    [team, setTeam] = useState("All teams"),
    [min, setMin] = useState(5),
    [sort, setSort] = useState("score"),
    [page, setPage] = useState(0);
  const teams = [...new Set(overview.players.flatMap((p) => p.teams))].sort();
  const filtered = useMemo(
    () =>
      overview.players
        .filter(
          (p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) &&
            (role === "All roles" || p.role === role) &&
            (team === "All teams" || p.teams.includes(team)) &&
            p.sampleSize >= min,
        )
        .sort((a, b) =>
          sort === "name"
            ? a.name.localeCompare(b.name)
            : b[sort] - a[sort] || b.sampleSize - a.sampleSize,
        ),
    [overview, query, role, team, min, sort],
  );
  const total = Object.values(weights).reduce((a, b) => a + b, 0),
    last = Math.max(0, Math.ceil(filtered.length / 15) - 1),
    current = Math.min(page, last);
  function change(setter, value) {
    setter(value);
    setPage(0);
  }
  function exportRows() {
    downloadCSV("rr-pressure-index.csv", [
      ["Scope", league, season],
      ["Weights", JSON.stringify(weights)],
      [
        "Player",
        "Role",
        "Primary discipline",
        "PRI",
        "Pressure samples",
        "Pressure balls",
        "Normal balls",
        "Pressure rate",
        "Normal rate",
        "Consistency %",
      ],
      ...filtered.map((p) => [
        p.name,
        p.role,
        p.discipline,
        p.score.toFixed(2),
        p.sampleSize,
        p.pressureBalls,
        p.normalBalls,
        p.pressureRate.toFixed(2),
        p.normalRate.toFixed(2),
        p.consistency.toFixed(2),
      ]),
    ]);
  }
  return (
    <div className="workspace-page">
      <PageHeading
        title="Pressure Reliability Index."
        action={<ExportButton onClick={exportRows} />}
      >
        Find repeatable performance. Challenge the weighting. Inspect the
        evidence.
      </PageHeading>
      <section className="panel weight-panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow gold-text">MODEL CONTROL</div>
            <h2>
              <SlidersHorizontal size={17} /> Define what reliable means.
            </h2>
          </div>
          <button
            className="button secondary"
            onClick={() => setWeights({ ...DEFAULT_WEIGHTS })}
          >
            <RotateCcw size={14} />
            Reset weights
          </button>
        </div>
        <div className="weight-grid">
          {Object.keys(DEFAULT_WEIGHTS).map((key) => (
            <label key={key}>
              <span>
                {key === "differential"
                  ? "Pressure differential"
                  : key === "consistency"
                    ? "Outcome consistency"
                    : "Sample confidence"}
                <strong>
                  {total ? Math.round((weights[key] / total) * 100) : 0}%
                </strong>
              </span>
              <input
                aria-label={`${key} weight`}
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights[key]}
                onChange={(e) =>
                  setWeights((w) => ({ ...w, [key]: +e.target.value }))
                }
              />
              <small>
                {weights[key]} weight points ·{" "}
                {key === "confidence"
                  ? "n / (n + 10)"
                  : key === "consistency"
                    ? "Good outcomes per qualifying sample"
                    : "Pressure versus normal rate"}
              </small>
            </label>
          ))}
        </div>
        {!total && (
          <p className="inline-warning" role="alert">
            All weights are zero. Scores are zero until you enable a component.
          </p>
        )}
      </section>
      <div className="filter-bar">
        <label>
          Player search
          <input
            type="search"
            placeholder="Search by name…"
            value={query}
            onChange={(e) => change(setQuery, e.target.value)}
          />
        </label>
        <label>
          Role
          <select
            value={role}
            onChange={(e) => change(setRole, e.target.value)}
          >
            {["All roles", "Batter", "WK-Batter", "Bowler", "All-rounder"].map(
              (r) => (
                <option key={r}>{r}</option>
              ),
            )}
          </select>
        </label>
        <label>
          Recorded team
          <select
            value={team}
            onChange={(e) => change(setTeam, e.target.value)}
          >
            <option>All teams</option>
            {teams.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          Minimum pressure samples
          <select value={min} onChange={(e) => change(setMin, +e.target.value)}>
            {[5, 10, 15, 20, 30, 50].map((n) => (
              <option key={n} value={n}>
                {n}+ samples
              </option>
            ))}
          </select>
        </label>
        <label>
          Sort by
          <select
            value={sort}
            onChange={(e) => change(setSort, e.target.value)}
          >
            <option value="score">PRI · highest first</option>
            <option value="sampleSize">Sample size · highest first</option>
            <option value="consistency">Consistency · highest first</option>
            <option value="relativeChange">Pressure improvement</option>
            <option value="name">Name · A–Z</option>
          </select>
        </label>
      </div>
      <p className="context-note">
        {league} / {season} · {filtered.length} eligible players · Roles are
        inferred from participation. Age and domestic/overseas filters are
        unavailable because those fields are absent from the pack.
      </p>
      <section className="panel">
        {filtered.length ? (
          <PlayerTable
            {...props}
            players={filtered.slice(current * 15, current * 15 + 15)}
            start={current * 15}
          />
        ) : (
          <EmptyState />
        )}
        <div className="pagination">
          <span>
            {filtered.length ? current * 15 + 1 : 0}–
            {Math.min((current + 1) * 15, filtered.length)} of {filtered.length}{" "}
            players
          </span>
          <button
            className="button secondary"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            Previous
          </button>
          <span>
            Page {current + 1} / {last + 1}
          </span>
          <button
            className="button secondary"
            disabled={current === last}
            onClick={() => setPage(current + 1)}
          >
            Next
          </button>
        </div>
      </section>
      <PressureChart players={filtered} onSelect={props.onSelect} />
    </div>
  );
}
