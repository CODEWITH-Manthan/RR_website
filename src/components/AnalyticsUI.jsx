import React from "react";
import {
  ArrowDownToLine,
  Bookmark,
  GitCompareArrows,
  Search,
} from "lucide-react";
import { evidenceRisk, recommendation } from "../utils/pressureIndex.js";

export function PageHeading({
  eyebrow = "AUCTION INTELLIGENCE",
  title,
  children,
  action,
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow pink">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{children}</p>
      </div>
      {action}
    </div>
  );
}
export function EmptyState({
  title = "No players match this scope.",
  children,
}) {
  return (
    <div className="state-panel">
      <Search size={27} />
      <h2>{title}</h2>
      <p>
        {children || "Widen the filters or choose another league and season."}
      </p>
    </div>
  );
}
export function Sample({ n, unit = "samples" }) {
  return (
    <small className="sample-label">
      n={n} {unit}
    </small>
  );
}
export function RiskBadge({ player }) {
  const risk = evidenceRisk(player);
  return (
    <span className={`risk-badge risk-${risk.toLowerCase()}`}>
      {risk} evidence risk
    </span>
  );
}
export function Score({ player }) {
  return (
    <div>
      <div className="score-cell">
        <strong>{player.eligible ? player.score.toFixed(1) : "—"}</strong>
        <div
          className="score-track"
          role="meter"
          aria-label={`${player.name} PRI`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={player.eligible ? +player.score.toFixed(1) : 0}
        >
          <span style={{ width: `${player.eligible ? player.score : 0}%` }} />
        </div>
      </div>
      <Sample n={player.sampleSize} />
    </div>
  );
}
export function SaveButton({ player, shortlist, toggleShortlist }) {
  const saved = shortlist.includes(player.id);
  return (
    <button
      className={`bookmark-button ${saved ? "saved" : ""}`}
      aria-label={`${saved ? "Remove" : "Add"} ${player.name} ${saved ? "from" : "to"} shortlist`}
      aria-pressed={saved}
      onClick={() => toggleShortlist(player.id)}
    >
      <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
export function PlayerTable({
  players,
  shortlist,
  toggleShortlist,
  compareIds,
  toggleCompare,
  onSelect,
  start = 0,
}) {
  return (
    <div className="table-scroll">
      <table className="analytics-table">
        <caption className="sr-only">
          Players with PRI and pressure samples. Select a player name to inspect
          source-derived evidence.
        </caption>
        <thead>
          <tr>
            <th>#</th>
            <th>PLAYER / ROLE</th>
            <th>PRI / 100</th>
            <th>PRESSURE RATE</th>
            <th>CONSISTENCY</th>
            <th>EVIDENCE / ACTION</th>
            <th>TOOLS</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => (
            <tr key={p.id}>
              <td>
                <span className="rank rank-gold">
                  {String(start + i + 1).padStart(2, "0")}
                </span>
              </td>
              <td>
                <button
                  className="text-button player-link"
                  onClick={() => onSelect(p)}
                >
                  {p.name}
                </button>
                <small>
                  {p.role} · {p.discipline}
                </small>
              </td>
              <td>
                <Score player={p} />
              </td>
              <td>
                <strong>
                  {p.pressureRate.toFixed(1)}{" "}
                  <span className="rate-unit">
                    {p.discipline === "batting" ? "SR" : "ECON"}
                  </span>
                </strong>
                <Sample n={p.pressureBalls} unit="balls" />
              </td>
              <td>
                {p.consistency.toFixed(0)}%<Sample n={p.sampleSize} />
              </td>
              <td>
                <RiskBadge player={p} />
                <small>{recommendation(p)}</small>
              </td>
              <td>
                <div className="table-actions">
                  <SaveButton {...{ player: p, shortlist, toggleShortlist }} />
                  <button
                    className={`bookmark-button ${compareIds.includes(p.id) ? "saved" : ""}`}
                    aria-label={`${compareIds.includes(p.id) ? "Remove" : "Compare"} ${p.name}${compareIds.includes(p.id) ? " from comparison" : ""}`}
                    aria-pressed={compareIds.includes(p.id)}
                    onClick={() => toggleCompare(p.id)}
                  >
                    <GitCompareArrows size={17} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function ExportButton({ onClick, children = "Export CSV" }) {
  return (
    <button className="button secondary" onClick={onClick}>
      <ArrowDownToLine size={16} />
      {children}
    </button>
  );
}
// Escape spreadsheet formulas in analyst notes and names before CSV download.
export function downloadCSV(filename, rows) {
  const cell = (value) => {
    let text = String(value ?? "");
    if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const blob = new Blob(
    ["\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n")],
    { type: "text/csv;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
