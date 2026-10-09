import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const temp = await mkdtemp(join(tmpdir(), 'pi-sharing-check-'));
const report = { referenceDate: '2026-10-09', executedAtUTC: new Date().toISOString(), node: process.version, checks: [], limits: [] };
const check = (name) => { report.checks.push(name); console.log(`PASS ${name}`); };
const run = (args, cwd) => spawnSync(process.execPath, ['--disable-warning=ExperimentalWarning', ...args], { cwd, encoding: 'utf8', timeout: 20000 });
await mkdir(join(root, 'verification'), { recursive: true });
try {
  const broken = join(temp, 'broken');
  const fixed = join(temp, 'fixed');
  for (const path of [broken, fixed]) await cp(join(root, 'demo/starter'), path, { recursive: true });
  await copyFile(join(root, 'demo/reference/summary.fixed.ts'), join(fixed, 'src/summary.ts'));
  const red = run(['--test', 'test/summary.test.mjs'], broken);
  assert.equal(red.status, 1, red.stderr);
  assert.match(red.stdout, /# pass 4/);
  assert.match(red.stdout, /# fail 1/);
  check('broken baseline intentionally has 4 pass / 1 fail');
  await writeFile(join(root, 'verification/broken-tests.txt'), red.stdout + red.stderr);
  const green = run(['--test', 'test/summary.test.mjs'], fixed);
  assert.equal(green.status, 0, green.stderr);
  assert.match(green.stdout, /# pass 5/);
  assert.match(green.stdout, /# fail 0/);
  check('reference repair has 5 pass / 0 fail');
  await writeFile(join(root, 'verification/fixed-tests.txt'), green.stdout + green.stderr);
  const before = run(['src/cli.ts', 'fixtures/tasks.json'], broken);
  const after = run(['src/cli.ts', 'fixtures/tasks.json'], fixed);
  assert.equal(before.status, 0); assert.equal(after.status, 0);
  assert.deepEqual(JSON.parse(before.stdout), { total: 2, open: 0, inProgress: 1, done: 1 });
  assert.deepEqual(JSON.parse(after.stdout), { total: 4, open: 1, inProgress: 1, done: 2 });
  check('CLI sample is independently checked before and after repair');
  await writeFile(join(root, 'verification/sample-outputs.json'), JSON.stringify({ broken: JSON.parse(before.stdout), fixed: JSON.parse(after.stdout) }, null, 2) + '\n');
  const missing = run(['src/cli.ts'], fixed);
  assert.equal(missing.status, 1); assert.match(missing.stderr, /Usage:/);
  check('CLI missing-argument branch has a nonzero exit');
  const source = await readFile(join(root, 'demo/starter/src/summary.ts'), 'utf8');
  const solution = await readFile(join(root, 'demo/reference/summary.fixed.ts'), 'utf8');
  assert.equal(source.replace('task.archived === false', 'task.archived !== true'), solution);
  check('reference changes only the archive predicate');

  const ext = join(root, 'demo/resources/.pi/extensions/verify.ts');
  const factory = (await import(pathToFileURL(ext).href)).default;
  let handler;
  const messages = []; const notes = []; const statuses = [];
  const context = (cwd, idle = true) => ({ cwd, isIdle: () => idle, ui: {
    notify: (text, level) => notes.push({ text, level }),
    setStatus: (key, text) => statuses.push({ key, text }),
  }});
  let execCalls = 0;
  factory({
    registerCommand: (name, options) => { assert.equal(name, 'verify'); handler = options.handler; },
    exec: async () => { execCalls++; return { code: 0, killed: true, stdout: '', stderr: '' }; },
    sendMessage: (message, options) => messages.push({ message, options }),
  });
  await handler('', context(fixed, false));
  assert.equal(execCalls, 0); assert.equal(notes.at(-1).level, 'warning');
  check('verify refuses to run while the agent is busy');
  await handler('', context(root));
  assert.equal(execCalls, 0); assert.match(notes.at(-1).text, /scoped/);
  check('verify rejects an unrelated working directory');
  await handler('', context(fixed));
  assert.match(messages.at(-1).message.content, /verify: STOPPED/);
  assert.equal(messages.at(-1).options.triggerTurn, false);
  assert.equal(notes.at(-1).level, 'error');
  check('verify never treats a stopped process as success (simulated branch)');

  // Compatibility smoke test against a separately installed, exact Pi version.
  // Uses its real loader and exec; no auth store, model request, global configuration, or TUI.
  let packageDir;
  try {
    const globalRoot = execFileSync('npm', ['root', '-g'], { encoding: 'utf8', timeout: 5000 }).trim();
    const candidate = join(globalRoot, '@earendil-works/pi-coding-agent');
    const metadata = JSON.parse(await readFile(join(candidate, 'package.json'), 'utf8'));
    if (metadata.version === '1.1.0') { packageDir = candidate; report.piLoaderVersion = metadata.version; }
    else report.limits.push(`Installed Pi is ${metadata.version}; exact 1.1.0 loader check skipped.`);
  } catch { report.limits.push('Pi 1.1.0 npm package not located; real loader check skipped.'); }
  if (packageDir) {
    const { loadExtensions, createExtensionRuntime } = await import(pathToFileURL(join(packageDir, 'dist/core/extensions/loader.js')).href);
    const runtime = createExtensionRuntime();
    const actual = [];
    runtime.sendMessage = (message, options) => actual.push({ message, options });
    const loaded = await loadExtensions([ext], fixed, undefined, runtime);
    assert.equal(loaded.errors.length, 0, JSON.stringify(loaded.errors));
    assert.equal(loaded.extensions.length, 1);
    const command = loaded.extensions[0].commands.get('verify');
    assert.ok(command);
    await command.handler('', context(broken));
    assert.match(actual.at(-1).message.content, /verify: FAIL; exit=1/);
    assert.match(actual.at(-1).message.content, /# fail 1/);
    check('Pi 1.1.0 real loader and real exec report the broken suite as FAIL');
    await command.handler('', context(fixed));
    assert.match(actual.at(-1).message.content, /verify: PASS; exit=0/);
    assert.match(actual.at(-1).message.content, /# pass 5/);
    assert.equal(actual.at(-1).options.triggerTurn, false);
    check('Pi 1.1.0 real loader and real exec report the fixed suite as PASS');
    report.extensionMessages = actual.map(({message, options}) => ({ heading: message.content.split('\n')[0], options }));
  }
  report.limits.push('No real model call, credentials check, interactive TUI test, static TypeScript check, MCP connection, or Durable runtime test was performed.');
  report.limits.push('Reference repair and example outputs are authored teaching fixtures, not a recorded model run.');
  await writeFile(join(root, 'verification/report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`\n${report.checks.length} checks passed. Scope and limits: verification/report.json`);
} finally {
  // Remove only the unique temporary directory this process created.
  await rm(temp, { recursive: true, force: true });
}
