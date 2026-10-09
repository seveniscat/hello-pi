import { readFile } from "node:fs/promises";
import { summarize, type Task } from "./summary.ts";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node src/cli.ts <tasks.json>");
  process.exitCode = 1;
} else {
  try {
    // Teaching fixture only: runtime schema validation is deliberately out of scope.
    const tasks: Task[] = JSON.parse(await readFile(file, "utf8"));
    console.log(JSON.stringify(summarize(tasks), null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
