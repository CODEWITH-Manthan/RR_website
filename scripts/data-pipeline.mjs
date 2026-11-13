// CSV parsing and cricket rules are shared by preparation and fixture tests.
export function parseCSV(text) {
  const rows = [];
  let row = [],
    value = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        value += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(value);
      value = "";
    } else if (c === "\n" && !quoted) {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else value += c;
  }
  if (value || row.length) {
    row.push(value.replace(/\r$/, ""));
    rows.push(row);
  }
  if (quoted) throw new Error("Unclosed quoted field in CSV.");
  const header = rows.shift()?.map((h) => h.replace(/^\uFEFF/, ""));
  if (!header) throw new Error("Empty CSV.");
  return rows
    .filter((r) => r.some(Boolean))
    .map((r, i) => {
      if (r.length !== header.length)
        throw new Error(
          `Invalid CSV row ${i + 2}: expected ${header.length} fields, received ${r.length}.`,
        );
      return Object.fromEntries(header.map((h, j) => [h, r[j]]));
    });
}
export function deliveryFacts(b) {
  const extra = (b.extras_type || "").toLowerCase();
  const wide = extra.includes("wide");
  const noBall = /no[ -]?ball|overstep/.test(extra);
  const extras = (+b.extras1_runs || 0) + (+b.extras_2_runs || 0);
  const runs = +b.runs || 0;
  const wicket = b.is_wicket === "true";
  return {
    legal: !wide && !noBall,
    batterBall: !wide,
    runs,
    totalRuns: runs + extras,
    bowlerRuns: runs + (/^leg\s?bye|^bye|penalty/.test(extra) ? 0 : extras),
    wicket,
    bowlerWicket:
      wicket && !/run.?out|retired|obstruct/i.test(b.dismissal_type || ""),
    boundary: b.is_four === "true" || b.is_six === "true",
    ambiguous: extra === "other",
  };
}
export function pressureFlags(b, state, target, overs = 20) {
  const chasing = +b.innings === 2;
  const requiredRate = chasing
    ? (Math.max(0, target - state.runs) * 6) /
      Math.max(1, overs * 6 - state.legal)
    : 0;
  const flags = {
    chasing: chasing && +b.overid >= 11,
    death: +b.overid >= 16,
    highRate: requiredRate >= 10,
    wicketsDown: state.wickets >= 4,
  };
  return { ...flags, pressure: Object.values(flags).some(Boolean) };
}
