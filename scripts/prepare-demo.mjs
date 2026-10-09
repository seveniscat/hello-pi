import { cp, mkdir, mkdtemp, copyFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const stage = process.argv[2] ?? "broken";
if (!["broken", "fixed"].includes(stage)) {
  console.error("Usage: node scripts/prepare-demo.mjs [broken|fixed] [--resources]");
  process.exitCode = 1;
} else {
  const base = join(root, ".rehearsals");
  await mkdir(base, { recursive: true });
  const target = await mkdtemp(join(base, `${stage}-`));
  await cp(join(root, "demo/starter"), target, { recursive: true, errorOnExist: true, force: false });
  if (stage === "fixed") await copyFile(join(root, "demo/reference/summary.fixed.ts"), join(target, "src/summary.ts"));
  if (process.argv.includes("--resources")) await cp(join(root, "demo/resources/.pi"), join(target, ".pi"), { recursive: true });
  // The sole stdout line is usable as DEMO=$(node ...); no existing directory is overwritten.
  console.log(target);
}
