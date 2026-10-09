# Codemode / Subagent：固定版本事实备忘

核查：2026-10-09；Pi / pi-codemode **1.1.0**，Node **22.19.0**。已先读来源登记；官方 `v1.1.0` 对应 `abe508e1b89912adde45528136c3221eb69acdd7`。安装包的 Codemode、SDK 文档及 Subagent 两个源码文件与该提交逐字节一致。只写本文件；不读取个人 auth、settings、私有会话，不安装、不执行外部示例。下方为自行编写并实跑的 API 组合。

## 一、无模型 Codemode：已实跑

**真实 QuickJS，但不是 MCP；任务与测试结果是内存夹具，不是本次项目测试产物。** 公共包入口为 `@earendil-works/pi-codemode`，导出 `CodemodeSandbox`；本机绝对入口见片段。每次执行创建 worker + QuickJS/WASM。两个宿主只读工具经过 JSON 桥返回数据，脚本并发取得、关联过滤，仅 `text()` 的筛选结果进入 `output`。[1–3]

工具签名是 `execute(args, ctx): unknown | Promise<unknown>`；`ctx` 只有 `signal: AbortSignal`，参数和返回值须可 JSON 序列化。`sandbox.execute(code,{signal?,timeoutMs?,store?})` 返回 `Promise<CodemodeResult>`：成功为 `{ok:true,value,output,calls,storeWrites:{set,delete}}`；失败为 `{ok:false,error,output,calls}`。`error.kind` 为 `script/timeout/aborted/sandbox`。脚本失败用结果表达；关闭后再 execute 可拒绝。底层 `return` 进入 `value`，不会自动追加到 `output`；这里明确用 `text()`。[2–3]

```js
// ESM 片段；保存为 .mjs 后用普通 node 执行。
const P = '/Users/bloks/.nvm/versions/node/v22.19.0/lib/node_modules/@earendil-works/pi-coding-agent';
const { CodemodeSandbox } = await import(
  `${P}/node_modules/@earendil-works/pi-codemode/dist/index.js`
);
const sandbox = new CodemodeSandbox({
  timeoutMs: 5000,
  memoryLimitBytes: 16 * 1024 * 1024,
  tools: [
    { name: 'list_tasks', execute(_args, ctx) {
      ctx.signal.throwIfAborted();
      return [{id:'A',done:false},{id:'B',done:true},{id:'C',done:false}];
    } },
    { name: 'test_results', execute(_args, ctx) {
      ctx.signal.throwIfAborted();
      return [{taskId:'A',status:'failed'},
              {taskId:'B',status:'failed'},
              {taskId:'C',status:'passed'}];
    } },
  ],
});
try {
  const r = await sandbox.execute(`
    const [tasks, tests] = await Promise.all([
      tools.list_tasks({}), tools.test_results({})
    ]);
    const failed = new Set(tests.filter(x => x.status === 'failed').map(x => x.taskId));
    text(tasks.filter(x => !x.done && failed.has(x.id)));
  `);
  if (!r.ok) throw new Error(r.error.message);
  console.log(r.output.map(x => x.type === 'text' ? x.text : '').join('\n'));
  // 实测唯一输出：[{"id":"A","done":false}]
  // r.calls 中两个工具均 status:"ok"。
} finally { await sandbox.close(); }
```

无需 provider、session、模型注册表或凭据：这里只有 QuickJS 与自定义函数，未注入 `models`。`Promise.all` 遇失败会拒绝，不是部分成功聚合；需保留成功项时改 `allSettled`。这也不证明并行“提速”，更不撤销工具副作用。[1–3]

**防踩坑：** coding-agent 根导出 `createCodemodeExtension`；内部 `createCodemodeTool` 在安装包 `dist/extensions/codemode/tool.js`，不是根公开导出。后者构造参数中的 tools 用于描述，执行要靠 `ctx.tools`、`ctx.executeTool()`、`ctx.sessionManager.getBranch()`；裸调用、无 ctx 时不可调用工具，不应伪造 ExtensionContext。[4,15]

## 二、官方 Subagent example：源码事实与在线方案

入口为安装包绝对目录 `/Users/bloks/.nvm/versions/node/v22.19.0/lib/node_modules/@earendil-works/pi-coding-agent/examples/extensions/subagent/index.ts`，邻接 `agents.ts`；版本随 1.1.0，而非另一个内建代理产品。支持 single、parallel、chain；parallel 最多八项、同时四项，逐项流式更新，每项回传正文限制 50 KiB。未配 model 时继承分派 session 的模型和 thinking。[5–6]

