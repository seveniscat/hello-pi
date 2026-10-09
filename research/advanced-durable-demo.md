# Durable 无 LLM 费用恢复演示：立即交付备忘

核查日期：**2026-10-09，Asia/Shanghai**。基线：官方 `earendil-works/pi` 的 `v1.1.0`，固定提交 **`abe508e1b89912adde45528136c3221eb69acdd7`**。已先读本仓库 `research/source-register.md` 的 O15–O18。

**验证等级：官方固定源码、官方测试阅读及 npm 元数据核验；下面的新演示是待父代理实现并运行的草案，不是本机验证通过的程序。** 本轮没有安装包、运行示例/测试、读取凭据或修改讲稿/实现。只通过网页读取及 HTTP GET 获取公开源码/元数据。用户告知本机 Node 22.19.0、Pi 1.1.0、没有 Bun；本轮未另行执行版本命令。按父代理要求停止继续检索，立即交付。

## 1. 先做决定：Node 可用，发行版存在，不必等 Bun

- **`@earendil-works/pi-durable@1.1.0` 确实已发布。** npm 元数据的 `dist-tags.latest` 为 `1.1.0`，该包发布时间为 **2026-10-07T22:10:38.752Z**（上海 10 月 8 日 06:10:38.752）。这是 Durable 包时间，不要和 coding-agent 的发布时间混用。[N1][N2]
- npm 当时列出的发行版本：`0.0.1, 0.86.0, 0.86.1, 0.87.0, 0.87.1, 0.99.0, 0.99.1, 0.99.2, 1.0.0, 1.0.1, 1.0.2, 1.0.3, 1.0.4, 1.1.0`。本演示只针对 **1.1.0**，不保证旧版 API 相同。[N1]
- 包的 `engines.node` 是 **`>=22.19.0`**；ESM 发布入口是 `dist/index.js`。本机版本满足声明，无需 Bun、tsx 或从仓库编译 TypeScript；用 `.mjs` 和正常 npm 发布包入口。[S1]
- **推荐 JSONL：** `openNodeJsonlStorage(directory, context, { fsync: true })`，来自 `@earendil-works/pi-durable/storage/jsonl/node`；该适配器使用 `NodeExecutionEnv`，后者是 Node 文件系统实现。[S2]
- **SQLite 也支持 Node：** `openNodeSqliteStorage(file, options?)`，来自 `@earendil-works/pi-durable/storage/sqlite/node`，直接使用 Node 内置 `node:sqlite` 的 `DatabaseSync`；不是 `bun:sqlite`，不要求另装/编译 `better-sqlite3`。Node 22.19.0 官方文档包含此 API。它采用 WAL + `synchronous=NORMAL`，不能承诺最新提交经主机断电仍不丢失。[S3][N3]
- **不要把依赖树说成全纯 JS／无安装脚本。** Durable 依赖 Chord、pi-ai、diff、typebox；Chord 的正式依赖包含 `esbuild@0.28.2`。esbuild 元数据含 `postinstall: node install.js` 及 darwin-arm64/darwin-x64 等平台包。这与“必须 Bun／必须编译 SQLite addon”是两回事；本轮未验证实际安装成功。[S1][S4][N4]
- Durable 仍是 experimental，API 可随发行变化；固定版本，不依赖浮动 main 或旧文章示例。[S0]

npm 发布物身份（仅核验元数据，未下载/解包或执行发布物）：[N2]

```text
version: 1.1.0
shasum: 17592b5975cffc39a82bc91dda51de5d06e28548
integrity: sha512-NtuB3RY24vQ+0/rWYpeHupyFWBfXuKq17to3VMYUYqfD/uuGnz6F6UTPBEm51VSxxA6LZwRcDwLX2LtRehnIgQ==
```

## 2. 精确最小 API：不要虚构 createSession 的调度能力

