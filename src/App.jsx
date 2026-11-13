import React, { Component, useMemo, useState } from "react";
import { MotionConfig } from "framer-motion";
import Shell from "./components/Shell.jsx";
import Overview from "./pages/Overview.jsx";
import PressureIndex from "./pages/PressureIndex.jsx";
import Discipline from "./pages/Discipline.jsx";
import Shortlist from "./pages/Shortlist.jsx";
import Compare from "./pages/Compare.jsx";
import Methodology from "./pages/Methodology.jsx";
import PlayerDrawer from "./components/PlayerDrawer.jsx";
import { useAnalytics } from "./hooks/useAnalytics.js";
import { useRoute, useStoredState } from "./hooks/useWorkspace.js";
import { buildOverview, DEFAULT_WEIGHTS } from "./utils/pressureIndex.js";
class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="fatal-error">
        <h1>Something interrupted the innings.</h1>
        <p>
          Reload the workspace to try again. Saved selections stay in this
          browser.
        </p>
        <button
          className="button primary"
          onClick={() => window.location.reload()}
        >
          Reload workspace
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
const validIds = (v) =>
  Array.isArray(v) &&
  v.every((id) => typeof id === "string") &&
  new Set(v).size === v.length;
const validWeights = (v) =>
  v &&
  Object.keys(DEFAULT_WEIGHTS).every(
    (k) => Number.isFinite(v[k]) && v[k] >= 0 && v[k] <= 100,
  );
function Dashboard() {
  const { data, loading, error, retry } = useAnalytics();
  const [page, navigate] = useRoute();
  const [league, setLeague] = useState("IPL"),
    [season, setSeason] = useState("All seasons");
  const [weights, setWeights, weightError] = useStoredState(
    "rr-weights-v2",
    DEFAULT_WEIGHTS,
    validWeights,
  );
  const [shortlist, setShortlist, shortlistError] = useStoredState(
    "rr-shortlist-v1",
    [],
    validIds,
  );
  const [compareIds, setCompareIds, compareError] = useStoredState(
    "rr-compare-v2",
    [],
    (v) => validIds(v) && v.length <= 3,
  );
  const [notes, setNotes, noteError] = useStoredState(
    "rr-notes-v2",
    {},
    (v) =>
      v &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      Object.values(v).every((x) => typeof x === "string" && x.length <= 1000),
  );
  const [purse, setPurse, purseError] = useStoredState(
    "rr-purse-v2",
    45,
    (v) => Number.isFinite(v) && v >= 0 && v <= 200,
  );
  const [slots, setSlots, slotError] = useStoredState(
    "rr-slots-v2",
    6,
    (v) => Number.isInteger(v) && v >= 1 && v <= 25,
  );
  const [selection, setSelection] = useState(null),
    [notice, setNotice] = useState("");
  const overview = useMemo(
    () => (data ? buildOverview(data, league, season, weights) : null),
    [data, league, season, weights],
  );
  const battingModel = useMemo(
    () =>
      data
        ? buildOverview(data, league, season, weights, {
            discipline: "batting",
          })
        : null,
    [data, league, season, weights],
  );
  const bowlingModel = useMemo(
    () =>
      data
        ? buildOverview(data, league, season, weights, {
            discipline: "bowling",
          })
        : null,
    [data, league, season, weights],
  );
  const globalPlayers = useMemo(
    () =>
      data ? buildOverview(data, "All leagues", "All seasons").allPlayers : [],
    [data],
  );
  const seasons = useMemo(
    () =>
      data
        ? [
            ...new Set(
              data.buckets
                .filter((b) => league === "All leagues" || b.league === league)
                .map((b) => b.season),
            ),
          ]
            .sort()
            .reverse()
        : [],
    [data, league],
  );
  const changeLeague = (value) => {
    setLeague(value);
    setSeason("All seasons");
    setSelection(null);
  };
  const toggleShortlist = (id) =>
    setShortlist((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  const toggleCompare = (id) => {
    if (!compareIds.includes(id) && compareIds.length >= 3) {
      setNotice(
        "Comparison is full. Remove a player on Compare before adding another.",
      );
      return;
    }
    setCompareIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
    setNotice("");
  };
  const selectedPlayer = selection
    ? (selection.discipline === "batting"
        ? battingModel
        : bowlingModel
      )?.allPlayers.find((p) => p.id === selection.id)
    : null;
  const common = {
    overview,
    weights,
    setWeights,
    league,
    season,
    shortlist,
    setShortlist,
    toggleShortlist,
    compareIds,
    toggleCompare,
    onSelect: (p) => setSelection({ id: p.id, discipline: p.discipline }),
    navigate,
    globalPlayers,
    battingModel,
    bowlingModel,
    notes,
    setNotes,
    purse,
    setPurse,
    slots,
    setSlots,
  };
  let content;
  if (loading || error)
    content = <Overview {...common} {...{ loading, error, retry }} />;
  else if (page === "Pressure Index") content = <PressureIndex {...common} />;
  else if (page === "Batters" || page === "Bowlers")
    content = (
      <Discipline
        key={page}
        {...common}
        discipline={page === "Batters" ? "batting" : "bowling"}
        model={page === "Batters" ? battingModel : bowlingModel}
      />
    );
  else if (page === "Shortlist") content = <Shortlist {...common} />;
  else if (page === "Compare") content = <Compare {...common} />;
  else if (page === "Methodology")
    content = <Methodology {...common} data={data} />;
  else content = <Overview {...common} {...{ loading, error, retry }} />;
  return (
    <Shell
      {...{ page, navigate, league, season, seasons }}
      setLeague={changeLeague}
      setSeason={(v) => {
        setSeason(v);
        setSelection(null);
      }}
      shortlistCount={shortlist.length}
      compareCount={compareIds.length}
      dataStatus={
        loading
          ? "Loading data…"
          : error
            ? "Data unavailable"
            : "Data pack connected"
      }
    >
      {[
        weightError,
        shortlistError,
        compareError,
        noteError,
        purseError,
        slotError,
      ].some(Boolean) && (
        <p className="storage-note" role="status">
          Browser storage is unavailable. Changes apply for this session only.
        </p>
      )}
      {notice && (
        <div className="workspace-notice" role="status">
          <span>{notice}</span>
          <button
            className="text-button"
            onClick={() => {
              navigate("Compare");
              setNotice("");
            }}
          >
            Open comparison
          </button>
          <button className="text-button" onClick={() => setNotice("")}>
            Dismiss
          </button>
        </div>
      )}
      {content}
      {selectedPlayer && (
        <PlayerDrawer
          player={selectedPlayer}
          onClose={() => setSelection(null)}
          {...common}
        />
      )}
    </Shell>
  );
}
export default function App() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.2 }}>
        <Dashboard />
      </MotionConfig>
    </ErrorBoundary>
  );
}
