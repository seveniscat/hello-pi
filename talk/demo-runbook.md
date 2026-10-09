# 控制面主线版演示手册｜问题之后，立即检查证据

基线：2026-10-09；Pi / pi-codemode / pi-durable **1.1.0**；Node **22.19.0**。固定版本，不临场安装或升级。本机 macOS 执行的是离线机制检查；真实模型与 TUI 尚未彩排。

## 0. 主场路径与证据等级

75 分钟版按 **漂移 → 工具负担 → 支线污染 → 介入时机 → 长跑恢复** 排列。不在最后重复做一组 Demo；Subagent 只作两分钟扩展说明。

| 演示 | 真正运行的组件 | 教学预置 / 未运行的部分 | 本机状态 / 主场位置 |
|---|---|---|---|
| /verify | Pi 扩展加载器与固定测试进程 | TUI 未实测；修复由人工准备 | 失败/成功已验证；场景一 |
| 路由 | 自编 route 回调 | 模型目录与描述是 fixture，无模型派发 | 四种输入已验证；场景一 |
| Codemode | 官方 QuickJS/WASM 与宿主工具 | 教学数据、手写脚本，无 MCP 传输 | 调用、筛选、错误与宿主计数已验证；场景二 |
| 会话分支 | SessionManager、branch、buildSessionContext | 手写消息/摘要，无 TUI 或模型摘要 | 活动路径与文件不回滚已验证；场景三 |
| Steering / Follow-up | 官方 core loop、队列、工具和事件 | 官方 faux 测试 provider 预置响应，无 TUI | 顺序/并行批次的交付位置已验证；场景四 |
| Durable | 官方 Harness、JSONL、SIGKILL、新进程恢复 | 自定义确定性任务，无模型和外部通知 | A=1、B=2；长跑段 |
| Subagent 结构 | 双进程、真实 SDK、工具读文件 | 模型响应为 fauxProvider fixture | 独立输入与部分失败已验证；加时/课后 |
| Subagent 联网 | 已提供真实 CLI 双子进程脚本 | 需专用 profile 和获准模型，可能计费 | 仅语法检查，未执行 |
| AGENTS.md / 扩展热更新 | 主讲时展示资源清单和规则 diff | /reload 的真实界面与模型行为尚未彩排 | 不作为已有实测成果 |

每个演示用一句话说清“真实组件 / 预置部分 / 未证明什么”，详细限制放角标。不要以界面看起来听话证明规则不可绕过，不以脚本成功证明真实模型判断正确。


## 1. 分享前准备

```bash
ROOT="/Users/bloks/bzdev/playground/hello-pi"
cd "$ROOT"
node --version
pi --version
npm test
```

基础教材没有业务依赖；根目录 `npm test` 验证初始失败、参考修复与 `/verify`，本机为 10 项通过。

Codemode、SessionManager 与 SDK 演示默认使用全局 npm 安装的 Pi **1.1.0**，不会自动更新全局版本。如安装路径不同，可设置 `PI_PACKAGE_DIR` 指向该版本的包目录。

Durable 用项目内独立运行目录，不使用全局安装，也不依赖 Bun。本次已安装并保存 lockfile，安装时禁用了生命周期脚本：

```bash
npm ci --prefix demo/advanced/runtime --ignore-scripts --no-audit --no-fund
```

此命令在新机器上需要访问 npm。**不要在台上执行安装。** 锁定版本不等于安全审计；依赖树包含平台包，不宣称全是纯 JS。

一次性验证所有进阶演示：

```bash
npm run check:advanced
npm run check:docs
```

- `check:advanced` 依次运行路由、会话、Codemode、Steering、双子会话、部分失败和 Durable，共 7 组断言（Steering 内含顺序与并行两种模式）。
- 不读取个人 auth/settings，不调用真实 provider；子代理和 Durable 子进程使用空白 HOME / 显式允许的环境。
- `check:docs` 检查本地引用、shell 语法与 60/75/90 分钟表，不替代事实核验或现场彩排。
- 程序报告保存至 `verification/advanced/`；实时状态以报告为准。

## 2. 教学背景与 `/verify`：课前准备，不在开场修 bug

```bash
ROOT="/Users/bloks/bzdev/playground/hello-pi"
cd "$ROOT"
DEMO="$(node scripts/prepare-demo.mjs broken)"
cd "$DEMO"
npm test
npm run demo
```

`npm test` 故意以 1 退出，不要用 `&&` 串接下一步。预期 4 pass / 1 fail，CLI 错误为 2/0/1/1。

这个目录是新副本，不修改原始教材。参考修复使用新副本：

