/** Real React interaction smoke test in jsdom. Does not claim visual verification. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { createServer } from "vite";
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost:3000/#/overview",
  pretendToBeVisual: true,
});
for (const key of [
  "window",
  "document",
  "HTMLElement",
  "Element",
  "Node",
  "HTMLDialogElement",
  "MutationObserver",
  "getComputedStyle",
  "localStorage",
])
  Object.defineProperty(globalThis, key, {
    value: dom.window[key],
    configurable: true,
    writable: true,
  });
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
globalThis.requestAnimationFrame = (cb) =>
  setTimeout(() => cb(performance.now()), 0);
globalThis.cancelAnimationFrame = clearTimeout;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.scrollTo = () => {};
window.matchMedia = () => ({
  matches: false,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
});
class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe(target) {
    this.callback([{ target, contentRect: { width: 800, height: 320 } }]);
  }
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = window.ResizeObserver = ResizeObserver;
HTMLElement.prototype.getBoundingClientRect = function () {
  return {
    width: 800,
    height: 320,
    top: 0,
    left: 0,
    right: 800,
    bottom: 320,
    x: 0,
    y: 0,
    toJSON() {},
  };
};
HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
HTMLDialogElement.prototype.close = function () {
  this.open = false;
};
const data = JSON.parse(
  await readFile(
    new URL("../src/data/analytics.json", import.meta.url),
    "utf8",
  ),
);
globalThis.fetch = async () => ({ ok: true, json: async () => data });
let exportedBlob = null,
  printCalls = 0;
URL.createObjectURL = (blob) => {
  exportedBlob = blob;
  return "blob:workspace-export";
};
URL.revokeObjectURL = () => {};
window.print = () => {
  printCalls++;
};
const originalAnchorClick = window.HTMLAnchorElement.prototype.click;
window.HTMLAnchorElement.prototype.click = function () {
  if (!this.download) return originalAnchorClick.call(this);
};
const React = await import("react");
const { render, screen, waitFor, fireEvent, cleanup, within, configure } =
  await import("@testing-library/react");
configure({
  getElementError: (message) =>
    new Error(String(message ?? "Multiple matching elements").slice(0, 1600)),
});
const { default: userEvent } = await import("@testing-library/user-event");
const user = userEvent.setup({ document: window.document });
const server = await createServer({
  configFile: false,
  root: process.cwd(),
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});
const errors = [];
const originalError = console.error;
console.error = (...args) => {
  if (!String(args[0]).includes("not wrapped in act"))
    errors.push(args.map(String).join(" "));
};
try {
  const { default: App } = await server.ssrLoadModule("/src/App.jsx");
  render(React.createElement(App));
  await screen.findByRole(
    "heading",
    { name: "The auction advantage." },
    { timeout: 15000 },
  );
  for (const name of [
    "Overview",
    "Pressure Index",
    "Batters",
    "Bowlers",
    "Shortlist",
    "Compare",
    "Methodology",
  ])
    assert.ok(
      screen.getByRole("link", { name }).getAttribute("href").startsWith("#/"),
    );
  const nav = async (name) => {
    await user.click(
      screen.getByRole("link", {
        name:
          name === "Shortlist"
            ? /^Shortlist/
            : name === "Compare"
              ? /^Compare/
              : name,
      }),
    );
    await waitFor(() =>
      assert.equal(
        screen
          .getByRole("link", {
            name:
              name === "Shortlist"
                ? /^Shortlist/
                : name === "Compare"
                  ? /^Compare/
                  : name,
          })
          .getAttribute("aria-current"),
        "page",
      ),
    );
  };
  await nav("Pressure Index");
  await screen.findByRole("heading", { name: "Pressure Reliability Index." });
  const firstScore = screen
    .getAllByRole("meter")[0]
    .getAttribute("aria-valuenow");
  fireEvent.change(
    screen.getByRole("slider", { name: "differential weight" }),
    { target: { value: "0" } },
  );
  await waitFor(() =>
    assert.notEqual(
      screen.getAllByRole("meter")[0].getAttribute("aria-valuenow"),
      firstScore,
    ),
  );
  await user.click(screen.getByRole("button", { name: "Reset weights" }));
  await user.type(
    screen.getByRole("searchbox", { name: "Player search" }),
    "Naman",
  );
  await user.click(
    within(screen.getByRole("table", { name: /Players with PRI/ })).getByRole(
      "button",
      { name: "Naman Dhir", exact: true },
    ),
  );
  const dialog = screen.getByRole("dialog", { name: "Naman Dhir" });
  assert.equal(dialog.open, true);
  await user.click(
    within(dialog).getByRole("button", { name: "Add Naman Dhir to shortlist" }),
  );
  await user.click(
    within(dialog).getByRole("button", { name: "Close player dossier" }),
  );
  await nav("Shortlist");
  await screen.findByRole("heading", {
    name: "Build a squad. Back the evidence.",
  });
  assert.ok(screen.getByRole("button", { name: "Naman Dhir", exact: true }));
  await user.type(
    screen.getByRole("textbox", { name: "Notes for Naman Dhir" }),
    "Validate availability and finishing role.",
  );
  fireEvent.change(
    screen.getByRole("spinbutton", { name: "Planning purse in crore" }),
    { target: { value: "30" } },
  );
  await waitFor(() =>
    assert.equal(JSON.parse(localStorage.getItem("rr-purse-v2")), 30),
  );
  assert.ok(
    JSON.parse(localStorage.getItem("rr-notes-v2"))["37052"].includes(
      "Validate",
    ),
  );
  await user.click(screen.getByRole("button", { name: "Export CSV" }));
  assert.ok(
    (await exportedBlob.text()).includes(
      "Validate availability and finishing role.",
    ),
  );
  assert.ok((await exportedBlob.text()).includes("Hypothetical purse (crore)"));
  await user.click(screen.getByRole("button", { name: "Print / PDF" }));
  assert.equal(printCalls, 1);
  await nav("Batters");
  await screen.findByRole("heading", {
    name: "Make every pressure ball count.",
  });
  await waitFor(() =>
    assert.ok(document.querySelector(".recharts-radar-polygon")),
  );
  await user.click(screen.getByRole("button", { name: "Open player dossier" }));
  assert.ok(screen.getByRole("dialog"));
  await user.click(
    screen.getByRole("button", { name: "Close player dossier" }),
  );
  await nav("Bowlers");
  await screen.findByRole("heading", { name: "Own the difficult overs." });
  await nav("Compare");
  await screen.findByRole("heading", { name: "The decision, side by side." });
  const select = screen.getByRole("combobox", {
    name: "Add player to comparison",
  });
  const ids = [...select.options]
    .filter((o) => o.value)
    .slice(0, 3)
    .map((o) => o.value);
  for (const id of ids) await user.selectOptions(select, id);
  assert.equal(
    screen.getByRole("combobox", { name: "Add player to comparison" }).disabled,
    true,
  );
  assert.ok(
    screen.getByRole("table", { name: "Radar evidence and denominators" }),
  );
  await nav("Methodology");
  await screen.findByRole("heading", { name: "Every score has a story." });
  assert.ok(screen.getByText("2,00,999"));
  assert.ok(screen.getByText("38"));
  await user.selectOptions(
    screen.getByRole("combobox", { name: "League" }),
    "Other T20",
  );
  const seasonOptions = [
    ...screen.getByRole("combobox", { name: "Data season" }).options,
  ].map((o) => o.value);
  assert.deepEqual(seasonOptions, ["All seasons", "2025", "2024"]);
  const absentScope = data.buckets.find(b => b.league === 'Other T20' && !b.players.some(p => p.id === '37052'));
  assert.ok(absentScope, 'A scope without the saved player is needed for this regression');
  await user.selectOptions(screen.getByRole('combobox', { name: 'Data season' }), absentScope.season);
  await nav("Shortlist");
  await screen.findByRole("heading", {
    name: "Saved outside the current scope",
  });
  assert.ok(screen.getByText("Naman Dhir"));
  await nav("Pressure Index");
  await user.type(
    screen.getByRole("searchbox", { name: "Player search" }),
    "zzzz-no-player",
  );
  assert.ok(
    screen.getByRole("heading", { name: "No players match this scope." }),
  );
  await user.click(screen.getByRole("button", { name: "Open navigation" }));
  assert.equal(document.querySelector(".workspace").hasAttribute('inert'), true);
  await user.keyboard("{Escape}");
  await waitFor(() =>
    assert.equal(document.querySelector(".workspace").hasAttribute('inert'), false),
  );
  cleanup();
  render(React.createElement(App));
  await screen.findByRole(
    "heading",
    { name: "Pressure Reliability Index." },
    { timeout: 15000 },
  );
  await nav("Shortlist");
  assert.equal(
    screen.getByRole("textbox", { name: "Notes for Naman Dhir" }).value,
    "Validate availability and finishing role.",
  );
  assert.equal(
    screen.getByRole("spinbutton", { name: "Planning purse in crore" }).value,
    "30",
  );
  assert.equal(JSON.parse(localStorage.getItem("rr-compare-v2")).length, 3);
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log(
    "PASS: all seven routes, live weights, search, dossier, persisted shortlist/notes/purse, both discipline charts, 3-player comparison, scoped seasons, empty/out-of-scope states, CSV contents, print action and mobile menu Escape.",
  );
} finally {
  cleanup();
  await server.close();
  console.error = originalError;
  dom.window.close();
}
