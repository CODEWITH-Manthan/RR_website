import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  ChevronRight,
  CircleAlert,
  Crown,
  Database,
  Info,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import PressureChart from "../components/PressureChart.jsx";
import { formatNumber } from "../utils/pressureIndex.js";

// Decorative architecture is an original motif, never a recreation of the RR crest.
function PalaceMotif() {
  return (
    <div className="palace-art" aria-hidden="true">
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="hero-star star-one">✧</div>
      <div className="hero-star star-two">✧</div>
      <div className="palace-arch arch-back" />
      <div className="palace-arch arch-front">
        <div className="arch-inner">
          <span className="arch-kicker">FEARLESS BY NATURE</span>
          <strong>
            Halla
            <br />
            <em>Bol!</em>
          </strong>
          <div className="arch-rule">
            <span />✦<span />
          </div>
          <span className="arch-bottom">ROYAL BY CHOICE</span>
        </div>
      </div>
      <div className="palace-lines" />
      <span className="art-coordinate">JAIPUR · 26.9124° N</span>
    </div>
  );
}
function Metric({ label, value, suffix, note, icon: Icon, tone, footer }) {
  return (
    <motion.article className={`metric-card ${tone}`} whileHover={{ y: -3 }}>
      <div className="metric-top">
        <span>{label}</span>
        <div className="metric-icon">
          <Icon size={18} />
        </div>
      </div>
      <div className="metric-value">
        {value}
        <span>{suffix}</span>
      </div>
      <p>{note}</p>
      <div className="metric-footer">{footer}</div>
      <svg className="metric-spark" viewBox="0 0 120 32" aria-hidden="true">
        <path
          d="M1 28 L16 21 L27 24 L39 13 L50 18 L63 9 L74 14 L85 7 L97 11 L118 1"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    </motion.article>
  );
}
function Loading() {
  return (
    <div className="loading-state" role="status" aria-label="Loading analytics">
      <div className="skeleton skeleton-hero" />
      <div className="metrics-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton skeleton-card" />
        ))}
      </div>
      <div className="skeleton skeleton-chart" />
      <span className="sr-only">Loading your data pack…</span>
    </div>
  );
}
export default function Overview({
  overview,
  loading,
  error,
  retry,
  shortlist,
  toggleShortlist,
  league,
  season,
  onSelect,
  navigate,
  weights,
}) {
  const [query, setQuery] = useState("");
  if (loading) return <Loading />;
  if (error)
    return (
      <section className="state-panel" role="alert">
        <CircleAlert size={32} />
        <h1>The data couldn’t take the field.</h1>
        <p>{error}</p>
        <p>
          Regenerate the dataset with <code>npm run prepare:data</code>, then
          reload.
        </p>
        <button className="button primary" onClick={retry}>
          Try again
        </button>
      </section>
    );
  const { players, playersAnalysed, matches, deliveries, pressureDeliveries } =
    overview;
  const top = players[0];
  const visible = players
    .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 6);
  const riser = [...players].sort(
    (a, b) => b.relativeChange - a.relativeChange,
  )[0];
  const reliable = [...players]
    .filter((p) => p.sampleSize >= 20)
    .sort((a, b) => b.consistency - a.consistency)[0];
  const saved = players.filter((p) => shortlist.includes(p.id));
  const featured = saved.length ? saved.slice(0, 3) : players.slice(0, 3);
  return (
    <motion.div
      className="overview"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="page-heading">
        <div>
          <div className="eyebrow pink">RAJASTHAN ROYALS · IPL 2027</div>
          <h1>The auction advantage.</h1>
          <p>Find the players who deliver when it matters most.</p>
        </div>
        <button
          className="button secondary print-button"
          onClick={() => window.print()}
        >
          <ArrowDownToLine size={16} /> Export overview
        </button>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-label">
            <span /> PRESSURE REVEALS THE ROYAL.
          </div>
          <h2>
            Big moments.
            <br />
            Bigger <span>match-winners.</span>
          </h2>
          <p>
            Go beyond the averages. Discover proven composure,
            <br className="desktop-break" /> uncover hidden potential, and build
            a fearless squad.
          </p>
          <a className="button primary" href="#/pressure-index">
            Explore pressure leaders <ArrowRight size={17} />
          </a>
          <div className="hero-meta">
            <ShieldCheck size={14} />
            <span>Evidence-led scouting</span>
            <i />
            <span>Built for the RR war room</span>
          </div>
        </div>
        <PalaceMotif />
      </section>
      <div className="section-label">
        <span>THE BIG PICTURE</span>
        <div />
        <span className="scope-label">
          {league} · {season === "All seasons" ? "2022–2026" : season}
          <i />
        </span>
      </div>
      <div className="metrics-grid">
        <Metric
          label="Players analysed"
          value={formatNumber(playersAnalysed)}
          note={`Across ${formatNumber(matches)} matches`}
          icon={Users}
          tone="blue"
          footer={
            <>
              <Database size={12} /> n={formatNumber(deliveries)} deliveries
            </>
          }
        />
        <Metric
          label="Pressure situations"
          value={formatNumber(pressureDeliveries)}
          note="Individual pressure deliveries tracked"
          icon={Activity}
          tone="pink-tone"
          footer={
            <>
              <Target size={12} /> n={formatNumber(deliveries)} total deliveries
            </>
          }
        />
        <Metric
          label="Top reliability score"
          value={top ? top.score.toFixed(1) : "—"}
          suffix="/ 100"
          note={top?.name || "No qualifying player"}
          icon={Crown}
          tone="gold"
          footer={
            <>
              <TrendingUp size={12} /> n={top?.sampleSize || 0} pressure samples
            </>
          }
        />
        <Metric
          label="Your shortlist"
          value={String(shortlist.length).padStart(2, "0")}
          note={`${saved.length} eligible in this data scope`}
          icon={Bookmark}
          tone="purple"
          footer={
            <>
              <Check size={12} />{" "}
              {shortlist.length
                ? "Saved on this browser"
                : "Save a player to get started"}
            </>
          }
        />
      </div>
      {!players.length ? (
        <section className="state-panel">
          <Search size={28} />
          <h2>No qualifying players in this scope.</h2>
          <p>
            Try another season or league. Rankings need 5 pressure samples and
            30 balls in both conditions.
          </p>
        </section>
      ) : (
        <>
          <div className="analysis-grid">
            <PressureChart players={players} onSelect={onSelect} />
            <section className="panel watchlist-panel">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow gold-text">ON THE RADAR</div>
                  <h2>{saved.length ? "Your watchlist" : "Names to watch"}</h2>
                </div>
                <Bookmark size={19} className="gold-text" />
              </div>
              <p className="panel-subtitle">
                {saved.length
                  ? "Saved players in the current scope."
                  : "The highest PRI scores in this data scope."}
              </p>
              <div className="watchlist">
                {featured.map((p, i) => (
                  <article className="watch-card" key={p.id}>
                    <div className="watch-card-top">
                      <span className="watch-rank">0{i + 1}</span>
                      <span className="role-pill">{p.role}</span>
                      <button
                        className={`bookmark-button ${shortlist.includes(p.id) ? "saved" : ""}`}
                        aria-label={`${shortlist.includes(p.id) ? "Remove" : "Add"} ${p.name} ${shortlist.includes(p.id) ? "from" : "to"} shortlist`}
                        aria-pressed={shortlist.includes(p.id)}
                        onClick={() => toggleShortlist(p.id)}
                      >
                        <Bookmark
                          size={17}
                          fill={
                            shortlist.includes(p.id) ? "currentColor" : "none"
                          }
                        />
                      </button>
                    </div>
                    <div className="watch-player">
                      <div className={`player-avatar avatar-${i}`}>
                        {p.name
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div>
                        <h3>
                          <button
                            className="text-button"
                            onClick={() => onSelect(p)}
                          >
                            {p.name}
                          </button>
                        </h3>
                        <p>n={p.sampleSize} pressure samples</p>
                      </div>
                      <strong>
                        {p.score.toFixed(1)}
                        <small>PRI / 100</small>
                      </strong>
                    </div>
                  </article>
                ))}
              </div>
              <div className="watch-note">
                <Info size={15} />
                <p>
                  Scouting signals, not confirmed auction targets. Availability
                  & bid ceilings need validation.
                </p>
              </div>
            </section>
          </div>
          <div className="insights-grid">
            <article className="insight">
              <div className="insight-symbol pink-text">
                <TrendingUp size={20} />
              </div>
              <div>
                <span className="eyebrow">PRESSURE RISER</span>
                <h3>{riser?.name}</h3>
                <p>
                  {riser.relativeChange >= 0 ? "+" : ""}
                  {(riser.relativeChange * 100).toFixed(1)}% favourable rate
                  change · n={riser.sampleSize} pressure samples /{" "}
                  {riser.normalSamples} normal samples.
                </p>
              </div>
              <ArrowUpRight size={16} />
            </article>
            <article className="insight">
              <div className="insight-symbol gold-text">
                <ShieldCheck size={20} />
              </div>
              <div>
                <span className="eyebrow">REPEAT PERFORMER</span>
                <h3>{reliable?.name || "More evidence needed"}</h3>
                <p>
                  {reliable
                    ? `${reliable.consistency.toFixed(0)}% good pressure outcomes · n=${reliable.sampleSize} samples of at least 6 balls.`
                    : "No player has 20 qualifying pressure samples in this scope."}
                </p>
              </div>
              <ArrowUpRight size={16} />
            </article>
            <article className="insight">
              <div className="insight-symbol blue-text">
                <Sparkles size={20} />
              </div>
              <div>
                <span className="eyebrow">EVIDENCE FIRST</span>
                <h3>Small samples. Big caution.</h3>
                <p>
                  {players.length} players qualify from n={playersAnalysed}{" "}
                  observed players. Confidence is part of every score.
                </p>
              </div>
              <ArrowUpRight size={16} />
            </article>
          </div>
          <section
            className="panel leaders-panel"
            id="pressure-leaders"
            aria-labelledby="leaders-heading"
          >
            <div className="panel-heading">
              <div>
                <div className="eyebrow">COMPOSURE, QUANTIFIED</div>
                <h2 id="leaders-heading">
                  Pressure leaders{" "}
                  <span className="count-pill">{players.length}</span>
                </h2>
              </div>
              <label className="search-field">
                <Search size={16} />
                <input
                  aria-label="Search pressure leaders"
                  placeholder="Find a player…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
            </div>
            <div className="table-scroll">
              <table>
                <caption className="sr-only">
                  Top six matching players ranked by Pressure Reliability Index.
                  Sample sizes accompany every rate.
                </caption>
                <thead>
                  <tr>
                    <th>RANK</th>
                    <th>PLAYER</th>
                    <th>ROLE</th>
                    <th>RELIABILITY INDEX</th>
                    <th>PRESSURE RATE</th>
                    <th>CONSISTENCY</th>
                    <th>
                      <span className="sr-only">Shortlist</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span
                          className={`rank ${players.indexOf(p) < 3 ? "rank-gold" : ""}`}
                        >
                          {String(players.indexOf(p) + 1).padStart(2, "0")}
                        </span>
                      </td>
                      <td>
                        <button
                          className="text-button player-name"
                          onClick={() => onSelect(p)}
                        >
                          {p.name}
                        </button>
                        <small>
                          n={p.sampleSize} pressure{" "}
                          {p.discipline === "batting" ? "innings" : "spells"}
                        </small>
                      </td>
                      <td>
                        <span className={`table-role role-${p.discipline}`}>
                          {p.role}
                        </span>
                      </td>
                      <td>
                        <div className="score-cell">
                          <strong>{p.score.toFixed(1)}</strong>
                          <div
                            className="score-track"
                            role="meter"
                            aria-label={`${p.name} pressure reliability, n=${p.sampleSize}`}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={Number(p.score.toFixed(1))}
                          >
                            <span style={{ width: `${p.score}%` }} />
                          </div>
                        </div>
                        <small>n={p.sampleSize} pressure samples</small>
                      </td>
                      <td>
                        <strong>
                          {p.pressureRate.toFixed(1)}{" "}
                          <span className="rate-unit">
                            {p.discipline === "batting" ? "SR" : "ECON"}
                          </span>
                        </strong>
                        <small>n={p.pressureBalls} balls</small>
                      </td>
                      <td>
                        <strong className="consistency">
                          {p.consistency.toFixed(0)}%
                        </strong>
                        <small>n={p.sampleSize} pressure samples</small>
                      </td>
                      <td>
                        <button
                          className={`bookmark-button ${shortlist.includes(p.id) ? "saved" : ""}`}
                          aria-label={`${shortlist.includes(p.id) ? "Remove" : "Add"} ${p.name} ${shortlist.includes(p.id) ? "from" : "to"} shortlist`}
                          aria-pressed={shortlist.includes(p.id)}
                          onClick={() => toggleShortlist(p.id)}
                        >
                          <Bookmark
                            size={17}
                            fill={
                              shortlist.includes(p.id) ? "currentColor" : "none"
                            }
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!visible.length && (
              <p className="table-empty" role="status">
                No players match “{query}”. Try another name.
              </p>
            )}
            <div className="table-footer">
              <span>
                Showing {visible.length} of{" "}
                {
                  players.filter((p) =>
                    p.name.toLowerCase().includes(query.toLowerCase()),
                  ).length
                }{" "}
                matching players
              </span>
              <span>
                <button
                  className="text-button"
                  onClick={() => navigate("Pressure Index")}
                >
                  Model weights: {weights.differential} / {weights.consistency}{" "}
                  / {weights.confidence} points <ChevronRight size={13} />
                </button>
              </span>
            </div>
          </section>
        </>
      )}
      <details id="data-notes" className="data-notes">
        <summary>
          <Info size={15} /> A note on the numbers{" "}
          <span>Source & assumptions</span>
        </summary>
        <div>
          <p>
            Calculated from the supplied SupeRR Selector data pack. Seasons use
            the source labels (2022–2026); these are not independently verified
            real-world results. Pressure means over 16 onward, 4+ wickets down,
            required run rate ≥10, or over 11 onward in a chase. A delivery
            counts once even if several rules apply.
          </p>
          <p>
            PRI combines a direction-adjusted pressure-vs-normal rate
            differential, good-outcome consistency against the scope’s normal
            rate, and sample confidence n/(n+10). Weights are adjustable on
            Pressure Index. A sample is an innings or spell with at least six
            pressure balls. Rankings require five such samples and 30 balls in
            each condition. Batting uses strike rate; bowling uses economy.
            Roles and primary discipline are inferred from ball volume. Wickets,
            opposition strength, venue, and auction availability are not
            modelled yet.
          </p>
          <p>
            Chart axes use within-cohort performance percentiles with median
            guides. Shortlist selections persist in this browser. Bid ceilings
            are explicit planning estimates, not market valuations. Full
            definitions and the source audit are on the Methodology page.
          </p>
        </div>
      </details>
      <div className="closing-line">
        <span />✦<span />
        <p>HALLA BOL. EVERY SINGLE BALL.</p>
        <span />✦<span />
      </div>
    </motion.div>
  );
}