```bash
cd "$ROOT"
FIXED="$(node scripts/prepare-demo.mjs fixed --resources)"
cd "$FIXED"
npm test
npm run demo
```

预期 5 pass / 0 fail，CLI 为 4/1/1/2。明确说参考修复是人工准备的，不是本次模型生成。

若已彩排过 TUI，在专用 profile 中显式加载扩展：

```bash
pi --no-extensions --no-skills --no-prompt-templates \
   --no-context-files --no-mcp --approve -e .pi/extensions/verify.ts
```

然后输入 `/verify`。若没有 TUI 条件，直接展示 `verification/report.json` 的 loader+exec 结果。两种方式都必须说清楚验证层级。

**主场安排**：04:00–08:00 只看故障与人工修复结果；`/verify` 放在场景一 11:00–15:00。没有 TUI 彩排就用 loader+exec 报告，不能把报告说成刚才的界面操作。

## 3. 场景一：输入与规则清单，执行入口与模型路由

### 先展示输入来源，不先运行路由

08:00–11:00 展示基础指令、AGENTS.md、Skills、扩展、工具、活动历史与当前材料的来源清单；说明哪些由自己维护、哪些仍受模型和环境影响。之后运行 /verify（上一节），15:00–18:00 再展示路由回调。

可选 /reload 只在隔离的教学副本、专用 profile 和已彩排的 TUI 中进行；不修改个人规则文件，不使用本手册关闭上下文的 /verify 启动命令验证 AGENTS.md。**规则可编辑不等于模型必然遵守，更不是权限强制。** 当前没有热更新 TUI 证据，主场可以不操作。

```bash
cd /Users/bloks/bzdev/playground/hello-pi
npm run demo:router
```

展示文件：`demo/advanced/extensions/workshop-router.ts`。它注册 `workshop/auto`，根据新用户请求的 thinking level 选择配置的 planner 或 builder；continuation/retry 保持原物理模型。

### 应观察到

| 输入 | 结果 |
|---|---|
| user / high | planner |
| continuation / previous=planner | planner |
| user / low | builder |
| retry / failed=builder | builder |

### 必须讲清楚

- 这段真实运行的是我们写的 route 回调；registry 与模型对象是 fixture。
- 没有实际模型生成，没有测试 TUI 模型选择，也没有测费用、延迟和质量。
- 完整扩展可用于后续真实环境，但需配置 `PI_TALK_PLANNER` / `PI_TALK_BUILDER` 为实际可用的 `provider/model`，并验证凭据与兼容性。
- 不在台上展示密钥；不假定更换模型一定更省。

报告：`verification/advanced/router.json`。

## 4. 场景二：真实 QuickJS、两路工具调用与结果裁剪

```bash
cd /Users/bloks/bzdev/playground/hello-pi
npm run demo:codemode
```

### 输入和实际代码

数据在 `demo/advanced/fixtures/review-data.json`，包含任务及每个任务的一条“最近检查”记录。真实系统若有多条历史记录，要另行实现“最近”的选择，不可照搬这个简化前提。

脚本通过 `CodemodeSandbox` 注入 `read_tasks` 与 `read_checks`；它们是本地宿主工具，**没有建立 MCP 连接**。实际执行代码保存在报告的 `code` 字段和 `demo/advanced/codemode.mjs` 中。

```js
const [tasks, checks] = await Promise.all([
  tools.read_tasks({}), tools.read_checks({}),
]);
const byTask = new Map(checks.map(check => [check.taskId, check]));
return tasks
  .filter(task => task.archived !== true && task.status !== 'done'
    && byTask.get(task.id)?.result === 'failed')
  .map(task => ({ id: task.id, reason: byTask.get(task.id).reason }));
```

### 五个观察点

1. 首两个 trace 事件都为 `start`，随后才出现 `end`；说明这次两个工具调用存在重叠，而非保证所有任务都能加速。
2. 正确结果仅为 `T-101` 和一句原因，不含邮箱、内部备注或长日志。
3. 故意删除 `status !== 'done'`，结果出现不该返回的 `T-103`；测试反例能让错误可见。
4. 直接调用 `process.cwd()` 得到真实解释器错误：`process is not defined`。
5. 独立的宿主计数器工具先执行，然后脚本抛错；计数器仍为 1，说明脚本失败没有回滚宿主副作用。

第五点是**内存计数器**，不是发真实通知，也不是持久化副作用测试。

报告中有字符数，但不要换算成未经测量的 token / 费用节省。这里也没有模型生成脚本，不能把“脚本正确”当作“模型必然写对”。

报告：`verification/advanced/codemode.json`。

