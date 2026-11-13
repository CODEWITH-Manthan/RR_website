# Royals Intel — IPL 2027 auction workspace

A complete, dataset-driven React workspace inside the original Vite project.
All seven sidebar pages work; no project re-scaffolding was performed.

## Run and verify

```sh
npm install
npm run dev
# http://localhost:3000

npm run prepare:data  # regenerate after changing the source CSVs
npm test              # CSV, cricket rules, model and real-data invariants
npm run test:ui       # React interaction suite in jsdom
npm run build
npm run preview
```

On Windows, use `npm.cmd` when PowerShell blocks `npm.ps1`. Node 22.12+ is
recommended for the installed development tools. The project uses React,
Tailwind's Vite plugin, Recharts, Framer Motion and Lucide. Test-only additions:

```sh
npm install --save-dev jsdom @testing-library/react @testing-library/user-event
```

## Workspace

| Page           | Working features                                                                                                             |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Overview       | Calculated KPIs, pressure map, computed insights, player dossiers, save controls, print export                               |
| Pressure Index | Live component weights, search, role/team/sample filters, sorting, pagination, CSV export, percentile quadrants              |
| Batters        | Batting-specific PRI, scenario bars against scope averages, radar, inspectable evidence and samples                          |
| Bowlers        | Bowling-specific PRI, economy and wickets, scenario bars/radar, all-rounders included where eligible                         |
| Shortlist      | Persistent saved picks/notes, six-player balanced research draft, editable purse/slots, planning ceilings, CSV and print/PDF |
| Compare        | Two or three players, primary/batting/bowling evaluation, radar, metric and sample tables, uncertainty intervals             |
| Methodology    | Live weights, source audit, formula, pressure rules, sample treatment, assumptions and limitations                           |

Every navigation item has a real hash URL, for example `/#/pressure-index`.
Browser back/forward and direct links work without hosting rewrite rules.
League and season scope is shared across pages. Changing league resets season
to prevent invalid combinations. Weights, shortlist IDs, comparison selections,
notes, planning purse and target slots persist in localStorage. They are local
to this browser, not synchronized to a server. A storage failure is surfaced.

Click a player name to open the dossier. Press Escape or use Close to dismiss.
The mobile menu has focus containment and Escape handling. The app honors
reduced motion, provides labelled controls and exact chart-data tables, and
has loading, empty, invalid-data and runtime error states.

Use **Print / PDF** on Shortlist, then choose **Save as PDF** in the browser.
CSV exports contain scope, samples and model assumptions. Exported notes are
quoted and protected against spreadsheet formula interpretation.

## Data and audit

Original files remain untouched in `6af458274c1e8_data_pack/Data Pack/`.
Preparation reads `ball_by_ball.csv`, `matches.csv`, `competitions.csv`,
`playing_eleven.csv` and `competition_team_player_mapping.csv`, then writes
`src/data/analytics.json` (schema v2). The browser fetches this asset separately
from the JavaScript bundles. `__MACOSX` metadata is ignored.

```sh
node scripts/prepare-data.mjs "C:/path/to/Data Pack"
```

The supplied pack contains:

- 200,999 source delivery records; 200,961 included regulation deliveries.
- 38 excluded super-over records; zero unmatched competition records.
- Zero missing striker/bowler IDs in included records.
- 263 included records with ambiguous `other` extras (assumption documented).
- Match dates from 2022-01-22 to 2026-11-01, with source-labelled seasons and
  split-year T20I seasons. Source results are not independently verified.

Default IPL scope: 381 observed players, 211 eligible primary-discipline
players, 367 matches and 46,482 pressure deliveries. These numbers are computed,
not hardcoded in the interface. A data refresh can change them. Malformed CSV
rows fail preparation rather than being silently dropped. A missing generated
asset produces an error state with regeneration instructions.

## Index and interpretation

`src/utils/pressureIndex.js` contains PRI, scope baselines, sample summaries,
uncertainty, scouting rules and bid-planning calculations. Default weights:

- **45% differential**: `clamp(50 + 100 × favourable relative rate change, 0, 100)`.
- **35% consistency**: fraction of qualifying pressure samples meeting or
  beating the selected scope's pooled normal rate for that discipline.
- **20% confidence**: `100 × n / (n + 10)`.

Weights normalize to their sum; all-zero weights produce zero scores and a
visible warning. Batting rate is strike rate; bowling rate is economy, with
improvement direction reversed. A zero normal rate has neutral differential.

Pressure flags use the **pre-delivery** state: over 16 onward, 4+ wickets down,
required rate ≥10, or over 11 onward in a chase. The overall union counts a
ball once. Scenario splits overlap and must not be summed. Revised targets and
overs are used when supplied; otherwise a 20-over innings is assumed.