| 用途 | 已核实入口/调用 | 证据 |
|---|---|---|
| 纯 Session 内核 | 根包导出 `createSession(storage, options?: { now?: () => number })`；同步返回 Session | [S5] |
| 启用持久任务运行器 | `await Harness.open(storage, { models, registry }, context)` | [S6] |
| 空模型注册表 | `createModels()`，可从 `@earendil-works/pi-ai/models` 导入；默认内存 credential/model store，不需注册 provider | [S7] |
| 注册任务 | `registry = createRegistry(); registry.install(defineExtension({ name, tasks: [Task] }))` | [S8] |
| 定义状态机 | `defineTask({ name, version, initial, phases, abort })`；**abort 是必填定义** | [S9] |
| 会话及任务创建 | `root = await harness.root(context)`；`root.commit(tx => tx.createTask(Task, input, { ownership: { kind: 'conversation' } }), context)` | [S8] |
| 保存下一阶段 | `runtime.commit(() => ({ status: 'running', checkpoint: { phase: 'B', ... } }), taskContext)` | [S9] |
| 完成 | `runtime.commit(() => ({ status: 'terminal', outcome: { status: 'completed', result } }), taskContext)` | [S9] |
| 读恢复状态 | `await harness.getTask(taskId, context)`；不会自行启动调度 | [S6] |
| 启动并等结果 | `harness.resume()`；或者直接 `await harness.waitForTask(taskId, context)`，后者内部也 resume | [S6] |
| 关闭 | `await harness.close(context)`；其内部关闭 storage，不需要再另关一次 | [S5][S6] |

**重要：** `createSession` 没有接收 registry/models 的这个签名，也不是自动跑 task 的入口。`Harness.open()` 会将遗留 `running` 调整为带原 checkpoint 的 `pending`，但**尚不调度执行**；可以先读取 checkpoint，再调用 `waitForTask`。恢复逻辑由真实框架完成，不要自己从磁盘读 phase 后用 if/else 冒充 Durable。[S5][S6][S10]

官方 `24-child-tasks.ts` 本身就使用 `Harness.open(..., { models: createModels(), registry }, context)`，无模型 provider，并展示任务 close/reopen；它证明该 API 路线有官方例子，但其例子是**有序 close/reopen**，不是本轮真实 SIGKILL 的运行记录。[S8]

## 3. 最小可复现草案：A 存 checkpoint，B 内精确 SIGKILL，另一进程恢复

下面是**本备忘新写的宿主脚本草案**，不是框架实现，也没有运行。父代理可将代码保存为 `/tmp/pi-durable-lab-20261009/durable-task.mjs`。这不是对该临时文件的实际写入。

设计：A 将本地文件内容 trim/大写后保存为任务的 B checkpoint；B 已进入但还没提交结果时，故意 SIGKILL 当前演示进程。`phase-attempts.jsonl` 是独立观测日志，计数的是**阶段处理器进入次数**，不是框架承诺的 exactly-once 次数。所有业务文件读写都在框架事务回调之外；事务回调只返回 checkpoint/outcome。[S9][S10][S11]

```js
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
      const processed = task.input.text.trim().toUpperCase();
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
        outcome: { status: 'completed', result: task.state.checkpoint.processed },
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
```

**为何无 LLM 费用：** 没有注册模型 provider，没有 `root.submit({ type: 'input', ... })`，没有创建 GenerationTask；运行的只是已注册自定义状态机。零真实模型调用源于这条调用路径，不是用“账单计数为零”推断外部账单。空 `pi.usage` 是辅助观察。[S7][S8][S12]

### 父代理后续准备/运行命令（本轮均未执行）

在独立临时目录安装，不改现有项目；以下准备步骤需要父代理另行决定是否执行。已有全局 `pi` 不等于独立脚本能解析这些 npm 包。

```sh
LAB=/tmp/pi-durable-lab-20261009
mkdir -p "$LAB"
cd "$LAB"
# 在该隔离目录准备 private package.json，并保存上面的 durable-task.mjs 后：
npm install --save-exact @earendil-works/pi-durable@1.1.0 \
  @earendil-works/pi-ai@1.1.0 @earendil-works/chord@1.1.0 \
  @earendil-works/pi-telemetry@1.1.0
# 保留生成的 package-lock.json；这些包不要使用 --conditions=source。
printf '  durable local input\n' > "$LAB/input.txt"
node "$LAB/durable-task.mjs" crash "$LAB/task-run-01" "$LAB/input.txt"
# 上一命令被 SIGKILL、非零退出是预期；不要与下一条用 && 相连。
node "$LAB/durable-task.mjs" resume "$LAB/task-run-01"
node "$LAB/durable-task.mjs" inspect "$LAB/task-run-01"
```