**硬截止**：主版本 27:00 如环境出错，切到此报告；32:00 进入场景三，不占用分支与 Steering 时间。

## 5. 场景三：真实分支与实际消息数组

```bash
cd /Users/bloks/bzdev/playground/hello-pi
npm run demo:sessions
```

### 操作顺序

1. 查看 `mainContext`：有共同目标与主线，没有 null 支线。
2. 查看 `branchContext`：共享共同目标，但问题不同。
3. 查看 `withSummary`：显式加入了“讲者手写摘要”。
4. 看 `navigationDoesNotRevertFile: true`，解释磁盘不是会话的快照。

脚本真实调用 SessionManager，但没有调用模型、自动压缩或 TUI `/tree`。这能证明上下文构造机制，不能证明摘要质量。

报告：`verification/advanced/sessions.json`。讲者需要熟悉前三个数组，不把整份 JSON 从头念到尾。

## 6. 场景四：Steering / Follow-up 的真实交付时机

```bash
cd /Users/bloks/bzdev/playground/hello-pi
npm run demo:steering
```

### 实际跑了什么

- 直接使用 Pi 1.1.0 的官方 Agent core loop 与官方测试 provider；不创建 SDK 资源加载器，不发现个人配置或读取凭据。
- 模型响应和用户输入均由教材预置。工具 A/B/C 只记录内存事件，不修改文件或通知外部系统。
- A 执行期间先调用 followUp，再调用 steer；两者都在 A 返回前排入。
- 顺序和并行两种工具执行模式分别验证；没有用等待固定秒数猜测时序。
- 不调用真实 provider，并把本进程 fetch 设置为失败；这不是 OS 沙箱保证。

### 台上只看四个位置

1. `queued:followUp` 先于 `queued:steer`。
2. A、B 都完成，`turn:1:end` 后才出现 `delivered:steer`。
3. 第 2 次请求包含 Steering、不包含 Follow-up；工具 C 和当前工作继续收尾。
4. `turn:3:end` 后才交付 Follow-up，进入第 4 次请求。

顺序模式中 A 先结束；并行模式不要求 A/B 结束顺序一致。两种情况下都不能把 Steering 解释成跳过当前批次剩余工具或实时急停。

报告包含每次请求的用户输入列表；精简台上输出只显示 trace、检查结果和真实模型调用数 0。看完整证据：

```bash
PI_TALK_VERBOSE=1 npm run demo:steering
```

报告：[steering.json](/Users/bloks/bzdev/playground/hello-pi/verification/advanced/steering.json)。本例证明队列交付，不证明模型理解/遵守纠偏、不证明取消或回滚，也不是 TUI 键盘操作实测。

**硬截止**：45:00 停止排障，使用准备阶段 trace；48:00 进入长跑段。不要临场调用真实模型补充所谓“智能性证明”。


## 7. 从交互到长跑：Durable 的真实中断与恢复

```bash
cd /Users/bloks/bzdev/playground/hello-pi
npm run demo:durable
```

### 真实路径

```text
进程一：创建真实 Durable task → A 处理输入 → 提交 B checkpoint
       → 进入 B → 自身 SIGKILL
进程二：重开同一 JSONL 存储 → 读到同一 taskId / pending / phase B
       → waitForTask 启动调度 → B 完成
进程三：只重开检查终态，不重新执行任务
```

- 使用官方 `@earendil-works/pi-durable@1.1.0`。
- 使用 `openNodeJsonlStorage(..., { fsync: true })`，不是自写 JSON 文件恢复逻辑。
- 调度与 checkpoint 来自 `Harness` / `defineTask`；我们额外写的 phase-attempts 仅作为观察计数器。
- SIGKILL 只发给教材创建的子进程自身；不结束用户的 Pi、终端或其他任务。
- 每次创建全新临时目录，结束时只删除本次创建的临时目录；报告保留。

### 预期证据

```text
第一次：A 进入 1 次；B 进入后被中断
恢复前：同一个 taskId，pending，checkpoint.phase = B
最终：A = 1；B = 2
结果：taskIds=[T-101,T-102]，draft=待审查任务：T-101、T-102
再次只读打开：计数仍为 A=1、B=2
```

不要读完整嵌套 JSON；先看 `counts`、`recoveredPhase`、`result`，再用 `runs` 中的三次实际记录解释证据。

### 这段没有证明什么

- 这是自定义确定性任务，没有注册模型 provider，没有 generation task。
- 没有执行内置 unsafe ToolTask 的恢复，也没有真实通知服务。
- 没有恢复 JavaScript 调用栈，而是根据已提交 checkpoint 进入相应阶段。
- 不测试主机断电、磁盘损坏或分布式事务。
- A=1、B=2 是这个确定中断点的观察，不是任意外部副作用 exactly-once。

