import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// A user-invoked command, NOT a model-callable tool or an enforced CI gate.
export default function (pi: ExtensionAPI) {
  pi.registerCommand("verify", {
    description: "Run this workshop's five tests and record the actual result",
    handler: async (_args, ctx) => {
      if (!ctx.isIdle()) {
        ctx.ui.notify("Wait for the current agent turn before /verify.", "warning");
        return;
      }
      try {
        const manifest = JSON.parse(await readFile(join(ctx.cwd, "package.json"), "utf8"));
        if (manifest.name !== "pi-sharing-demo") {
          ctx.ui.notify("/verify is scoped to the pi-sharing-demo directory.", "error");
          return;
        }
        ctx.ui.setStatus("verify", "verify: running");
        // Fixed argv, no shell interpolation; tests are still trusted executable code.
        const result = await pi.exec("node", [
          "--disable-warning=ExperimentalWarning", "--test", "test/summary.test.mjs",
        ], { cwd: ctx.cwd, timeout: 15_000 });
        const passed = result.code === 0 && !result.killed;
        const label = result.killed ? "STOPPED" : passed ? "PASS" : "FAIL";
        const output = `${result.stdout}\n${result.stderr}`.trim().slice(-6000);
        pi.sendMessage({
          customType: "verify-result",
          content: `verify: ${label}; exit=${result.code}; stopped=${result.killed}\n${output}`,
          display: true,
        }, { triggerTurn: false });
        ctx.ui.setStatus("verify", `verify: ${label}`);
        ctx.ui.notify(`verify: ${label}`, passed ? "info" : "error");
      } catch (error) {
        ctx.ui.setStatus("verify", "verify: ERROR");
        ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
      }
    },
  });
}