若换 SQLite，只替换 import 和打开 storage 的一行：`await openNodeSqliteStorage(join(dir, 'session.sqlite'))`，**没有 context 位置参数**；其余 Harness API 不变。[S3]

### 三个预期观察（尚未实测）

1. crash 进程输出 B checkpoint，包含 `processed: 'DURABLE LOCAL INPUT'`，随后被 SIGKILL；这不是调用 `abortTask()`。断点是脚本预先选择的确定位置，不是随机崩溃压力测试。
2. resume 进程在调度前读到**同一 task ID**，状态预期 `pending`、checkpoint 仍为 B；之后终态为 `completed`，结果等于持久化的 processed。日志预期 **A=1，B=2**，说明 A 的已提交阶段不重做、未完成的 B 被重新进入；不是恢复 JS 调用栈。[S9][S10]
3. inspect 再开同一目录，不执行新任务；计数仍为 A=1、B=2，终态仍在。主例 `usage` 预期 `models` 和 `tools` 都为空。[S6][S12]

观察日志/ID 文件是宿主脚手架，不受 Durable 事务保护。只因本例故障被安排在 B，才确保此前的 task-id 文件已落盘；它不是“任务提交与宿主 ID 索引之间任意崩溃都安全”的证明。每次重新演示用新目录，不要删除后又声称从原存储恢复。

## 4. unsafe 通知副作用：已有可核实路线，暂不扩成第二个完整程序

**不必接真实模型。** 官方工具恢复测试使用公开 `fauxProvider`；它是脚本化模型响应 fixture，框架的 ToolTask、意图 checkpoint、存储及恢复仍是真实实现。若父代理赶时间，先只交付上面完全无 provider 的主例；不要把这段配方标为已跑通。[S13][S14]

已经核实的 fixture 入口（均公开导出）：[S14][S15]

```js
import { createModels, fauxProvider, fauxAssistantMessage, fauxToolCall, Type }
  from '@earendil-works/pi-ai';
import { defineTool, defineExtension, createRegistry, Harness, ToolResultEntry }
  from '@earendil-works/pi-durable';

const faux = fauxProvider();
const models = createModels();
models.setProvider(faux.provider);
// 首进程：预置一个工具请求；重启进程：只预置最终文本，不再预置同一工具请求。
faux.setResponses([fauxAssistantMessage([
  fauxToolCall('notify_local', {}, { id: 'notify-1' }),
], { stopReason: 'toolUse' })]);
// 重启时改用：faux.setResponses([fauxAssistantMessage('fixture finished')]);
// root = await harness.root(ctx, {
//   agent: { model: { provider: 'faux', modelId: 'faux-1' } },
// });
```

父代理构造方案：

1. `defineTool({ name: 'notify_local', description: 'local notification sink', parameters: Type.Object({}), replay: 'unsafe', execute })`，通过 `registry.install(defineExtension({ name: 'notice-demo', tools: [tool] }))` 注册。[S13][S16]
2. execute 内先向**独立于 Durable store** 的本地 `sent.jsonl` append+fsync 一条记录（带 `api.taskId`），把它明确称为本地通知接收器；然后 SIGKILL 当前进程，**不 return，不提交成功 tool result**。不要读取凭据或发送真实通知。这里“已发”只是本地真实副作用完成，不是证明邮件已送达。
3. 两次均打开相同磁盘目录、安装相同工具。以相同 root 会话调用 `root.submit({ type: 'input', content: 'fixture: notify', requestId: 'unsafe-demo-1' }, ctx)`；重启不能换 requestId 来重新提交一个任务。相同 conversation+requestId 返回原 submission ID，这是提交去重，不是通知副作用去重。[S17]
4. 在 resume/submit 启动调度前，先通过 receipt 中 taskId 读取工具 task，预期 checkpoint 为 `phase: 'execute', replay: 'unsafe'`。重启后的 faux 只提供最终文本；`await submission.wait(ctx)` 后读取 `root.entries({}, 1000, undefined, ctx)`，以 `ToolResultEntry.is(entry)` 识别结果。
5. 预期 `sent.jsonl` 仍只有一条；工具结果 `model[0].isError === true`，结构化 `entry.data.diagnostics` 含 `code: 'interrupted'`，工具 task 终态失败而不是通知成功。官方固定测试断言了 unsafe execute 仅执行一次及错误结果；本方案再把副作用换成磁盘接收器并做真正进程终止，**新增部分尚未运行**。[S13][S16]

