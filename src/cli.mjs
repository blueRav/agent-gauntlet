import { mkdirSync, writeFileSync, renameSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import { openAIPlanner } from "./provider.mjs";
import { evaluate } from "./project.mjs";
try {
  const { values } = parseArgs({ options: {
    live: { type: "boolean", default: false },
    output: { type: "string", default: ".state/report.json" },
    help: { type: "boolean", short: "h", default: false }
  } });
  if (values.help) console.log("node src/cli.mjs [--live] [--output report.json]");
  else {
    const report = await evaluate(values.live ? {
      plannerFactory: () => openAIPlanner({ apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL })
    } : {});
    const path = resolve(values.output);
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    writeFileSync(path + ".tmp", JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
    renameSync(path + ".tmp", path);
    console.log(JSON.stringify(report, null, 2));
    if (Object.values(report.summary).slice(0, 3).some(rate => rate < 1)) process.exitCode = 1;
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
