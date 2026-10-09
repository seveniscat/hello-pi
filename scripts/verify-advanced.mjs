import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=dirname(dirname(fileURLToPath(import.meta.url)));
const runs=[['router'],['sessions'],['codemode'],['steering'],['subagents'],['subagents','--fail-tests'],['durable']];
for(const [name,...args] of runs){
  const result=spawnSync(process.execPath,[join(root,'demo/advanced',`${name}.mjs`),...args],{cwd:root,encoding:'utf8',timeout:60000});
  assert.equal(result.status,0,`${name}: ${result.stderr}\n${result.stdout}`);
  console.log(`PASS ${name}${args.length?' (failure aggregation branch)':''}`);
}
const names=['router','sessions','codemode','steering','subagents','subagents-partial-failure','durable'];
const modes={};for(const name of names){modes[name]=JSON.parse(await readFile(join(root,'verification/advanced',`${name}.json`),'utf8')).mode;}
const report={referenceDate:'2026-10-09',executedAtUTC:new Date().toISOString(),passed:runs.length,modes,
  limits:['No real provider call, TUI demonstration, MCP transport or model-quality benchmark was performed.',
    'Router catalog, steering responses and subagent model responses are explicit fixtures; see per-demo reports.',
    'Durable is a real custom task and real process restart, not a model-driven tool recovery test.']};
await writeFile(join(root,'verification/advanced/summary.json'),JSON.stringify(report,null,2)+'\n');
console.log(`${runs.length} advanced checks passed; online script intentionally not invoked.`);
