import React from "react";
import { Bookmark, Plus, Printer } from "lucide-react";
import {
  bidEstimate,
  evidenceRisk,
  recommendation,
  roleNeed,
} from "../utils/pressureIndex.js";
import {
  PageHeading,
  EmptyState,
  RiskBadge,
  SaveButton,
  downloadCSV,
  ExportButton,
} from "../components/AnalyticsUI.jsx";
export function suggestedPicks(players) {
  const picks = [];
  const add = (p) => {
    if (p && !picks.some((x) => x.id === p.id)) picks.push(p);
  };
  for (const d of ["batting", "bowling"]) {
    const pool = players.filter((p) => p.discipline === d);
    pool.slice(0, 2).forEach(add);
    add(pool.find((p) => p.sampleSize >= 5 && p.sampleSize < 15));
  }
  for (const p of players) if (picks.length < 6) add(p);
  return picks.slice(0, 6);
}
export default function Shortlist(props) {
  const {
    shortlist,
    setShortlist,
    toggleShortlist,
    overview,
    globalPlayers,
    notes,
    setNotes,
    purse,
    setPurse,
    slots,
    setSlots,
    onSelect,
    league,
    season,
  } = props;
  const active = shortlist
    .map((id) => overview.allPlayers.find((p) => p.id === id))
    .filter(Boolean);
  const outside = shortlist.filter((id) => !active.some((p) => p.id === id));
  const suggestions = suggestedPicks(overview.players);
  const total = active.reduce(
    (n, p) => n + bidEstimate(p, purse, slots).ceiling,
    0,
  );
  const money = (value) => `₹${value.toFixed(1)} cr`;
  const exportRows = () =>
    downloadCSV("rr-auction-shortlist.csv", [
      ["Scope", league, season],
      ["Hypothetical purse (crore)", purse, "Target slots", slots],
      [
        "Player",
        "Scope status",
        "Role need",
        "PRI",
        "Pressure samples",
        "Planning ceiling INR crore",
        "Evidence risk",
        "Analyst notes",
      ],
      ...active.map((p) => [
        p.name,
        p.eligible ? "Eligible" : "Insufficient evidence",
        roleNeed(p),
        p.eligible ? p.score.toFixed(1) : "",
        p.sampleSize,
        bidEstimate(p, purse, slots).ceiling,
        evidenceRisk(p),
        notes[p.id] || "",
      ]),
      ...outside.map((id) => [
        globalPlayers.find((p) => p.id === id)?.name || id,
        "No evidence in selected scope",
        "",
        "",
        "",
        "",
        "",
        notes[id] || "",
      ]),
    ]);
  return (
    <div className="workspace-page shortlist-page">
      <PageHeading
        title="Build a squad. Back the evidence."
        action={
          <div className="action-group">
            <ExportButton onClick={exportRows} />
            <button className="button primary" onClick={() => window.print()}>
              <Printer size={16} />
              Print / PDF
            </button>
          </div>
        }
      >
        A persistent scouting board with editable planning assumptions and
        player notes.
      </PageHeading>
      <section className="panel budget-panel">
        <div>
          <div className="eyebrow gold-text">AUCTION PLANNING SCENARIO</div>
          <h2>Your purse. Your limits.</h2>
          <p>
            Hypothetical ceilings, not market valuations. Availability must be
            verified.
          </p>
        </div>
        <label>
          Planning purse (₹ crore)
          <input
            aria-label="Planning purse in crore"
            type="number"
            min="0"
            max="200"
            step=".5"
            value={purse}
            onChange={(e) =>
              setPurse(Math.min(200, Math.max(0, +e.target.value)))
            }
          />
        </label>
        <label>
          Target roster slots
          <input
            aria-label="Target roster slots"
            type="number"
            min="1"
            max="25"
            value={slots}
            onChange={(e) =>
              setSlots(Math.min(25, Math.max(1, Math.floor(+e.target.value))))
            }
          />
        </label>
      </section>
      <div className="evidence-grid">
        <article className="panel evidence-stat">
          <span>Saved players</span>
          <strong>{shortlist.length}</strong>
          <small>{active.length} have evidence in this scope</small>
        </article>
        <article className="panel evidence-stat">
          <span>Total planning ceilings</span>
          <strong>{money(total)}</strong>
          <small>
            n={active.filter((p) => p.eligible).length} eligible saved players
          </small>
        </article>
        <article className="panel evidence-stat">
          <span>Unallocated scenario purse</span>
          <strong className={total > purse ? "pink-text" : ""}>
            {money(purse - total)}
          </strong>
          <small>
            {outside.length
              ? "Excludes players with no scope data"
              : "All current ceilings included"}
          </small>
        </article>
        <article className="panel evidence-stat">
          <span>Target slots remaining</span>
          <strong>{Math.max(0, slots - shortlist.length)}</strong>
          <small>
            {shortlist.length} selections / {slots} target slots
          </small>
        </article>
      </div>
      {total > purse && (
        <p className="inline-warning" role="alert">
          The combined ceilings exceed your planning purse. Reduce selections or
          revise your assumptions before bidding.
        </p>
      )}
      {shortlist.length > slots && (
        <p className="inline-warning" role="alert">
          You have more shortlisted players than target roster slots.
        </p>
      )}
      {!shortlist.length && (
        <EmptyState title="Your board is ready for its first pick.">
          Save players from any ranking, or add the balanced six-player research
          draft below.
        </EmptyState>
      )}
      <div className="pick-grid">
        {active.map((p) => {
          const bid = bidEstimate(p, purse, slots);
          return (
            <article className="panel pick-card" key={p.id}>
              <div className="pick-top">
                <span className="role-pill">{roleNeed(p)}</span>
                <SaveButton player={p} {...{ shortlist, toggleShortlist }} />
              </div>
              <button
                className="text-button pick-name"
                onClick={() => onSelect(p)}
              >
                {p.name}
              </button>
              <p>
                {p.role} · {p.discipline}
              </p>
              <div className="pick-score">
                <strong>
                  {p.eligible ? p.score.toFixed(1) : "—"}
                  <small>PRI / 100 · n={p.sampleSize}</small>
                </strong>
                <RiskBadge player={p} />
              </div>
              <div className="bid-band">
                <span>Planning ceiling</span>
                <strong>{p.eligible ? money(bid.ceiling) : "Unrated"}</strong>
                <small>
                  {p.eligible
                    ? `Exploration band ${money(bid.low)}–${money(bid.ceiling)}`
                    : "Needs 5 samples and 30 balls in both conditions"}
                </small>
              </div>
              <p className="pick-decision">
                {recommendation(p)}
                {p.sampleSize < 15 ? " · Lower-exposure research pick" : ""}
              </p>
              <label className="note-editor">
                Analyst notes
                <textarea
                  aria-label={`Notes for ${p.name}`}
                  maxLength={1000}
                  placeholder="Role fit, availability checks, auction strategy…"
                  value={notes[p.id] || ""}
                  onChange={(e) =>
                    setNotes((prev) => ({ ...prev, [p.id]: e.target.value }))
                  }
                />
              </label>
            </article>
          );
        })}
      </div>
      {outside.length > 0 && (
        <section className="panel outside-scope">
          <h2>Saved outside the current scope</h2>
          <p>
            These players stay on your board. Change league or season to recover
            their evidence; no ceiling is assigned here.
          </p>
          {outside.map((id) => (
            <div key={id}>
              <span>
                {globalPlayers.find((p) => p.id === id)?.name || `Player ${id}`}
              </span>
              <button
                className="button secondary"
                onClick={() => toggleShortlist(id)}
              >
                Remove
              </button>
            </div>
          ))}
        </section>
      )}
      <section className="panel suggestions-panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">RESEARCH STARTING POINT</div>
            <h2>A balanced scouting draft</h2>
          </div>
          <button
            className="button secondary"
            disabled={!suggestions.length}
            onClick={() =>
              setShortlist((ids) => [
                ...new Set([...ids, ...suggestions.map((p) => p.id)]),
              ])
            }
          >
            <Plus size={15} />
            Add draft picks
          </button>
        </div>
        <p className="context-note">
          Up to six candidates across batting and bowling, including
          smaller-sample research picks where available. Lower exposure is not
          proof of uncapped status.
        </p>
        <div className="suggestion-list">
          {suggestions.map((p) => (
            <div key={p.id}>
              <button className="text-button" onClick={() => onSelect(p)}>
                {p.name}
                <small>
                  {roleNeed(p)} · PRI {p.score.toFixed(1)} · n={p.sampleSize}
                </small>
              </button>
              <SaveButton player={p} {...{ shortlist, toggleShortlist }} />
            </div>
          ))}
        </div>
      </section>
      <p className="context-note">
        Ceiling = (purse ÷ target slots) × (PRI ÷ 70) × (0.5 + confidence ÷
        200), capped at purse and rounded down to ₹0.1 crore. Each estimate uses
        n pressure samples shown on the card. These are analyst planning limits,
        not predicted auction prices.
      </p>
    </div>
  );
}
