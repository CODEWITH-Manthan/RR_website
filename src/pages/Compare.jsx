import React, { useState } from "react";
import { X } from "lucide-react";
import { PageHeading, EmptyState, Sample } from "../components/AnalyticsUI.jsx";
import PlayerRadar from "../components/PlayerRadar.jsx";
export default function Compare({
  compareIds,
  toggleCompare,
  overview,
  battingModel,
  bowlingModel,
  onSelect,
  globalPlayers,
}) {
  const [discipline, setDiscipline] = useState("primary"),
    [search, setSearch] = useState("");
  const model =
    discipline === "batting"
      ? battingModel
      : discipline === "bowling"
        ? bowlingModel
        : overview;
  const selected = compareIds
    .map((id) => model.allPlayers.find((p) => p.id === id))
    .filter(Boolean);
  const options = model.players.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      !compareIds.includes(p.id),
  );
  const fields = [
    [
      "PRI / 100",
      (p) => (p.eligible ? p.score.toFixed(1) : "Not eligible"),
      (p) => `${p.sampleSize} pressure samples`,
    ],
    [
      "Primary evaluation",
      (p) => p.discipline,
      (p) => `${p.pressureBalls} pressure balls`,
    ],
    [
      "Pressure rate",
      (p) =>
        `${p.pressureRate.toFixed(1)} ${p.discipline === "batting" ? "SR" : "ECON"}`,
      (p) => `${p.pressureBalls} balls`,
    ],
    [
      "Normal rate",
      (p) =>
        `${p.normalRate.toFixed(1)} ${p.discipline === "batting" ? "SR" : "ECON"}`,
      (p) => `${p.normalBalls} balls`,
    ],
    [
      "Favourable rate change",
      (p) => `${(p.relativeChange * 100).toFixed(1)}%`,
      (p) => `${p.pressureBalls} pressure / ${p.normalBalls} normal balls`,
    ],
    [
      "Consistency",
      (p) => `${p.consistency.toFixed(1)}%`,
      (p) => `${p.sampleSize} samples`,
    ],
    [
      "Consistency 95% interval",
      (p) => p.consistencyInterval.map((v) => v.toFixed(0)).join("–") + "%",
      (p) => `${p.sampleSize} samples`,
    ],
    [
      "Confidence heuristic",
      (p) => `${p.confidence.toFixed(1)} / 100`,
      (p) => `${p.sampleSize} samples`,
    ],
  ];
  return (
    <div className="workspace-page">
      <PageHeading title="The decision, side by side.">
        Compare up to three players using the same league, season and model
        weights.
      </PageHeading>
      <div className="filter-bar">
        <label>
          Evaluation discipline
          <select
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
          >
            <option value="primary">Primary discipline</option>
            <option value="batting">Batting only</option>
            <option value="bowling">Bowling only</option>
          </select>
        </label>
        <label>
          Find a player
          <input
            type="search"
            placeholder="Search eligible players…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          Add to comparison
          <select
            aria-label="Add player to comparison"
            value=""
            disabled={compareIds.length >= 3}
            onChange={(e) => e.target.value && toggleCompare(e.target.value)}
          >
            <option value="">
              {compareIds.length >= 3
                ? "Three players selected"
                : "Choose a player"}
            </option>
            {options.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="compare-chips">
        {compareIds.map((id) => {
          const p =
            selected.find((p) => p.id === id) ||
            globalPlayers.find((p) => p.id === id);
          return (
            <span key={id}>
              {p?.name || id}
              {!selected.some((p) => p.id === id) && " · no data in scope"}
              <button
                aria-label={`Remove ${p?.name || id} from comparison`}
                onClick={() => toggleCompare(id)}
              >
                <X size={14} />
              </button>
            </span>
          );
        })}
      </div>
      {selected.length < 2 ? (
        <EmptyState title="Choose two or three players.">
          Add players above or use the compare icon in any ranking. Selections
          stay with you across pages.
        </EmptyState>
      ) : (
        <>
          <p className="context-note">
            {discipline === "primary"
              ? "Primary-discipline scores can include both batting and bowling; raw SR and economy must not be compared directly."
              : "Every selected player is evaluated in " +
                discipline +
                "."}{" "}
            Small samples remain visible and may be ineligible.
          </p>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">SHARED EVIDENCE</div>
                <h2>Performance profile</h2>
              </div>
            </div>
            <PlayerRadar players={selected} />
          </section>
          <section className="panel">
            <div className="table-scroll">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>MEASURE</th>
                    {selected.map((p) => (
                      <th key={p.id}>
                        <button
                          className="text-button"
                          onClick={() => onSelect(p)}
                        >
                          {p.name}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fields.map(([name, value, sample]) => (
                    <tr key={name}>
                      <td>{name}</td>
                      {selected.map((p) => (
                        <td key={p.id}>
                          <strong>{value(p)}</strong>
                          <small>n={sample(p)}</small>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
