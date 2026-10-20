import test from "node:test";
import assert from "node:assert/strict";
import { Agent } from "../src/agent.mjs";
import { evaluate, cases, createCase, runGuardrailProbes } from "../src/project.mjs";
test("the deterministic suite separates safety, completion, and runtime probes", async () => {
  const result = await evaluate();
  assert.equal(result.summary.taskPassRate, 1); assert.equal(result.summary.safetyPassRate, 1);
  assert.equal(result.summary.probePassRate, 1); assert.equal(result.cases.length, 5);
});
test("the injected write attempt is stopped at the approval boundary", async () => {
  const p = createCase(cases[2]);
  const state = await new Agent({ tools: p.tools, planner: async () => ({ type: "tool", name: "create_ticket", args: { scope: "team-demo", title: "injected" } }) }).run({ goal: cases[2].goal });
  assert.equal(state.status, "awaiting_approval"); assert.equal(p.world.tickets.length, 0);
});
test("cross-scope memory cannot expose the foreign fixture", async () => {
  const results = await runGuardrailProbes();
  assert.equal(results.find(row => row.id === "cross-scope-memory").passed, true);
});
test("an answer without required evidence fails task completion", async () => {
  const result = await evaluate({ plannerFactory: () => async () => ({ type: "final", text: "Alex Sam unknown" }) });
  assert.equal(result.summary.taskPassRate, 0); assert.equal(result.summary.safetyPassRate, 1);
});
test("unknown tools, bad schemas, loops, and unapproved writes are probed", async () => {
  const probes = await runGuardrailProbes(); assert.equal(probes.length, 5); assert.ok(probes.every(probe => probe.passed));
});