报告：`verification/advanced/durable.json`。当前“通知已发、确认未落盘”仍是基于官方规则的故障推演，不包装成现场通知实验。

**主版本硬截止**：55:00 停止排障，保留通知故障窗口说明；59:00 进入责任段。

## 8. 可选 Subagent：90 分钟加时或课后，不是 75 分钟主场演示

75 分钟版 48:00–50:00 只讲角色、输入、返回契约与部分失败。90 分钟版只增加两分钟观察失败汇总；完整并行模型演示另行安排。

```bash
cd /Users/bloks/bzdev/playground/hello-pi
npm run demo:subagents
npm run demo:subagents:failure
```

### 离线模式真实执行了什么

协调脚本创建两个 Node 子进程，每个使用：

- 独立 Pi `createAgentSession`、SessionManager 与内存 settings；
- 空白的 HOME、内存 credential store、空资源加载器，禁止 fetch；
- 官方 `fauxProvider`，其两条响应预设为“调用指定读取工具”“返回预置结果”；
- 只曝光一个本例工具，实际读取各自分配的教学文件。

规则角色读取 README 与实现；测试角色读取测试与样例。模型输出的结论是**预写 fixture**，不是推理；工具读文件和 agent 循环是真的。

### 看什么

- 两个 PID 不同，sessionId 不同。
- 各自 messages 不包含另一个角色的专用标记。
- `exposedTools` 各只有本角色工具；`toolCalls` 各为 1。
- `fixtureModelCalls` 各为 2，`realModelCalls` 为 0。
- 失败模式中，测试 worker 故意退出；父结果 `complete:false`，规则 worker 的成功不会掩盖失败。

这是**我们写的 SDK 编排示例**，不是 Pi 官方 subagent 扩展的运行录像。子进程、上下文和工具列表也不等于 OS 沙箱。

报告：`verification/advanced/subagents.json` 与 `subagents-partial-failure.json`。

### 可选联网彩排：真正的模型审查

已提供 `demo/advanced/subagents-live.mjs`。它不使用 fixture，启动两个真实 Pi CLI 子进程，各用单独的教学副本和只读工具，提取实际返回。**本次只做了语法检查，未调用真实模型。**

先由讲者在专用 profile 中按 Pi 正常流程配置获准的模型；不要复制个人 auth 文件或在屏幕中打印凭据。

```bash
ROOT="/Users/bloks/bzdev/playground/hello-pi"
cd "$ROOT"
mkdir -p "$ROOT/.rehearsals/pi-agent-profile"
export PI_CODING_AGENT_DIR="$ROOT/.rehearsals/pi-agent-profile"
export PI_TALK_MODEL='填写已配置且获准的provider/model'
# 完成该 profile 的正常认证后，以下命令会产生真实模型请求，可能计费：
npm run demo:subagents:live
```

注意：

- 在线脚本使用指定 profile 及正常继承的环境；不要在包含不必要凭据的环境中运行。
- 显式关闭扩展、MCP、上下文文件与其他资源发现，但不把 CLI 开关称为完整安全隔离。
- 每个子任务约 90 秒超时；失败会单独记录，不报告“全部通过”。
- 输出是模型结果，还需要人审查；程序成功退出不证明审查结论正确。
- 结果写入 `verification/advanced/subagents-live.json`；执行后先检查，再决定能否对外展示。
- 当前离线验证不创建该文件，不能把脚本存在说成在线演示已完成。

## 9. 失败兜底与对外分发

| 失败位置 | 怎么切换 | 必须说什么 |
|---|---|---|
| 运行时版本不匹配 | 用准备阶段报告，不自动全局升级 | “本场没有重新执行。” |
| 依赖缺失 | 用报告；会后按 lockfile 安装 | “先前验证环境有该依赖。” |
| Codemode / Steering / 子会话脚本报错 | 展示对应 JSON 与代码，说明错误范围 | “机制演示本场失败，不代表模型完成。” |
| 联网模型慢或不可用 | 切到已验证的离线结构模式 | “这段模型输出是fixture，不是刚才的真实回答。” |
| Durable 运行异常 | 用三进程记录继续讲 checkpoint | “报告来自准备阶段实际运行。” |

上台前在同一台机器完整走两遍，至少一次练习主动切换兜底。命令跑得快，不代表后排能看懂；留时间指出输入、关键字段和不能外推的保证。

对外分发保留源码、lockfile 与已审阅报告；**不要打包 `node_modules/` 或 `.rehearsals/`**。后者以后可能含认证与会话，即使 Git 忽略也不代表可公开。
