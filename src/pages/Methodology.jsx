import React from "react";
import { PageHeading } from "../components/AnalyticsUI.jsx";
import { DEFAULT_WEIGHTS, formatNumber } from "../utils/pressureIndex.js";
export default function Methodology({
  data,
  overview,
  weights,
  league,
  season,
}) {
  const a = data.audit,
    total = Object.values(weights).reduce((n, v) => n + v, 0);
  const sections = [
    [
      "01",
      "What counts as pressure?",
      "Pressure flags are calculated from the score before each delivery: over 16 onward; four or more wickets down; required run rate of at least 10; or over 11 onward in a chase. The union defines overall pressure. Scenario views overlap, so their sample counts must not be added. Revised targets and innings lengths are used when present; otherwise the target is first-innings runs plus one and the innings is 20 overs.",
    ],
    [
      "02",
      "How is PRI computed?",
      "PRI is the normalized weighted mean of differential, consistency and sample confidence. Differential = clamp(50 + 100 × favourable relative rate change, 0, 100). Batting improvement is (pressure SR − normal SR) / normal SR; bowling improvement reverses this sign for economy. 50 means no rate change. Confidence = 100 × n / (n + 10). Zero normal rate gives a neutral differential instead of dividing by zero. If all weights are zero, all scores are zero.",
    ],
    [
      "03",
      "What makes a good outcome?",
      "A pressure innings/spell with at least six relevant balls is good when its strike rate is at least the selected scope’s pooled normal batting rate, or its economy is at most the pooled normal bowling rate. Consistency = good samples / qualifying pressure samples. Bowling spells are grouped per innings, not uninterrupted bowling spells. The 95% Wilson interval describes uncertainty in this consistency proportion under an independent-sample approximation; player and match dependence can make it optimistic.",
    ],
    [
      "04",
      "Eligibility, roles and sample size",
      "Rankings require at least five pressure samples of six balls each, at least 30 pressure balls and at least 30 normal balls. Rates use all balls, while consistency excludes smaller samples. Primary discipline is the larger observed ball volume. Both disciplines with 60+ balls imply all-rounder; keeper status comes from playing elevens. Roles can change with the selected scope. Batters and Bowlers evaluate every qualifying player in that discipline, including all-rounders. Evidence risk is High below 15 qualifying samples, Moderate at 15–29 and Lower at 30+. It is not a medical, injury or financial risk prediction.",
    ],
    [
      "05",
      "How are deliveries and wickets treated?",
      "Wides are excluded from batter balls faced. Wides and Overstep/no-ball records are excluded from legal bowling balls. Byes, leg byes and penalties are excluded from bowler runs. Run-outs, retired dismissals and obstructing-the-field dismissals do not count as bowler wickets. The source’s ambiguous “other” extras are retained as legal deliveries with their recorded runs; this assumption should be reconciled with the official data dictionary. Non-striker dismissals do not enter a striker’s batting dismissal count; batting dismissal averages are therefore not shown.",
    ],
    [
      "06",
      "What do charts and quadrants mean?",
      "The pressure map places players by their within-cohort rate percentile in normal and pressure conditions. Higher is always better: bowling economy is reversed. Median lines at 50 create Clutch Stars (both high), Pressure Risers (pressure high), Flat-track Bullies (normal high), and Avoid (both low). These are descriptive cohort labels, not causal judgments. The tooltip retains raw rates and sample sizes. Radar scenario axes compare rates against the pooled scenario baseline: 50 is average, with results clamped to 0–100. Missing scenario evidence is not silently filled with zero.",
    ],
    [
      "07",
      "How do scouting and bid recommendations work?",
      "Bid candidate: PRI ≥70 and at least 15 pressure samples. Scout further: PRI ≥55. Otherwise: Skip at premium. Insufficient evidence always overrides those rules. Role-need labels are heuristics: 30+ death balls suggests finisher/death-bowler exposure; keeper status can suggest wicketkeeper coverage. They do not assert current RR roster vacancies. A suggested draft balances primary batting and bowling with smaller-sample research picks where available; lower exposure does not establish uncapped status.",
    ],
    [
      "08",
      "Planning ceilings, not market prices",
      "The editable purse and target slots are analyst assumptions. Ceiling = (purse / slots) × (PRI / 70) × (0.5 + confidence / 200), capped at the purse and rounded down to ₹0.1 crore. The exploration band starts at 70% of that ceiling, also rounded down. A saved player without qualifying evidence gets no bid estimate. Combined ceilings can exceed the purse; the shortlist makes this explicit. No historical auction prices, injuries, availability or player contracts are supplied.",
    ],
    [
      "09",
      "Limitations and responsible interpretation",
      "This descriptive index omits wicket value in its score, opposition quality, venue and pitch, batting position, match leverage, league-strength adjustment and survival bias. A faster strike rate can come at a dismissal cost; economy can miss wicket-taking value. Players pooled across seasons may have changed roles. No out-of-sample predictive validation has been performed. Age, nationality, uncapped status and official auction eligibility cannot be inferred reliably from the supplied fields. Source data is not independently certified. Use the dashboard to direct scouting, not as an automatic auction decision.",
    ],
    [
      "10",
      "Persistence and reproducibility",
      "Shortlist IDs, notes, comparison selections, model weights, purse and target slots are stored in this browser only. Nothing is sent to an external service. CSV exports include scope and assumptions. Re-run npm run prepare:data after changing the supplied CSVs; the preparation fails on malformed CSV rows rather than dropping them silently. Hash routes support browser back/forward and direct page links.",
    ],
  ];
  return (
    <div className="workspace-page">
      <PageHeading
        title="Every score has a story."
        eyebrow="METHOD & DATA PROVENANCE"
      >
        Transparent rules. Traceable samples. Clear boundaries on what the data
        can tell us.
      </PageHeading>
      <section className="method-hero panel">
        <span className="eyebrow gold-text">THE CURRENT MODEL</span>
        <h2>Reliability = improvement + repeatability + evidence.</h2>
        <div className="formula-row">
          {Object.keys(DEFAULT_WEIGHTS).map((key, i) => (
            <React.Fragment key={key}>
              {i > 0 && <span>+</span>}
              <div>
                <strong>
                  {total ? ((weights[key] / total) * 100).toFixed(1) : "0"}%
                </strong>
                <span>{key}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
        <p>
          Current scope: {league} / {season} · n=
          {formatNumber(overview.pressureDeliveries)} pressure deliveries ·{" "}
          {overview.players.length} eligible primary-discipline players.
        </p>
      </section>
      <section className="panel audit-panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">SOURCE AUDIT</div>
            <h2>The supplied data pack</h2>
          </div>
          <span className="quality-chip">Schema v{data.schemaVersion}</span>
        </div>
        <div className="audit-grid">
          {[
            ["Source rows", a.rawRows],
            ["Regulation deliveries", a.includedRows],
            ["Super-over rows excluded", a.excludedSuperOverRows],
            ["Unmatched competition rows", a.unmatchedRows],
            ["Ambiguous extra records", a.ambiguousExtras],
            ["Missing player-ID rows", a.missingPlayerRows],
          ].map(([name, n]) => (
            <div key={name}>
              <strong>{formatNumber(n)}</strong>
              <span>{name}</span>
            </div>
          ))}
        </div>
        <p className="context-note">
          Match date coverage: {a.firstDate} to {a.lastDate}. Source labels
          include split-year seasons. All audit counts above describe the entire
          pack, independent of page filters.
        </p>
        <p className="context-note">
          Inputs: ball_by_ball.csv, matches.csv, competitions.csv,
          playing_eleven.csv, competition_team_player_mapping.csv. Team history
          is recorded participation, not a current contract claim.
        </p>
      </section>
      <div className="method-sections">
        {sections.map(([n, title, text], i) => (
          <details key={n} open={i === 0}>
            <summary>
              <span>{n}</span>
              {title}
            </summary>
            <p>{text}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
