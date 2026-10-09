import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [pkg, role, demoDirectory, simulateFailure] = process.argv.slice(2);
if (!['rules', 'tests'].includes(role)) throw new Error('Unknown teaching role');
if (role === 'tests' && simulateFailure === 'fail-tests') {
  console.error('DELIBERATE FIXTURE FAILURE: tests reviewer unavailable');
  process.exit(2);
}
// Parent launches this process with an allowlisted, credential-free environment.
globalThis.fetch = async () => { throw new Error('Offline fixture forbids network fetch'); };
const { createAgentSession, ModelRuntime, SettingsManager, SessionManager, createExtensionRuntime } = await import(pathToFileURL(join(pkg, 'dist/index.js')).href);
const { InMemoryCredentialStore, fauxProvider, fauxAssistantMessage, fauxToolCall, Type } = await import(pathToFileURL(join(pkg, 'node_modules/@earendil-works/pi-ai/dist/index.js')).href);
const marker = role === 'rules' ? 'RULES_ONLY_CONTEXT' : 'TESTS_ONLY_CONTEXT';
const otherMarker = role === 'rules' ? 'TESTS_ONLY_CONTEXT' : 'RULES_ONLY_CONTEXT';
const assignedFiles = role === 'rules' ? ['README.md', 'src/summary.ts'] : ['test/summary.test.mjs', 'fixtures/tasks.json'];
const toolName = `read_${role}_evidence`;
const runtime = await ModelRuntime.create({ credentials: new InMemoryCredentialStore(), modelsPath: null, refreshOnCreate: false });
const faux = fauxProvider({ provider: `fixture-${role}`, models: [{ id: 'fixture' }], tokensPerSecond: Infinity });
runtime.registerNativeProvider(faux.provider);
const extensionState = { extensions: [], errors: [], runtime: createExtensionRuntime() };
const resourceLoader = {
  getExtensions: () => extensionState,
  getSkills: () => ({ skills: [], diagnostics: [] }),
  getPrompts: () => ({ prompts: [], diagnostics: [] }),
  getThemes: () => ({ themes: [], diagnostics: [] }),
  getAgentsFiles: () => ({ agentsFiles: [] }),
  getSystemPrompt: () => `You are the ${role} reviewer. ${marker}. Return findings, evidence and limits. This is a fixture test.`,
  getSystemPromptSource: () => undefined,
  getAppendSystemPrompt: () => [], getAppendSystemPromptSources: () => [],
  extendResources: () => {}, reload: async () => {},
};
const fixtureAnswer = {
  role, mode: 'PREWRITTEN_FIXTURE_ANSWER_NOT_LLM_REASONING',
  findings: [role === 'rules' ? '教学预置结论：应检查缺省 archived 是否被计入。' : '教学预置结论：混合样例断言覆盖本次缺省字段故障。'],
  evidence: assignedFiles,
  limits: ['This answer was queued by the test harness, not inferred by a real model.'],
};
faux.setResponses([
  fauxAssistantMessage(fauxToolCall(toolName, {}), { stopReason: 'toolUse' }),
  fauxAssistantMessage(JSON.stringify(fixtureAnswer)),
]);
let toolCalls = 0;
const { session } = await createAgentSession({
  cwd: demoDirectory, modelRuntime: runtime, model: faux.getModel(), thinkingLevel: 'off',
  sessionManager: SessionManager.inMemory(demoDirectory),
  settingsManager: SettingsManager.inMemory({ compaction: { enabled: false }, retry: { enabled: false }, cacheWarming: 'off' }),
  resourceLoader, tools: [toolName],
  customTools: [{
    name: toolName, label: toolName, description: `Read exactly the assigned teaching files for ${role}`, parameters: Type.Object({}),
    async execute() {
      toolCalls++;
      const values = await Promise.all(assignedFiles.map(async path => ({ path, text: await readFile(join(demoDirectory, path), 'utf8') })));
      return { content: [{ type: 'text', text: JSON.stringify(values) }], details: { files: assignedFiles } };
    },
  }],
});
try {
  await session.prompt(`${marker}: inspect only the assigned evidence and return your result.`);
  const messages = JSON.stringify(session.messages);
  assert.doesNotMatch(messages, new RegExp(otherMarker));
  assert.deepEqual(session.agent.state.tools.map(tool => tool.name), [toolName]);
  assert.equal(toolCalls, 1);
  assert.equal(faux.state.callCount, 2);
  console.log(JSON.stringify({ role, pid: process.pid, sessionId: session.sessionId, marker, otherMarkerAbsent: true,
    exposedTools: session.agent.state.tools.map(tool => tool.name), assignedFiles, toolCalls,
    fixtureModelCalls: faux.state.callCount, realModelCalls: 0, result: fixtureAnswer }));
} finally { session.dispose(); }
