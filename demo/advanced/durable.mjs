import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { saveReport } from './common.mjs';

const runtime = fileURLToPath(new URL('./runtime/', import.meta.url));
let pkg;
try {pkg = JSON.parse(await readFile(join(runtime,'node_modules/@earendil-works/pi-durable/package.json'),'utf8'));}
catch {throw new Error('Durable runtime missing. Run: npm ci --prefix demo/advanced/runtime --ignore-scripts --no-audit --no-fund');}
assert.equal(pkg.version,'1.1.0');
const temp = await mkdtemp(join(tmpdir(),'pi-durable-demo-'));
const home = join(temp,'home'); await mkdir(home);
const state = join(temp,'task-run');
const input = join(temp,'input.json');
const fixture = JSON.parse(await readFile(new URL('./fixtures/review-data.json', import.meta.url),'utf8'));
await writeFile(input,JSON.stringify(fixture.tasks));
function run(mode) {
  const r = spawnSync(process.execPath,[join(runtime,'durable-worker.mjs'),mode,state,...(mode==='crash'?[input]:[])],{
    cwd:runtime,timeout:15000,encoding:'utf8',
    env:{HOME:home,PATH:`${dirname(process.execPath)}:/usr/bin:/bin`,PI_OFFLINE:'1',PI_CODING_AGENT_DIR:join(home,'agent'),LANG:'C.UTF-8'},
  });
  const events = r.stdout.trim().split('\n').filter(Boolean).map(line=>{
    const space=line.indexOf(' '); return {event:line.slice(0,space),data:JSON.parse(line.slice(space+1))};
  });
  return {mode,status:r.status,signal:r.signal,events,stderr:r.stderr,error:r.error?.message};
}
try {
  const crash = run('crash');
  assert.equal(crash.signal,'SIGKILL',JSON.stringify(crash));
  assert.ok(crash.events.some(x=>x.event==='B_ENTERED_WITH_DURABLE_CHECKPOINT'));
  const resume = run('resume');
  assert.equal(resume.status,0,JSON.stringify(resume));
  const inspect = run('inspect');
  assert.equal(inspect.status,0,JSON.stringify(inspect));
  const count = resume.events.find(x=>x.event==='PHASE_ENTRIES').data;
  const after = inspect.events.find(x=>x.event==='PHASE_ENTRIES').data;
  assert.equal(count.A,1); assert.equal(count.B,2);
  assert.deepEqual(count,after);
  assert.equal(count.taskIds.length,1);
  const before = resume.events.find(x=>x.event==='BEFORE_SCHEDULING').data;
  assert.equal(before.state.status,'pending');
  assert.equal(before.state.checkpoint.phase,'B');
  const settled = resume.events.find(x=>x.event==='SETTLED').data;
  assert.equal(settled.state.status,'terminal');
  assert.equal(settled.state.outcome.status,'completed');
  assert.deepEqual(settled.state.outcome.result,{taskIds:['T-101','T-102'],draft:'待审查任务：T-101、T-102'});
  await saveReport('durable',{
    mode:'REAL_PI_DURABLE_1_1_0_JSONL_HARNESS_TASK_ACROSS_SIGKILL_AND_REOPEN_NO_MODEL',
    realComponents:['Harness','defineTask','Node JSONL storage with fsync','actual child-process SIGKILL','second-process recovery'],
    counts:count,recoveredPhase:before.state.checkpoint.phase,result:settled.state.outcome.result,
    runs:[crash,resume,inspect],
    limits:['A custom deterministic task is tested, not a model-driven conversation or unsafe ToolTask.',
      'The execution-attempt log is our observer; checkpoints and task recovery are implemented by real Durable.',
      'A chosen process-crash point is not a power-loss, disk-corruption or distributed exactly-once test.',
      'No model provider or external notification service is configured.'],
  });
} finally {await rm(temp,{recursive:true,force:true});}