源码顺序很重要：内置 ToolTask 的 call 阶段先持久化 execute 意图，再调用工具；恢复 execute 阶段只有**已存 replay 和当前工具 replay 都为 safe**才重跑。否则提交 interrupted 错误。默认 replay 是 unsafe；不能只给普通自定义 Task 填 `replay: 'unsafe'` 就声称获得 ToolTask 策略。[S16]

Faux 是本地脚本响应，不是真实 LLM；它可产生合成 token/usage 统计，不能把 faux 的 usage 当成真实供应商计费或模型行为验证。[S14]

## 5. 资源关闭与不能声称什么

- 正常结束用 `await harness.close(ctx)`：Session 封闭写入，Harness 等待 invocation 结束，再关闭 storage。close 是停止宿主，不等于 `abortTask()` 的业务取消；后者会改变任务生命周期。自定义长等待必须响应 runtime/context 的取消，否则有序 close 可能等不完。本例正常路径没有长等待；crash 分支故意 SIGKILL，不执行 finally。[S5][S6][S9]
- 如父代理另加 `harness.taskGraph(ctx)`，所得 state 用 `dispose()`；watch 句柄用 `stop()`。上述主例没有创建这些资源。[S8][S9]
- 一份存储一次只让一个进程拥有；README 明说没有跨进程锁。先确认原进程已退出再 reopen，不要并发跑 crash/resume。JSONL 用持久目录，不能换 MemoryStorage。SQLite `NORMAL` 与 JSONL `fsync:true` 也不构成本轮主机断电/文件系统故障实测。[S0][S3]
- **不能声称：** 任意外部副作用 exactly-once；所有 phase 只执行一次；恢复任意程序指令/调用栈；SDK 已自动解决支付/邮件幂等；设置 unsafe 就保证外部动作没发生；真实模型已调用或真实通知已发送；已经本机验证通过。[S9][S10][S11][S16]
- 对 unsafe 的准确讲法是：**结果不确定时，不自动重放这个已记录意图的工具调用，而给出 interrupted 结果。** 用户/后续模型仍可能发起一个新的通知调用；外部系统幂等键、查询对账与人工处理仍需另做。[S16][S17]

## 6. 固定来源与元数据入口

下列源码均锁到同一提交，不使用 main。npm 元数据的 live 查询结果只代表本次日期；版本端点及 integrity 用于标识发布物。网页工具无法打开 npm registry 时，另用不带凭据的 HTTP GET 读取 JSON；没有通过 npm 执行安装。