子进程参数是 `--mode json -p --no-session`，可加 `--model`、`--thinking`、非空 `--tools`、临时文件 `--append-system-prompt`，最后 `Task: …`。优先复用当前脚本与运行时，否则可执行文件或 PATH 的 `pi`；`shell:false`，默认沿用 cwd，可单项覆盖。父消息历史不自动传入；子结果经工具回到父层，chain 只显式替换 `{previous}`。[5]

隔离的是进程及对话上下文，**不是文件系统、环境、凭据或网络**；环境继承，磁盘可共享，子进程还能加载自身配置。`--no-session` 只是不用持久会话，不是“无配置”。取消发送 SIGTERM；五秒后的 SIGKILL 检查 `!proc.killed`，而 killed 仅表示信号已发送，故不能承诺可靠强杀或清理孙进程。没有该例自带的超时、重试、恢复。非零退出或 error/aborted 为失败；chain 停止，parallel 返回各项结果，但不设置顶层 `isError`，应检查统计及 details。[5,10]

**最小在线方案（未执行）：** 准备独立 `PI_CODING_AGENT_DIR` 和干净 cwd；在其 `agents` 目录配置 `tasks.md`、`tests.md`，各用以下 frontmatter，第二个改 name/description；不设 model，两者 `tools: read`。各自只分析指定的任务 JSON／测试报告，父层合并。真实 provider 与环境认证由操作者预先配置；没有 provider 就跳过，不冒充推理。[5–6,11,13]

```yaml
---
name: tasks
description: Summarize incomplete tasks from the assigned fixture file
tools: read
---
Read only the file assigned in the task. Return IDs and evidence, not guesses.
```

```sh
# 仅方案；DEMO_HOME、DEMO_CWD、PI_DEMO_MODEL 由操作者提供。
P=/Users/bloks/.nvm/versions/node/v22.19.0/lib/node_modules/@earendil-works/pi-coding-agent
cd "$DEMO_CWD"
PI_CODING_AGENT_DIR="$DEMO_HOME" \
  /Users/bloks/.nvm/versions/node/v22.19.0/bin/node "$P/dist/bundle/cli.js" \
  --no-session --no-extensions --no-mcp \
  -e "$P/examples/extensions/subagent/index.ts" \
  --model "$PI_DEMO_MODEL" --tools subagent
```

请求父模型执行以下工具参数；任务里的文件改为明确绝对路径。父 CLI 的 `--no-mcp/--no-extensions` **不会被该例自动转发**，所以必须使用干净 cwd／配置目录；仍不是安全沙箱。[5,13]

```json
{"agentScope":"user","tasks":[
  {"agent":"tasks","task":"Read the assigned tasks JSON; return incomplete IDs and evidence."},
  {"agent":"tests","task":"Read the assigned test report; return failed IDs and evidence."}
]}
```

## 三、真实 SDK + fixture：已跑通双会话

1.1.0 使用 `modelRuntime`，不是旧式 `authStorage/modelRegistry` 参数。使用 `ModelRuntime.create`、空 `InMemoryCredentialStore`、`modelsPath:null`、内存 settings/session 和空 ResourceLoader；官方 `fauxProvider` 的认证解析返回空 auth。每个 session 独立 provider 队列、system prompt、session manager 和工具名称 allowlist；`customTools` 才存工具定义。[7–9,12]

下段可与第一段共享 `P`，也可独立补同一常量。测试在清空继承环境、`PI_OFFLINE=1`、不存在的 HOME 下运行，并将 fetch 改为抛错；未访问个人配置。原生 provider 注册会触发可用性刷新，**仅关闭初始 refresh 不等于不检查继承环境**，故推荐保持干净环境。[8]

