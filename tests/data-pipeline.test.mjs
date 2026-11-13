import test from "node:test";
import assert from "node:assert/strict";
import {
  parseCSV,
  deliveryFacts,
  pressureFlags,
} from "../scripts/data-pipeline.mjs";
test("CSV parser preserves quoted fields and refuses malformed rows", () => {
  assert.deepEqual(parseCSV('id,name\r\n1,"A, B"\r\n2,"A ""quote"""\r\n'), [
    { id: "1", name: "A, B" },
    { id: "2", name: 'A "quote"' },
  ]);
  assert.throws(() => parseCSV("id,name\n1,too,many\n"), /Invalid CSV row/);
  assert.throws(() => parseCSV('id,name\n1,"unclosed'), /Unclosed/);
});
test("extras and dismissal attribution preserve cricket accounting", () => {
  const ball = {
    runs: "4",
    extras1_runs: "1",
    extras_type: "Overstep",
    is_four: "true",
    is_wicket: "false",
  };
  assert.deepEqual(
    [
      deliveryFacts(ball).legal,
      deliveryFacts(ball).batterBall,
      deliveryFacts(ball).totalRuns,
    ],
    [false, true, 5],
  );
  assert.equal(
    deliveryFacts({ ...ball, extras_type: "wide" }).batterBall,
    false,
  );
  assert.equal(
    deliveryFacts({
      ...ball,
      runs: "0",
      extras_type: "legbyes",
      extras1_runs: "4",
    }).bowlerRuns,
    0,
  );
  assert.equal(
    deliveryFacts({ ...ball, is_wicket: "true", dismissal_type: "Run Out" })
      .bowlerWicket,
    false,
  );
  assert.equal(
    deliveryFacts({ ...ball, is_wicket: "true", dismissal_type: "Bowled" })
      .bowlerWicket,
    true,
  );
});
test("pressure uses pre-ball state and overlapping flags count only once", () => {
  const calm = pressureFlags(
    { innings: "1", overid: "10" },
    { runs: 50, wickets: 3, legal: 54 },
    150,
  );
  assert.equal(calm.pressure, false);
  const death = pressureFlags(
    { innings: "2", overid: "16" },
    { runs: 90, wickets: 4, legal: 90 },
    151,
  );
  assert.deepEqual(death, {
    chasing: true,
    death: true,
    highRate: true,
    wicketsDown: true,
    pressure: true,
  });
  assert.equal(
    pressureFlags(
      { innings: "1", overid: "10" },
      { runs: 50, wickets: 4, legal: 54 },
      150,
    ).wicketsDown,
    true,
  );
  assert.equal(
    pressureFlags(
      { innings: "2", overid: "8" },
      { runs: 50, wickets: 1, legal: 42 },
      100,
      10,
    ).highRate,
    true,
  );
});
