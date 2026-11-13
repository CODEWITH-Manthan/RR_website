import React, { useEffect, useRef } from "react";
import { X, GitCompareArrows } from "lucide-react";
import {
  bidEstimate,
  recommendation,
  roleNeed,
  SCENARIOS,
} from "../utils/pressureIndex.js";
import { RiskBadge, SaveButton, Sample } from "./AnalyticsUI.jsx";
export default function PlayerDrawer({
  player,
  onClose,
  shortlist,
  toggleShortlist,
  compareIds,
  toggleCompare,
  purse,
  slots,
  league,
  season,
}) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (player && !dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [player?.id, player?.discipline]);
  if (!player) return null;
  const p = player,
    bid = bidEstimate(p, purse, slots);
  return (
    <dialog
      ref={ref}
      className="player-dialog"
      aria-labelledby="dossier-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dossier-body">
        <div className="dossier-top">
          <span className="eyebrow gold-text">
            PLAYER DOSSIER · {league} / {season}
          </span>
          <button
            className="icon-button"
            aria-label="Close player dossier"
            onClick={onClose}
            autoFocus
          >
            <X size={22} />
          </button>
        </div>
        <div className="dossier-identity">
          <div
            className="photo-placeholder"
            aria-label="Player photo placeholder"
          >
            {p.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
            <small>PHOTO</small>
          </div>
          <div>
            <h2 id="dossier-title">{p.name}</h2>
            <p>
              {p.role} · Evaluated in {p.discipline}
            </p>
            <span>
              {p.battingStyle || "Batting style unavailable"} /{" "}
              {p.bowlingStyle || "Bowling style unavailable"}
            </span>
          </div>
        </div>
        <p className="context-note">
          Recorded teams: {p.teams.join(", ") || "Not supplied"}. Age,
          nationality and auction availability are not supplied.
        </p>
        <div className="dossier-actions">
          <SaveButton player={p} {...{ shortlist, toggleShortlist }} />
          <span>
            {shortlist.includes(p.id)
              ? "On your shortlist"
              : "Save to shortlist"}
          </span>
          <button
            className="button secondary"
            onClick={() => toggleCompare(p.id)}
          >
            <GitCompareArrows size={15} />
            {compareIds.includes(p.id)
              ? "Remove from comparison"
              : "Add to comparison"}
          </button>
        </div>
        <div className="evidence-grid dossier-stats">
          <article className="evidence-stat">
            <span>Pressure Reliability Index</span>
            <strong>{p.eligible ? p.score.toFixed(1) : "Unrated"}</strong>
            <Sample n={p.sampleSize} />
          </article>
          <article className="evidence-stat">
            <span>Good outcomes</span>
            <strong>{p.consistency.toFixed(0)}%</strong>
            <small>
              {p.goodOutcomes} / {p.sampleSize} pressure samples
            </small>
            <small>
              95% interval:{" "}
              {p.consistencyInterval.map((v) => v.toFixed(0)).join("–")}%
            </small>
          </article>
        </div>
        <div className="dossier-risk">
          <RiskBadge player={p} />
          <strong>{recommendation(p)}</strong>
        </div>
        <h3>Pressure versus normal</h3>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>CONDITION</th>
                <th>
                  {p.discipline === "batting" ? "STRIKE RATE" : "ECONOMY"}
                </th>
                <th>SAMPLES ≥6 BALLS</th>
              </tr>
            </thead>
            <tbody>
              {["pressure", "normal"].map((k) => (
                <tr key={k}>
                  <td className="capitalize">{k}</td>
                  <td>
                    {p.stats[k].balls ? p.stats[k].rate.toFixed(1) : "—"}
                    <Sample n={p.stats[k].balls} unit="balls" />
                  </td>
                  <td>{p.stats[k].sampleSize}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3>Situation evidence</h3>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>SCENARIO</th>
                <th>PLAYER RATE</th>
                <th>SCOPE RATE</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(SCENARIOS).map(([k, name]) => (
                <tr key={k}>
                  <td>{name}</td>
                  <td>
                    {p.stats[k].balls ? p.stats[k].rate.toFixed(1) : "—"}
                    <Sample n={p.stats[k].balls} unit="balls" />
                  </td>
                  <td>
                    {p.baselines[k].balls
                      ? p.baselines[k].rate.toFixed(1)
                      : "—"}
                    <Sample n={p.baselines[k].balls} unit="balls" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <section className="fit-note">
          <div className="eyebrow gold-text">HOW HE COULD FIT RR</div>
          <h3>{roleNeed(p)} · a role-based scouting hypothesis</h3>
          <p>
            For an RR {roleNeed(p).toLowerCase()} search, {p.name} offers{" "}
            {p.pressureRate.toFixed(1)} pressure{" "}
            {p.discipline === "batting" ? "strike rate" : "economy"} over{" "}
            {p.pressureBalls} balls.{" "}
            {p.relativeChange >= 0 ? "The rate improves" : "The rate declines"}{" "}
            by {Math.abs(p.relativeChange * 100).toFixed(1)}% against normal
            conditions (n={p.normalBalls} balls). Validate roster fit,
            availability and opposition before committing.
          </p>
        </section>
        <div className="bid-band">
          <span>Hypothetical planning band</span>
          <strong>
            {p.eligible
              ? `₹${bid.low.toFixed(1)}–${bid.ceiling.toFixed(1)} cr`
              : "Not enough evidence"}
          </strong>
          <small>
            Based on ₹{purse} cr across {slots} target slots · n={p.sampleSize}{" "}
            pressure samples. Not a market valuation.
          </small>
        </div>
      </div>
    </dialog>
  );
}
