import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { root, piPackage, saveReport } from './common.mjs';

if (!process.argv.includes('--live')) throw new Error('Real provider calls require --live. This is not part of the offline test suite.');
const model = process.env.PI_TALK_MODEL;
const profile = process.env.PI_CODING_AGENT_DIR;
if (!model || !profile) throw new Error('Set PI_TALK_MODEL and a dedicated PI_CODING_AGENT_DIR. Prepare credentials yourself before running.');
const pkg = await piPackage();
const temporary = await mkdtemp(join(tmpdir(), 'pi-live-review-'));
const specs = [
  {role:'rules', files:'README.md and src/summary.ts', focus:'Does the archived predicate implement the stated missing/false/true rule?'},
  {role:'tests', files:'README.md, test/summary.test.mjs and fixtures/tasks.json', focus:'Which stated behaviors do the tests cover, and which are unverified? Do not claim to have executed tests.'},
];
async function launch(spec) {
  const cwd = join(temporary,spec.role); await mkdir(cwd);
  await cp(join(root,'demo/starter'),cwd,{recursive:true});
  const prompt = `Read only ${spec.files} under the current teaching directory. ${spec.focus} Do not edit files, run commands or read outside this directory. Return a JSON object with role, findings, evidence and limits. Do not pretend tests were executed.`;
  const args = [join(pkg,'dist/bundle/cli.js'),'--mode','json','--print','--no-session',
    '--no-extensions','--no-mcp','--no-skills','--no-prompt-templates','--no-context-files','--no-themes','--no-approve',
    '--tools','read,grep,find,ls','--model',model,'--append-system-prompt',`You are the ${spec.role} reviewer. Use evidence, not guesses.`,'--',prompt];
  return new Promise(resolveResult => {
    const child = spawn(process.execPath,args,{cwd,env:{...process.env,PI_CODING_AGENT_DIR:resolve(profile)},stdio:['ignore','pipe','pipe']});
    let stdout='',stderr='',forceTimer,timedOut=false;
    const timer=setTimeout(()=>{timedOut=true;child.kill('SIGTERM');forceTimer=setTimeout(()=>{
      if(child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');
    },1500);},90000);
    child.stdout.on('data',data=>{stdout+=data;}); child.stderr.on('data',data=>{stderr+=data;});
    child.on('error',error=>{clearTimeout(timer);clearTimeout(forceTimer);resolveResult({role:spec.role,ok:false,error:error.message});});
    child.on('close',(code,signal)=>{
      clearTimeout(timer);clearTimeout(forceTimer);
      const events=stdout.split('\n').filter(Boolean).flatMap(line=>{try{return[JSON.parse(line)];}catch{return[];}});
      const messages=events.filter(event=>event.type==='message_end'&&event.message?.role==='assistant').map(event=>event.message);
      const final=messages.at(-1);
      const text=(final?.content??[]).filter(block=>block.type==='text').map(block=>block.text).join('\n');
      const ok=code===0&&!timedOut&&Boolean(final)&&!['error','aborted'].includes(final.stopReason);
      resolveResult({role:spec.role,pid:child.pid,ok,exitCode:code,signal,timedOut,model,stopReason:final?.stopReason,text,stderr:stderr.slice(-4000)});
    });
  });
}
try {
  const results=await Promise.all(specs.map(launch));
  await saveReport('subagents-live',{mode:'REAL_PI_CLI_CHILDREN_REAL_PROVIDER_USER_INITIATED',results,complete:results.every(x=>x.ok),
    limits:['This script is provided for rehearsal; its presence is not evidence that it was executed.',
      'Read-only tool selection and separate teaching directories are not an OS sandbox.',
      'Real provider calls can incur cost. A successful response is not an independent correctness evaluation.']});
  if(results.some(x=>!x.ok))process.exitCode=1;
}finally{await rm(temporary,{recursive:true,force:true});}
