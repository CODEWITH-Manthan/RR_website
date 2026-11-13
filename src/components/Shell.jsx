import React, { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Bookmark,
  ChartNoAxesCombined,
  ChevronDown,
  CircleHelp,
  GitCompareArrows,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { pageHref } from "../hooks/useWorkspace.js";
const navigation = [
  ["Overview", LayoutDashboard],
  ["Pressure Index", Activity],
  ["Batters", ChartNoAxesCombined],
  ["Bowlers", Target],
  ["Shortlist", Bookmark],
  ["Compare", GitCompareArrows],
  ["Methodology", CircleHelp],
];
const logo = Object.values(
  import.meta.glob("../assets/rr-logo.png", {
    eager: true,
    query: "?url",
    import: "default",
  }),
)[0];
export default function Shell({
  children,
  page,
  navigate,
  league,
  setLeague,
  season,
  setSeason,
  seasons,
  shortlistCount,
  compareCount,
  dataStatus,
}) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef(null),
    menuRef = useRef(null),
    sidebarRef = useRef(null);
  const closeMenu = () => {
    setOpen(false);
    requestAnimationFrame(() => menuRef.current?.focus());
  };
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const escape = (e) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [open]);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 761px)");
    const changed = (e) => {
      if (e.matches) setOpen(false);
    };
    media.addEventListener("change", changed);
    return () => media.removeEventListener("change", changed);
  }, []);
  useEffect(() => {
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [page]);
  function trapMenu(e) {
    if (!open || e.key !== "Tab") return;
    const items = sidebarRef.current.querySelectorAll(
      "a,button:not([disabled])",
    );
    const first = items[0],
      last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Skip to dashboard
      </a>
      {open && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation"
          tabIndex={-1}
          onClick={closeMenu}
        />
      )}
      <aside
        id="workspace-navigation"
        ref={sidebarRef}
        onKeyDown={trapMenu}
        className={`sidebar ${open ? "is-open" : ""}`}
        aria-label="Main navigation"
      >
        <div className="brand">
          <div className="logo-placeholder">
            {logo ? (
              <img src={logo} alt="Rajasthan Royals" />
            ) : (
              <>
                <span>RR</span>
                <small>LOGO HERE</small>
              </>
            )}
          </div>
          <div>
            <strong>
              ROYALS<span>INTEL</span>
            </strong>
            <small>THE AUCTION ADVANTAGE</small>
          </div>
          <button
            ref={closeRef}
            className="icon-button mobile-close"
            onClick={closeMenu}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-label">
          WORKSPACE <span>2027</span>
        </div>
        <nav>
          {navigation.map(([name, Icon]) => (
            <a
              key={name}
              href={pageHref(name)}
              aria-label={name}
              className={`nav-item ${page === name ? "active" : ""}`}
              aria-current={page === name ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              <Icon size={19} />
              <span>{name}</span>
              {name === "Shortlist" ? (
                <span className="nav-count">{shortlistCount}</span>
              ) : name === "Compare" && compareCount ? (
                <span className="nav-count">{compareCount}</span>
              ) : null}
            </a>
          ))}
        </nav>
        <p className="nav-stage">
          <span className="live-indicator" /> Evidence-led auction workspace
        </p>
        <div className="sidebar-bottom">
          <div className="auction-note">
            <Sparkles size={19} />
            <span>BUILT FOR THE BIG MOMENTS</span>
            <h3>
              Better insights.
              <br />
              Bolder decisions.
            </h3>
            <p>IPL 2027 auction intelligence</p>
            <div className="tiny-gold-line" />
          </div>
          <div className="analyst">
            <div className="analyst-avatar">RR</div>
            <div>
              <strong>RR War Room</strong>
              <small>Strategy & scouting</small>
            </div>
            <ShieldCheck size={18} />
          </div>
        </div>
      </aside>
      <div className="workspace" inert={open}>
        <header className="topbar">
          <div className="breadcrumb">
            <button
              ref={menuRef}
              className="icon-button mobile-menu"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
              aria-controls="workspace-navigation"
              aria-expanded={open}
            >
              <Menu size={21} />
            </button>
            <span>War room</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{page}</strong>
          </div>
          <div className="topbar-right">
            <span className="dataset-badge">
              <i />
              {dataStatus}
            </span>
            <div className="filter-control">
              <label className="sr-only" htmlFor="league">
                League
              </label>
              <select
                id="league"
                value={league}
                onChange={(e) => setLeague(e.target.value)}
              >
                {["IPL", "T20I", "Other T20", "All leagues"].map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
              <ChevronDown size={13} />
            </div>
            <div className="filter-control">
              <label className="sr-only" htmlFor="season">
                Data season
              </label>
              <select
                id="season"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
              >
                <option>All seasons</option>
                {seasons.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <ChevronDown size={13} />
            </div>
            <div className="top-avatar" aria-label="Rajasthan Royals workspace">
              RR
            </div>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <footer>
          <span>
            ROYALS INTEL <span className="footer-divider">/</span> Every ball.
            Every decision.
          </span>
          <a href={pageHref("Methodology")}>
            About the data <ArrowUpRight size={13} />
          </a>
          <span>Made for the moments that matter.</span>
        </footer>
      </div>
    </div>
  );
}
