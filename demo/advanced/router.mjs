import assert from 'node:assert/strict';
import factory from './extensions/workshop-router.ts';
import { saveReport } from './common.mjs';

// No provider connections: these are explicitly fabricated model descriptors.
const strong = { provider: 'fixture', id: 'planner' };
const fast = { provider: 'fixture', id: 'builder' };
const saved = { planner: process.env.PI_TALK_PLANNER, builder: process.env.PI_TALK_BUILDER };
process.env.PI_TALK_PLANNER = 'fixture/planner';
process.env.PI_TALK_BUILDER = 'fixture/builder';
try {
  let definition;
  factory({ registerVirtualModel: value => { definition = value; } });
  const ctx = { modelRegistry: { find: (provider, id) => [strong, fast].find(x => x.provider === provider && x.id === id) } };
  const steps = [
    { reason: 'user', thinkingLevel: 'high' },
    { reason: 'continuation', thinkingLevel: 'low', previous: { model: strong, thinkingLevel: 'high' } },
    { reason: 'user', thinkingLevel: 'low' },
    { reason: 'retry', thinkingLevel: 'high', failed: { model: fast, thinkingLevel: 'low' } },
  ];
  const results = steps.map(request => ({ reason: request.reason, selectedLevel: request.thinkingLevel, route: definition.route(request, ctx) }));
  assert.deepEqual(results.map(x=>x.route.model.id), ['planner', 'planner', 'builder', 'builder']);
  await saveReport('router', {
    mode: 'ROUTER_CALLBACK_TEST_WITH_FIXTURE_CATALOG_NO_MODEL_DISPATCH',
    selectedModel: 'workshop/auto', steps: results,
    limits: ['Only the routing callback and continuation/retry policy were tested.', 'The model registry and model descriptors are fixtures; no real provider, cost, quality, TUI selection or model switch was tested.'],
  });
} finally {
  for (const [key, value] of [['PI_TALK_PLANNER', saved.planner], ['PI_TALK_BUILDER', saved.builder]]) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
}
