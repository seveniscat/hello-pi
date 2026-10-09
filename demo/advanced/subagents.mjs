import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { root, piPackage, saveReport } from './common.mjs';

const pkg = await piPackage();
const temporary = await mkdtemp(join(tmpdir(), 'pi-subagents-demo-'));
const worker = fileURLToPath(new URL('./subagent-worker.mjs', import.meta.url));
const failTests = process.argv.includes('--fail-tests');
const started = [];
async function launch(role) {
  const home = join(temporary, role); await mkdir(home, {recursive:true});
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [worker, pkg, role, join(root, 'demo/starter'), failTests ? 'fail-tests' : 'ok'], {
      cwd: home, env: { HOME: home, PATH: `${dirname(process.execPath)}:/usr/bin:/bin`, PI_CODING_AGENT_DIR: join(home, 'agent'), PI_OFFLINE: '1', LANG: 'C.UTF-8' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    started.push({role,pid:child.pid});
    let out = '', err = '', forceTimer;
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      forceTimer = setTimeout(() => { if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL'); }, 1000);
    }, 15000);
    child.stdout.on('data', data => {out += data;}); child.stderr.on('data', data => {err += data;});
    child.on('error', error => {clearTimeout(timer); clearTimeout(forceTimer); reject(error);});
    child.on('close', (code, signal) => {
      clearTimeout(timer); clearTimeout(forceTimer);
      if (code !== 0) resolve({ role, ok:false, code, signal, error:err.trim() });
      else { try {resolve({role,ok:true,...JSON.parse(out.trim())});} catch(error) {reject(new Error(`${error.message}\n${out}\n${err}`));} }
    });
  });
}
try {
  const results = await Promise.all([launch('rules'), launch('tests')]);
  assert.equal(started.length,2); assert.notEqual(started[0].pid,started[1].pid);
  if (!failTests) {
    assert.ok(results.every(result=>result.ok),JSON.stringify(results));
    assert.notEqual(results[0].sessionId,results[1].sessionId);
    assert.ok(results.every(result=>result.otherMarkerAbsent && result.toolCalls===1 && result.realModelCalls===0));
  } else {
    assert.equal(results.find(x=>x.role==='rules').ok,true);
    assert.equal(results.find(x=>x.role==='tests').ok,false);
  }
  await saveReport(failTests ? 'subagents-partial-failure' : 'subagents', {
    mode: 'REAL_CHILD_PROCESSES_AND_PI_SDK_WITH_OFFICIAL_FAUX_MODEL_FIXTURES',
    realComponents: ['two Node child processes','Pi 1.1.0 createAgentSession','independent in-memory sessions','actual restricted teaching-file reads'],
    started, results, complete: results.every(x=>x.ok),
    limits: ['Model responses are prewritten fixtures, not model reasoning.', 'This is our SDK orchestration example, not a recording of the official subagent extension.', 'Processes still share host OS permissions; exposed tools are not a sandbox.', 'No real provider, credentials, network or model cost was involved.'],
  });
} finally {await rm(temporary,{recursive:true,force:true});}