- [S0] [Durable README：实验性、存储与使用](https://github.com/earendil-works/pi/blob/abe508e1b89912adde45528136c3221eb69acdd7/packages/durable/README.md)
- [S1] [Durable package.json：版本、exports、engines、dependencies](https://github.com/earendil-works/pi/blob/abe508e1b89912adde45528136c3221eb69acdd7/packages/durable/package.json)
- [S2] [Node JSONL 入口](https://github.com/earendil-works/pi/blob/abe508e1b89912adde45528136c3221eb69acdd7/packages/durable/src/storage/jsonl/node.ts)、[fsync 选项/存储实现](https://github.com/earendil-works/pi/blob/abe508e1b89912adde45528136c3221eb69acdd7/packages/durable/src/storage/jsonl/storage.ts)、[NodeExecutionEnv](https://github.com/earendil-works/pi/blob/abe508e1b89912adde45528136c3221eb69acdd7/packages/durable/src/env/node.ts)
- [S3] [Node SQLite：DatabaseSync、open、close/WAL](https://github.com/earendil-works/pi/blob/abe508e1b89912adde45528136c3221eb69acdd7/packages/durable/src/storage/sqlite/node.ts)
- [S4] [Chord package.json：esbuild 依赖](https://github.com/earendil-works/pi/blob/abe508e1b89912adde45528136c3221eb69acdd7/packages/chord/package.json)
- [S5] [createSession 的精确签名及 Session.close](https://github.com/earendil-works/pi/blob/abe508e1b89912adde45528136c3221eb69acdd7/packages/durable/src/session/session.ts)
- [S6] [Harness.open/root/getTask/waitForTask/resume/close](https://github.com/earendil-works/pi/blob/abe508e1b89912adde45528136c3221eb69acdd7/packages/durable/src/harness/harness.ts)
- [S7] [createModels、默认内存存储](https://github.com/earendil-works/pi/blob/abe508e1b89912adde45528136c3221eb69acdd7/packages/ai/src/models.ts)、[pi-ai exports](https://github.com/earendil-works/pi/blob/abe508e1b89912adde45528136c3221eb69acdd7/packages/ai/package.json)
- [S8] [官方无真实模型的 child tasks 示例](https://github.com/earendil-works/pi/blob/abe508e1b89912adde45528136c3221eb69acdd7/packages/durable/test/examples/24-child-tasks.ts)
- [S9] [TaskDefinition/TaskRuntime/TaskState/Tx/Session 类型](https://github.com/earendil-works/pi/blob/abe508e1b89912adde45528136c3221eb69acdd7/packages/durable/src/types.ts)
- [S10] [scheduler：open 的 running→pending 与显式 resume](https://github.com/earendil-works/pi/blob/abe508e1b89912adde45528136c3221eb69acdd7/packages/durable/src/harness/scheduler.ts#L238-L275)
- [S11] [spec §1：外部副作用不在 Session 事务中](https://github.com/earendil-works/pi/blob/abe508e1b89912adde45528136c3221eb69acdd7/packages/durable/docs/spec.md#L46-L78)
- [S12] [usage 初始化](https://github.com/earendil-works/pi/blob/abe508e1b89912adde45528136c3221eb69acdd7/packages/durable/src/harness/usage.ts)
- [S13] [工具恢复官方测试：unsafe/safe、执行次数](https://github.com/earendil-works/pi/blob/abe508e1b89912adde45528136c3221eb69acdd7/packages/durable/test/harness-tools-recovery.test.ts#L108-L163)
- [S14] [fauxProvider 与 faux message：本地脚本响应及合成 usage](https://github.com/earendil-works/pi/blob/abe508e1b89912adde45528136c3221eb69acdd7/packages/ai/src/providers/faux.ts)
- [S15] [官方 chat fixture 的模型配置](https://github.com/earendil-works/pi/blob/abe508e1b89912adde45528136c3221eb69acdd7/packages/durable/test/chat-support.ts)、[pi-ai 根导出](https://github.com/earendil-works/pi/blob/abe508e1b89912adde45528136c3221eb69acdd7/packages/ai/src/index.ts)
- [S16] [内置 ToolTask：默认 unsafe、先提交意图、恢复与错误结算](https://github.com/earendil-works/pi/blob/abe508e1b89912adde45528136c3221eb69acdd7/packages/durable/src/harness/tool.ts)
- [S17] [requestId 提交去重源码](https://github.com/earendil-works/pi/blob/abe508e1b89912adde45528136c3221eb69acdd7/packages/durable/src/harness/submissions.ts#L141-L163)、[对应测试](https://github.com/earendil-works/pi/blob/abe508e1b89912adde45528136c3221eb69acdd7/packages/durable/test/harness-submissions.test.ts#L82-L107)
- [N1] [npm 全版本/time/dist-tags 元数据](https://registry.npmjs.org/@earendil-works%2fpi-durable)
- [N2] [npm Durable 1.1.0 精确版本元数据](https://registry.npmjs.org/@earendil-works%2fpi-durable/1.1.0)
- [N3] [Node 22.19.0 SQLite 文档](https://nodejs.org/download/release/v22.19.0/docs/api/sqlite.html)
- [N4] [npm esbuild 0.28.2 元数据](https://registry.npmjs.org/esbuild/0.28.2)