```js
const { createAgentSession, ModelRuntime, SettingsManager, SessionManager,
        createExtensionRuntime } = await import(`${P}/dist/index.js`);
const { InMemoryCredentialStore, fauxProvider, fauxAssistantMessage,
        fauxToolCall, Type } = await import(`${P}/node_modules/@earendil-works/pi-ai/dist/index.js`);
const assert = (await import('node:assert/strict')).default;
globalThis.fetch = async () => { throw new Error('Offline fixture forbids fetch'); };
const cwd = '/Users/bloks/bzdev/playground/hello-pi';
async function make(name, toolName, token) {
  const runtime = await ModelRuntime.create({
    credentials: new InMemoryCredentialStore(), modelsPath: null, refreshOnCreate: false,
  });
  const faux = fauxProvider({ provider:`fixture-${name}`, models:[{id:'fixture'}],
                              tokensPerSecond: Infinity });
  runtime.registerNativeProvider(faux.provider);
  const extensions = {extensions:[], errors:[], runtime:createExtensionRuntime()};
  const resourceLoader = {
    getExtensions:()=>extensions,
    getSkills:()=>({skills:[],diagnostics:[]}),
    getPrompts:()=>({prompts:[],diagnostics:[]}),
    getThemes:()=>({themes:[],diagnostics:[]}),
    getAgentsFiles:()=>({agentsFiles:[]}),
    getSystemPrompt:()=>`Fixture-only role ${name}`,
    getSystemPromptSource:()=>undefined,
    getAppendSystemPrompt:()=>[], getAppendSystemPromptSources:()=>[],
    extendResources:()=>{}, reload:async()=>{},
  };
  faux.setResponses([
    fauxAssistantMessage(fauxToolCall(toolName,{}), {stopReason:'toolUse'}),
    fauxAssistantMessage(`FIXTURE ONLY ${token}`),
  ]);
  let calls = 0;
  const {session} = await createAgentSession({
    cwd, modelRuntime:runtime, model:faux.getModel(), thinkingLevel:'off',
    sessionManager:SessionManager.inMemory(cwd),
    settingsManager:SettingsManager.inMemory({
      compaction:{enabled:false}, retry:{enabled:false}, cacheWarming:'off',
    }),
    resourceLoader, tools:[toolName],
    customTools:[{name:toolName,label:toolName,description:'Read-only in-memory fixture',
      parameters:Type.Object({}), async execute() {
        calls++;
        return {content:[{type:'text',text:token}],details:{fixture:true}};
      }}],
  });
  return {session,faux,toolName,token,getCalls:()=>calls};
}
const [a,b] = await Promise.all([
  make('tasks','list_tasks','ONLY_A_001'), make('tests','test_results','ONLY_B_002'),
]);
try {
  await Promise.all([a.session.prompt(a.token), b.session.prompt(b.token)]);
  assert.notEqual(a.session.sessionId,b.session.sessionId);
  for (const [one,other] of [[a,b],[b,a]]) {
    assert(!JSON.stringify(one.session.messages).includes(other.token));
    assert.deepEqual(one.session.agent.state.tools.map(t=>t.name),[one.toolName]);
    assert.equal(one.getCalls(),1);
    assert.equal(one.faux.state.callCount,2);
  }
  console.log('PASS: real SDK, separate contexts, separate tool selections; fixture reasoning only');
} finally { a.session.dispose(); b.session.dispose(); }
```

实测各得到 `system → user → assistant → toolResult → assistant`，各一个真实工具调用、两个 fixture 响应；会话 ID 不同、没有对方标记、各只曝光指定工具。证明运行时结构及工具选择，**不证明智能效果，也不是官方子进程 example 的运行录像**；同进程 SDK 仍共享宿主权限。

## 固定版本官方来源

- [1 · Codemode 文档](https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/docs/codemode.md)
- [2 · Codemode 类型](https://github.com/earendil-works/pi/blob/v1.1.0/packages/codemode/src/types.ts)
- [3 · QuickJS host / execute](https://github.com/earendil-works/pi/blob/v1.1.0/packages/codemode/src/runtime/host.ts)
- [4 · Pi 包装器 ctx 与结果转换](https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/src/extensions/codemode/execute.ts)
- [5 · Subagent 固定源码](https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/examples/extensions/subagent/index.ts)
- [6 · Agent 定义加载规则](https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/examples/extensions/subagent/agents.ts)
- [7 · createAgentSession 参数与实现](https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/src/core/sdk.ts)
- [8 · ModelRuntime 默认文件及刷新行为](https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/src/core/model-runtime.ts)
- [9 · 官方 faux provider](https://github.com/earendil-works/pi/blob/v1.1.0/packages/ai/src/providers/faux.ts)
- [10 · Node 22.19 killed 语义](https://nodejs.org/download/release/v22.19.0/docs/api/child_process.html#subprocesskilled)
- [11 · 配置目录环境变量](https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/src/config.ts)
- [12 · ResourceLoader 接口](https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/src/core/resource-loader.ts)
- [13 · CLI 资源开关](https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/docs/cli.md)
- [14 · SDK 官方文档](https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/docs/sdk.md)
- [15 · coding-agent 根导出](https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/src/index.ts)

web 已核对官方固定版本 Codemode / SDK 文档、Subagent / faux / runtime 源码及 Node 文档；其余来自同版本安装包的只读源码／类型。验证通过为本次自编 API 测试，不把源码阅读当作在线模型验证。
