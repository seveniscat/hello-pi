import { execFileSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
export async function piPackage() {
  const directory = process.env.PI_PACKAGE_DIR || join(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim(), '@earendil-works/pi-coding-agent');
  const pkg = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'));
  if (pkg.version !== '1.1.0') throw new Error(`This workshop pins Pi 1.1.0; found ${pkg.version}. No automatic installation or upgrade performed.`);
  return directory;
}
export async function importPi(relative) {
  return import(pathToFileURL(join(await piPackage(), relative)).href);
}
export async function saveReport(name, data) {
  const directory = join(root, 'verification/advanced');
  await mkdir(directory, { recursive: true });
  const report = { referenceDate: '2026-10-09', executedAtUTC: new Date().toISOString(), ...data };
  await writeFile(join(directory, `${name}.json`), JSON.stringify(report, null, 2) + '\n');
  let view = report;
  if (process.env.PI_TALK_VERBOSE !== '1') {
    if (name === 'router') view = { mode: report.mode, steps: report.steps };
    else if (name === 'sessions') view = { mode: report.mode, checks: report.checks, mainContext: report.mainContext, branchContext: report.branchContext, withSummary: report.withSummary };
    else if (name === 'codemode') view = { mode: report.mode, trace: report.trace, result: report.result, missingDoneFilterResult: report.missingDoneFilterResult, directProcessAccess: report.directProcessAccess.error.message, hostEffectAfterFailure: report.scriptFailureDoesNotRollBackHostCounter };
    else if (name === 'steering') view = { mode: report.mode, cases: report.cases.map(x => ({ toolExecution: x.toolExecution, trace: x.trace, checks: x.checks, fixtureModelCalls: x.fixtureModelCalls, realModelCalls: x.realModelCalls })) };
    else if (name.startsWith('subagents') && !name.endsWith('live')) view = { mode: report.mode, complete: report.complete, results: report.results.map(x => ({ role: x.role, ok: x.ok, pid: x.pid, sessionId: x.sessionId, exposedTools: x.exposedTools, toolCalls: x.toolCalls, fixtureModelCalls: x.fixtureModelCalls, realModelCalls: x.realModelCalls, error: x.error })) };
    else if (name === 'durable') view = { mode: report.mode, counts: report.counts, recoveredPhase: report.recoveredPhase, result: report.result, runs: report.runs.map(x => ({ mode: x.mode, status: x.status, signal: x.signal, before: x.events.find(e => e.event === 'BEFORE_SCHEDULING')?.data.state })) };
    view.limits = report.limits;
  }
  console.log(JSON.stringify(view, null, 2));
  console.log(`Full evidence: ${join(directory, `${name}.json`)}`);
}
