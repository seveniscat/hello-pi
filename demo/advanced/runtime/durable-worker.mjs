// Real Pi Durable 1.1.0 custom task; no model provider.
import { readFileSync, existsSync, mkdirSync, openSync,
  writeSync, fsyncSync, closeSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { BACKGROUND_CONTEXT } from '@earendil-works/chord/context';
import { createModels } from '@earendil-works/pi-ai/models';
import { Harness, createRegistry, defineExtension, defineTask }
  from '@earendil-works/pi-durable';
import { openNodeJsonlStorage }
  from '@earendil-works/pi-durable/storage/jsonl/node';

const [mode, directory, inputPath] = process.argv.slice(2);
if (!['crash', 'resume', 'inspect'].includes(mode) || !directory ||
    (mode === 'crash' && !inputPath)) {
  throw new Error('Usage: node durable-task.mjs crash|resume|inspect ABS_STATE_DIR [ABS_INPUT]');
}
globalThis.fetch = async () => { throw new Error('No-provider Durable demo forbids network fetch'); };
const ctx = BACKGROUND_CONTEXT;
const dir = resolve(directory);
const input = mode === 'crash' ? readFileSync(resolve(inputPath), 'utf8') : undefined;
if (mode === 'crash') {
  if (existsSync(dir)) throw new Error('Choose a NEW state directory for crash mode');
  mkdirSync(dir, { recursive: true });
} else if (!existsSync(join(dir, 'task-id.json'))) {
  throw new Error('Resume requires the original directory and task-id.json');
}
const auditPath = join(dir, 'phase-attempts.jsonl');
function durableLine(file, value) {
  const fd = openSync(file, 'a');
  try { writeSync(fd, JSON.stringify(value) + '\n'); fsyncSync(fd); }
  finally { closeSync(fd); }
}
function show(label, value) {
  writeSync(1, label + ' ' + JSON.stringify(value) + '\n');
}
function enter(phase, taskId) {
  durableLine(auditPath, { phase, taskId, pid: process.pid });
}
const LocalTask = defineTask({
  name: 'demo.local-process',
  version: 1,
  initial: () => ({ phase: 'A' }),
  phases: {
    A: async (task, runtime, c) => {
      enter('A', task.id);
      const tasks = JSON.parse(task.input.text);
      const processed = tasks.filter(task => task.archived !== true && task.status !== 'done').map(task => task.id);
      await runtime.commit(() => ({
        status: 'running', checkpoint: { phase: 'B', processed },
      }), c);
    },
    B: async (task, runtime, c) => {
      enter('B', task.id);
      show('B_ENTERED_WITH_DURABLE_CHECKPOINT', task.state.checkpoint);
      if (mode === 'crash') {
        show('SIGKILL_SELF', { pid: process.pid, taskId: task.id });
        process.kill(process.pid, 'SIGKILL'); // only this demo process
        await new Promise(() => {});        // never graceful-close this crash
      }
      await runtime.commit(() => ({
        status: 'terminal',
        outcome: { status: 'completed', result: { taskIds: task.state.checkpoint.processed, draft: '待审查任务：' + task.state.checkpoint.processed.join('、') } },
      }), c);
    },
  },
  abort: async (_task, runtime, c) => {
    await runtime.commit(() => ({
      status: 'terminal', outcome: { status: 'aborted' },
    }), c);
  },
});
const registry = createRegistry();
registry.install(defineExtension({ name: 'demo.local', tasks: [LocalTask] }));
const storage = await openNodeJsonlStorage(join(dir, 'store'), ctx, { fsync: true });
let harness;
try {
  harness = await Harness.open(storage, { models: createModels(), registry }, ctx);
  let id;
  if (mode === 'crash') {
    const root = await harness.root(ctx);
    id = await root.commit(tx => tx.createTask(LocalTask, { text: input }, {
      ownership: { kind: 'conversation' },
    }), ctx);
    // Harness is still paused: save the ID before enabling execution.
    durableLine(join(dir, 'task-id.json'), { id });
  } else {
    ({ id } = JSON.parse(readFileSync(join(dir, 'task-id.json'), 'utf8')));
  }
  show('BEFORE_SCHEDULING', await harness.getTask(id, ctx));
  if (mode !== 'inspect') show('SETTLED', await harness.waitForTask(id, ctx));
  const rows = existsSync(auditPath)
    ? readFileSync(auditPath, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse)
    : [];
  show('PHASE_ENTRIES', {
    A: rows.filter(x => x.phase === 'A').length,
    B: rows.filter(x => x.phase === 'B').length,
    taskIds: [...new Set(rows.map(x => x.taskId))],
  });
  show('USAGE', await harness.usage(ctx));
} finally {
  if (harness) await harness.close(ctx);
  else await storage.close(ctx);
}
