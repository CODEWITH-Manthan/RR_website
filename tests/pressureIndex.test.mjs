import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  buildOverview,
  calculatePRI,
  bidEstimate,
  wilsonInterval,
  radarMetrics,
} from "../src/utils/pressureIndex.js";

test("a lower bowling economy and higher batting strike rate improve the index", () => {
  const base = {
    normalRate: 100,
    pressureRate: 100,
    consistency: 50,
    sampleSize: 10,
    discipline: "batting",
  };
  assert.equal(calculatePRI(base).score, 50);
  assert.ok(
    calculatePRI({ ...base, pressureRate: 130 }).score >
      calculatePRI(base).score,
  );
  assert.ok(
    calculatePRI({ ...base, discipline: "bowling", pressureRate: 80 }).score >
      calculatePRI(base).score,
  );
  assert.ok(
    calculatePRI({ ...base, sampleSize: 30 }).score > calculatePRI(base).score,
  );
});
test("weights normalize and zero weights stay finite", () => {
  const p = {
    normalRate: 100,
    pressureRate: 120,
    consistency: 80,
    sampleSize: 20,
    discipline: "batting",
  };
  assert.equal(
    calculatePRI(p, { differential: 1, consistency: 0, confidence: 0 }).score,
    70,
  );
  assert.equal(
    calculatePRI(p, { differential: 0, consistency: 0, confidence: 0 }).score,
    0,
  );
});
test("real data scopes are bounded, independently filterable, and sorted", async () => {
  const data = JSON.parse(
    await readFile(
      new URL("../src/data/analytics.json", import.meta.url),
      "utf8",
    ),
  );
  const all = buildOverview(data, "All leagues", "All seasons");
  const ipl = buildOverview(data, "IPL", "All seasons");
  const one = buildOverview(data, "IPL", "2025");
  assert.equal(all.deliveries, data.totalDeliveries);
  assert.ok(all.deliveries > ipl.deliveries && ipl.deliveries > one.deliveries);
  assert.ok(ipl.players.length > 0);
  for (const [i, p] of ipl.players.entries()) {
    assert.ok(Number.isFinite(p.score) && p.score >= 0 && p.score <= 100);
    assert.ok(
      p.sampleSize >= 5 && p.pressureBalls >= 30 && p.normalBalls >= 30,
    );
    if (i) assert.ok(ipl.players[i - 1].score >= p.score);
  }
  assert.equal(buildOverview(data, "IPL", "1900").players.length, 0);
  assert.equal(
    data.audit.rawRows,
    data.audit.includedRows +
      data.audit.excludedSuperOverRows +
      data.audit.unmatchedRows,
  );
  const batting = buildOverview(data, "IPL", "All seasons", undefined, {
    discipline: "batting",
  });
  const bowling = buildOverview(data, "IPL", "All seasons", undefined, {
    discipline: "bowling",
  });
  assert.ok(batting.players.every((p) => p.discipline === "batting"));
  assert.ok(bowling.players.every((p) => p.discipline === "bowling"));
  assert.ok(
    batting.players.some((p) => bowling.players.some((b) => b.id === p.id)),
    "All-rounders must appear in both discipline cohorts",
  );
  for (const p of [...batting.players, ...bowling.players]) {
    for (const k of ["chasing", "death", "highRate", "wicketsDown"])
      assert.ok(p.stats[k].balls <= p.pressureBalls);
    for (const axis of radarMetrics(p))
      assert.ok(axis.value === null || (axis.value >= 0 && axis.value <= 100));
    assert.ok(
      p.consistencyInterval[0] <= p.consistency &&
        p.consistencyInterval[1] >= p.consistency,
    );
  }
});
test("Wilson intervals widen with sparse samples; planning ceilings obey bounds", () => {
  const low = wilsonInterval(4, 5),
    high = wilsonInterval(80, 100);
  assert.ok(low[1] - low[0] > high[1] - high[0]);
  assert.deepEqual(wilsonInterval(0, 0), [0, 100]);
  const p = { score: 80, confidence: 70, eligible: true };
  assert.ok(bidEstimate(p, 45, 6).ceiling > bidEstimate(p, 30, 6).ceiling);
  assert.ok(bidEstimate(p, 45, 6).ceiling > bidEstimate(p, 45, 10).ceiling);
  assert.equal(bidEstimate(p, 0, 6).ceiling, 0);
  assert.equal(bidEstimate({ ...p, eligible: false }, 45, 6).ceiling, 0);
  assert.ok(bidEstimate(p, 1, 1).ceiling <= 1);
});
