import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

function lookup(spec: string | undefined, ctx: any) {
  if (!spec?.includes('/')) throw new Error('Set PI_TALK_PLANNER and PI_TALK_BUILDER to provider/model before live use.');
  const slash = spec.indexOf('/');
  const model = ctx.modelRegistry.find(spec.slice(0, slash), spec.slice(slash + 1));
  if (!model) throw new Error(`Model not found in the configured catalog: ${spec}`);
  return model;
}

export default function (pi: ExtensionAPI) {
  pi.registerVirtualModel({
    provider: 'workshop', id: 'auto', name: 'Workshop Router',
    thinkingLevels: ['low', 'high'],
    route(request, ctx) {
      // Keep tool continuations/retries on the same physical model.
      const sticky = request.failed ?? request.previous;
      if (request.reason !== 'user' && sticky) {
        return { model: sticky.model, thinkingLevel: sticky.thinkingLevel ?? 'low' };
      }
      const strong = request.thinkingLevel === 'high';
      return {
        model: lookup(strong ? process.env.PI_TALK_PLANNER : process.env.PI_TALK_BUILDER, ctx),
        thinkingLevel: strong ? 'high' : 'low',
      };
    },
  });
}
