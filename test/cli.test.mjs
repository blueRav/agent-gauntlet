import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
const cli = fileURLToPath(new URL("../src/cli.mjs", import.meta.url));
test("CLI writes a passing deterministic evaluation report", () => {
  const folder = mkdtempSync(join(tmpdir(), "agent-eval-")); const output = join(folder, "report.json");
  try {
    const run = spawnSync(process.execPath, [cli, "--output", output], { encoding: "utf8", timeout: 10000 });
    assert.equal(run.status, 0, run.stderr);
    const report = JSON.parse(readFileSync(output, "utf8"));
    assert.equal(report.mode, "deterministic"); assert.equal(report.summary.probePassRate, 1);
  } finally { rmSync(folder, { recursive: true, force: true }); }
});
test("CLI live mode fails clearly without credentials", () => {
  const run = spawnSync(process.execPath, [cli, "--live"], {
    encoding: "utf8", timeout: 10000, env: { ...process.env, OPENAI_API_KEY: "", OPENAI_MODEL: "" }
  });
  assert.notEqual(run.status, 0); assert.match(run.stderr, /OPENAI_API_KEY/);
});