Consistency samples require six pressure balls per player/innings. A bowling
sample groups all of a player's deliveries in an innings. Ranking eligibility
requires five qualifying pressure samples, 30 pressure balls and 30 normal
balls. All observed balls enter rates; sample counts and ball counts are shown
separately. Wilson 95% intervals describe consistency uncertainty under an
independence approximation; the sample-confidence component is a heuristic,
not a confidence interval.

Wides are excluded from batter balls. Wides and `Overstep` no-balls are excluded
from legal bowling balls. Byes, leg byes and penalties are excluded from bowler
runs. Run-outs, retired and obstructing-the-field dismissals are excluded from
bowler wickets. Ambiguous `other` extras are treated as legal with their
recorded runs; confirm this with an official data dictionary. Non-striker
run-outs are not credited as striker dismissals, so batting dismissal averages
are not displayed.

Roles are inferred from scope-specific ball volumes: 60+ in both disciplines
suggests all-rounder; keeper status comes from playing elevens. Primary PRI
uses the larger ball volume. Dedicated batting/bowling views rate players in
that discipline, so an all-rounder can have two different scores.

The pressure map uses within-cohort rate percentiles, reversed for bowling;
50th-percentile guides define its four descriptive quadrants. Raw rates remain
available in tooltips and accessible tables. Scenario radar axes use relative
rate performance vs the pooled scenario baseline (50 = average). Missing data
is not replaced with zero. Raw SR and economy should not be compared directly.

## Scouting and price assumptions

**Bid candidate:** eligible, PRI ≥70 and n≥15. **Scout further:** eligible and
PRI ≥55. Otherwise **Skip at premium**. Evidence risk is High below 15 samples,
Moderate at 15–29 and Lower at 30+. These are transparent research rules, not
validated predictive classifications or injury assessments.

Purse and slot defaults (₹45 crore / 6 slots) are **editable hypothetical
planning assumptions**, not RR's confirmed auction resources. Ceiling:

```text
(purse / slots) × (PRI / 70) × (0.5 + confidence / 200)
```

Cap at purse and round down to ₹0.1 crore. The exploration band starts at 70%
of that ceiling, also rounded down. Ineligible/out-of-scope players have no
ceiling. The shortlist warns when combined ceilings exceed the purse or saved
players exceed target slots. It does not place bids or purchase anything.

Age, nationality, uncapped status, auction availability, contracts and market
prices are absent from the pack. They are not fabricated. Lower-exposure picks
are **not** labelled uncapped. Role-fit notes are RR scouting hypotheses, not
claims about confirmed roster vacancies. Opposition, venue, pitch, match
leverage, league strength, dismissal costs and wicket value are not included
in PRI; no out-of-sample predictive validation has been performed.

## Files

Original entry points retained: `src/main.js`, `index.html`, `vite.config.js`.
Theme: `src/style.css`; orchestration: `src/App.jsx`.

```text
src/
  assets/README.md                official-logo placement instructions
  components/
    Shell.jsx                    working navigation and shared filters
    AnalyticsUI.jsx              tables, controls, evidence badges, CSV export
    PressureChart.jsx            percentile pressure map
    PlayerRadar.jsx              accessible comparison radar
    PlayerDrawer.jsx             player dossier
  pages/
    Overview.jsx
    PressureIndex.jsx
    Discipline.jsx               shared Batters/Bowlers implementation
    Shortlist.jsx
    Compare.jsx
    Methodology.jsx
  hooks/
    useAnalytics.js              asset loading and error recovery
    useWorkspace.js              routing and validated browser persistence
  utils/pressureIndex.js         all analytical/scouting formulas
  data/analytics.json            generated source aggregates, schema v2
scripts/
  data-pipeline.mjs              strict CSV parser and pre-ball cricket rules
  prepare-data.mjs               source ingestion, scenario aggregation, audit
 tests/
  data-pipeline.test.mjs
  pressureIndex.test.mjs
  workspace.smoke.mjs
```

This iteration modifies `src/App.jsx`, `src/components/Shell.jsx`,
`src/components/PressureChart.jsx`, `src/pages/Overview.jsx`,
`src/hooks/useAnalytics.js`, `src/utils/pressureIndex.js`, `src/style.css`,
`src/data/analytics.json`, `scripts/prepare-data.mjs`,
`tests/pressureIndex.test.mjs`, `package.json`, `package-lock.json` and this README.
Other files listed above are new in this iteration, except existing entry
points and `src/assets/README.md`.

Place an authorized logo at `src/assets/rr-logo.png`. Until then, a labelled
placeholder is used. Initials stand in for player photographs. Fonts use
Poppins/Inter from Google Fonts with system fallbacks.

## Verification scope

Unit tests cover parsing, extras, pre-delivery flags, score direction, weight
normalization, real-data scope/filter invariants, discipline overlap, intervals,
and ceiling bounds. The React interaction suite uses the real generated data
and verifies navigation and controls in jsdom. It is not a browser screenshot,
mobile pixel-layout or native print-dialog test.
