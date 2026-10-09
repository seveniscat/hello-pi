import assert from 'node:assert/strict';
import { importPi, saveReport } from './common.mjs';

// Pure in-memory core-loop fixture: no SDK resource discovery, credentials, files or provider requests.
const { Agent } = await importPi('node_modules/@earendil-works/pi-agent-core/dist/index.js');
const { createFauxCore, fauxAssistantMessage, fauxToolCall } = await importPi('node_modules/@earendil-works/pi-ai/dist/providers/faux.js');
const { Type } = await importPi('node_modules/@earendil-works/pi-ai/dist/index.js');
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => { throw new Error('Offline steering demo forbids network fetch'); };
const STEER = 'STEER: 后续改为只读检查。这是排队输入，不是撤销已执行动作。';
const FOLLOW = 'FOLLOW_UP: 当前任务结束后，再整理一份摘要。';
const userMessage = text => ({ role: 'user', content: [{ type: 'text', text }], timestamp: Date.now() });
const textOf = message => typeof message.content === 'string'
  ? message.content : message.content?.filter(x => x.type === 'text').map(x => x.text).join('') ?? '';

async function runCase(toolExecution) {
  const trace = [], requests = [];
  let agent;
  const faux = createFauxCore({ provider: `fixture-queue-${toolExecution}`, models: [{ id: 'fixture' }], tokensPerSecond: Infinity });
  function response(content, options) {
    return context => {
      const userInputs = context.messages.filter(x => x.role === 'user').map(textOf);
      requests.push({ request: requests.length + 1, userInputs });
      trace.push(`request:${requests.length}`);
      return fauxAssistantMessage(content, options);
    };
  }
  faux.setResponses([
    response([fauxToolCall('tool_a', {}, { id: 'a' }), fauxToolCall('tool_b', {}, { id: 'b' })], { stopReason: 'toolUse' }),
    response(fauxToolCall('tool_c', {}, { id: 'c' }), { stopReason: 'toolUse' }),
    response('FIXTURE_CURRENT_TASK_DONE'),
    response('FIXTURE_FOLLOW_UP_DONE'),
  ]);
  const tools = ['a', 'b', 'c'].map(letter => ({
    name: `tool_${letter}`, label: `tool_${letter}`, description: 'In-memory observation only; no external effect.',
    parameters: Type.Object({}),
    async execute() {
      trace.push(`tool:${letter}:start`);
      if (letter === 'a') {
        // Queue follow-up first to demonstrate semantic priority, not arrival order.
        agent.followUp(userMessage(FOLLOW)); trace.push('queued:followUp');
        agent.steer(userMessage(STEER)); trace.push('queued:steer');
        await Promise.resolve();
      }
      trace.push(`tool:${letter}:end`);
      return { content: [{ type: 'text', text: `${letter} completed` }], details: { fixture: true } };
    },
  }));
  agent = new Agent({
    initialState: { model: faux.getModel(), systemPrompt: 'Queue timing fixture, not a model-following-instructions test.', tools },
    streamFn: faux.streamSimple, toolExecution,
  });
  let turns = 0;
  const unsubscribe = agent.subscribe(event => {
    if (event.type === 'turn_end') trace.push(`turn:${++turns}:end`);
    if (event.type === 'message_start' && event.message.role === 'user') {
      const text = textOf(event.message);
      if (text === STEER) trace.push('delivered:steer');
      if (text === FOLLOW) trace.push('delivered:followUp');
    }
    if (event.type === 'agent_end') trace.push('agent:end');
  });
  try {
    await agent.prompt('START: 执行两个无副作用的教学工具，再完成当前任务。');
    assert.equal(agent.state.errorMessage, undefined);
    assert.equal(faux.state.callCount, 4);
    assert.equal(faux.getPendingResponseCount(), 0);
    assert.equal(turns, 4);
    assert.equal(agent.hasQueuedMessages(), false);
    function before(first, second) {
      assert.ok(trace.includes(first) && trace.includes(second), `Missing events: ${first}, ${second}`);
      assert.ok(trace.indexOf(first) < trace.indexOf(second), `${toolExecution}: ${first} must precede ${second}`);
    }
    before('queued:followUp', 'queued:steer');
    before('queued:steer', 'tool:a:end');
    before('tool:a:end', 'turn:1:end');
    before('tool:b:end', 'turn:1:end');
    before('turn:1:end', 'delivered:steer');
    before('delivered:steer', 'request:2');
    before('tool:c:end', 'turn:3:end');
    before('turn:3:end', 'delivered:followUp');
    before('delivered:followUp', 'request:4');
    before('request:4', 'agent:end');
    assert.equal(requests[0].userInputs.length, 1);
    for (const request of requests.slice(1, 3)) {
      assert.ok(request.userInputs.includes(STEER));
      assert.ok(!request.userInputs.includes(FOLLOW));
    }
    assert.ok(requests[3].userInputs.includes(FOLLOW));
    for (const letter of ['a', 'b', 'c']) assert.equal(trace.filter(x => x === `tool:${letter}:end`).length, 1);
    return { toolExecution, trace, requests, checks: {
      currentToolAndBatchCompleteBeforeSteering: true,
      steeringReachesNextRequest: true,
      followUpWaitsForCurrentWorkToFinish: true,
      queuesEmptyAtEnd: true,
    }, fixtureModelCalls: faux.state.callCount, realModelCalls: 0 };
  } finally { unsubscribe(); }
}

try {
  const cases = [];
  for (const mode of ['sequential', 'parallel']) cases.push(await runCase(mode));
  await saveReport('steering', {
    mode: 'REAL_PI_1.1.0_CORE_LOOP_WITH_PREWRITTEN_PROVIDER_RESPONSES', cases,
    limits: [
      'Official core loop and queues are real; model responses and user inputs are explicitly scripted fixtures.',
      'Both sequential and parallel batches complete before steering is delivered; steering is not abort.',
      'No TUI, hot reload, real provider call or instruction-following quality was tested.',
      'All tools are in-memory observations; no files are changed and no external action is cancelled or rolled back.',
    ],
  });
} finally { globalThis.fetch = originalFetch; }
