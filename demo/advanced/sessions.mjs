import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { importPi, saveReport } from './common.mjs';

const { SessionManager } = await importPi('dist/core/session-manager.js');
const work = await mkdtemp(join(tmpdir(), 'pi-context-demo-'));
try {
  const session = SessionManager.inMemory(work);
  const user = text => ({ role: 'user', content: text, timestamp: Date.now() });
  const start = session.appendMessage(user('共同目标：修复任务统计，保留原验收规则。'));
  const main = session.appendMessage(user('主线：只修改筛选条件，随后运行五项测试。'));
  session.branch(start);
  session.appendMessage(user('支线：讨论将来是否接受 archived:null；本次不扩范围。'));
  const branchContext = session.buildSessionContext().messages;
  session.branch(main);
  const mainContext = session.buildSessionContext().messages;
  assert.match(JSON.stringify(branchContext), /archived:null/);
  assert.doesNotMatch(JSON.stringify(mainContext), /archived:null/);
  assert.match(JSON.stringify(mainContext), /五项测试/);

  const target = join(work, 'business-state.txt');
  await writeFile(target, 'already changed on disk');
  session.branch(start);
  assert.equal(await readFile(target, 'utf8'), 'already changed on disk');
  session.branchWithSummary(main, '讲者手写摘要：null 属于后续需求，本次只验收 boolean 或缺省。');
  const withSummary = session.buildSessionContext().messages;
  assert.match(JSON.stringify(withSummary), /讲者手写摘要/);
  const flatten = (nodes, depth = 0) => nodes.flatMap(node => [
    { depth, type: node.entry.type, id: node.entry.id, parentId: node.entry.parentId,
      content: node.entry.type === 'message' ? node.entry.message.content : node.entry.summary ?? '' },
    ...flatten(node.children, depth + 1),
  ]);
  await saveReport('sessions', {
    realComponents: ['Pi 1.1.0 SessionManager', 'branch', 'branchWithSummary', 'buildSessionContext'],
    mode: 'REAL_SESSION_API_WITH_HAND_AUTHORED_MESSAGES_NO_MODEL',
    checks: { mainExcludesSibling: true, branchContainsItsQuestion: true, navigationDoesNotRevertFile: true, explicitSummaryIsIncluded: true },
    mainContext, branchContext, withSummary, tree: flatten(session.getTree()),
    limits: ['Messages and summary are authored teaching inputs, not generated model responses.', 'No TUI navigation, model request, automatic summary or compaction was tested.'],
  });
} finally { await rm(work, { recursive: true, force: true }); }
