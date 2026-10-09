# Pi 分享：来源登记与反误导审查

核查基准：**2026-10-09，Asia/Shanghai**。本表登记事实、证据与讲述边界。来源核验读取了官方文档、源码、测试及作者材料，没有执行来源中的第三方示例，也没有读取凭据。另行完成的本地教材验证见 L01。`O` 为官方来源，`C` 为社区作者一手来源；讲者建议单独标明。ID 已固定，供主讲稿引用。

## 1. 版本口径

本次 GitHub `releases/latest` 与 npm `dist-tags.latest` 均指向 **1.1.0**；另查最近五次公开发行，未见更晚发行或预发行。此处“最新”指正式公开发行，不指 main 的后续提交。GitHub 发布时间为 **2026-10-07T22:26:31Z**，即上海 **10 月 8 日 06:26:31**；npm 为 `2026-10-07T22:16:26.802Z`。发行说明标 10 月 7 日，两者不是冲突。`legacy-node20=0.74.2` 不是最新版本。包要求 Node **≥22.19.0**。[O01]

下列 `v1.1.0` 链接在核查时解析到提交 **`abe508e1b89912adde45528136c3221eb69acdd7`**；技术裁定优先固定版本源码与测试，不以浮动首页覆盖它。表中 **V** 统一表示“v1.1.0，核查至 2026-10-09”。本机演示环境的独立验证记录为 Pi 1.1.0、Node 22.19.0；结果与范围见 L01。

## 2. 声明审查表

**引用纪律**：官方文档说明承诺，固定源码说明这一版本如何实现，测试说明项目覆盖的情形，作者文章只说明作者的做法。代码阅读不等于本地验证通过。讲稿若增加性能、成本或安全优势比较，应另列指标及测试条件，不从“极简”“可扩展”推导普遍优胜。60／75／90 分钟版本可删减例子，不删关键限制；社区经验与讲者建议不要改标为官方最佳实践。

| 可上台表述的事实 | 证据 ID（完整 URL 见第 4 节） | 性质 | 适用日期 | 不能外推什么 |
|---|---|---|---|---|
| Pi 是可扩展 agent harness：组织模型请求、工具执行、上下文和会话存储。 | [O02](#o02) | 官方 | V | 不是新模型；不是 OpenClaw 的别名；“不内建 sub-agents／plan mode”不等于扩展做不到。 |
| 默认启用 `read/bash/edit/write`；还有 `powershell/grep/find/ls` 等可选工具。 | [O03](#o03) | 官方 | V | 不是“工具总共只有四个”。`--tools read,…` 也不能单独证明只读隔离：MCP 另有曝光／筛选规则。 |
| session 为 JSONL 树；模型使用活动分支；`/tree` 留在原文件，`/fork` 新建会话。 | [O02](#o02)、[O04](#o04) | 官方 | V | 会话分支不是 Git 分支，更不自动回滚磁盘、通知或数据库。 |
| compaction 用摘要及近期消息缩减后续上下文，原始条目仍保存；切换分支可附摘要。 | [O04](#o04) | 官方 | V | 不等于无损记忆；打开树本身不等于触发分支摘要。 |
| steering 在当前 turn 及其工具批次完成后介入；follow-up 等当前 run 的待办完成。 | [O05](#o05) | 官方源码裁定 | V | 首页“当前工具后中断剩余工具”的说法与详细文档冲突；不要承诺实时截断，steering 也不等于 abort。 |
| Template 是带参数的 Markdown 提示，展开为用户输入。 | [O06](#o06) | 官方 | V | `/name` 不一定是运行时代码命令，也不自动执行工作流。 |
| Skill 以 `SKILL.md` 为核心，可带脚本／资料；先披露名称描述，正文按需加载。 | [O07](#o07) | 官方 | V | 不是新权限层；带脚本不表示已自动执行，也不保证每次自动选中。 |
| Extension 在 Pi 进程内注册工具、事件、命令、provider、UI，可热重载。 | [O08](#o08) | 官方 | V | 不是隔离插件；可接触进程可见的文件、凭据与会话。 |
| Package 分发扩展、技能、模板、主题，可来自 npm、git、本地目录。 | [O09](#o09) | 官方 | V | 打包或公开发布不代表官方审计、兼容性或安全背书。 |
| 内建 MCP 支持 stdio／streamable HTTP；工具默认 `codemode` exposure，可选 direct／deferred／hidden。 | [O10](#o10) | 官方 | V | 不支持旧 SSE；工具未直接进入提示不等于不可调用。 |
| Codemode 在 QuickJS 运行脚本，组合工具并筛选输出；没有直接 Node、文件系统和网络 API。 | [O11](#o11) | 官方 | V | 仍可通过工具／models 访问外界；已发生的工具副作用不会因脚本失败撤销。 |
| SDK 是 Node/Bun 进程内 TypeScript 接口；RPC 是独立 Pi 子进程的 stdin/stdout JSONL 协议。 | [O12](#o12) | 官方 | V | 两者都不是 MCP。SDK 不自动装入 CLI 的 MCP/Codemode/tool_search；须显式接入并绑定扩展。 |
| 默认不逐工具审批；工具和扩展继承进程权限，工作目录不是访问边界。 | [O13](#o13) | 官方 | V | 不能说“有 trust 就安全”或“解释器沙箱保护整台主机”。 |
| 项目信任默认 `ask`；控制项目资源加载，非交互无已有批准时跳过受保护资源。 | [O13](#o13) | 官方 | V | 拒绝信任仍可加载 `AGENTS.md` 等上下文；`sessionDir` 先于 trust 读取。它不是完整启动隔离。 |
| MCP/Codemode 于 **0.99.0／2026-09-29** 加入内建扩展。 | [O14](#o14) | 官方 | 2026-09-29 起 | 1 月旧帖“没有 MCP”不能作为现在的功能清单。 |
| 指定的 Pi Durable 文章介绍另一个实验性框架；不替代终端 Pi，API 可无预告变动。 | [O15](#o15) | 官方 | 文章 2026-10-01；V | 不包装成成熟通用工作流保证；恢复须重开原持久存储，内存存储不抵抗进程消失。 |
| `requestId` 在同一 conversation 内返回原 submission；同类型即使内容不同也复用，换提交类型则拒绝。 | [O16](#o16) | 官方源码＋测试 | V | 不是内容哈希校验、全局去重或工具副作用 exactly-once；不能给不同业务请求复用 ID。 |
| 工具默认 `unsafe`；执行意图已落盘后中断，仅当已存策略与当前声明均为 `safe` 才重跑。否则返回“可能部分运行”的中断结果。 | [O17](#o17) | 官方源码＋测试 | V | `safe` 是开发者承担的重放承诺，不是框架自动判定幂等；不重放不等于撤销。 |
| Session 原子提交记录、任务及文档，但外部副作用不在该事务内。 | [O18](#o18) | 官方规范 | V | 本地草稿与状态原子保存，不代表同时原子提交 Slack／邮件通知。 |
| 指定的 Pi School 是 Zeke Sikelianos 的非官方课程；作者仓库 10 月 6 日已更新 Pi 1.0 并新增 MCP/Codemode。 | [C01](#c01) | 社区 | 2026-10-06 版本 | 不能称官方认证课程，也不能整站称“1.0 前旧教程”；课程目录不天然等于 75 分钟讲稿。 |
| 实践① Armin 用分支做支线修复／review，带结果回原任务；`/answer` 将自然语言问题整理成回答界面。 | [C02](#c02) | 作者实践 | 文章 2026-01-31 | `/answer` 是额外扩展，抽题需要模型调用；旧代码未验证与当前版本兼容。摘要、审查并无质量保证。 |
| 实践② Julian 先做 SQLite 任务 CLI `pic`，Pi 的 `/task` 再呈现 CLI 输出。 | [C03](#c03) | 作者实践 | 2026-02-15 | 是解耦经验，不是 Pi 内置任务管理器或可量化收益结论。 |
| 实践③ Colin 将整个 agent 放入 Docker，缩小挂载范围，并提供项目只读模式。 | [C04](#c04) | 作者实践 | 文章 2026-05-12；仓库 09-15 | 不是绝对安全：配置目录可写、恶意扩展可持久化、网络仍可外联；旧包装器不代表已验证 Pi 1.1.0。 |

## 3. 故障例子的准确边界

**讲者构造的示例，不是本地已跑过的 Durable 测试。** 假定“读取 issue→生成草稿”结果已持久化，通知工具的执行意图也已落盘。工具随后发出通知，但在本地提交完成结果前进程崩溃；“确认未落盘”不等于“服务没收到”。[O17][O18]

1. 重开同一持久存储并恢复调度。同一 conversation 再提交同一 `requestId`，拿回原 submission；它既不查询通知服务，也不替通知服务去重。[O15][O16]
2. 通知工具若为默认 `unsafe`，该中断任务不会自动重放，模型收到“可能已部分运行”的错误。模型或操作者随后仍可能发起**新调用**，所以这不是“此通知永不重复”的保证。[O17；后一句为边界推论]
3. 若前后都声明 `safe`，框架重跑该工具；远端没有有效去重时，可能再发一次。已持久完成的任务不因这个恢复点重放，但不能据此推导整条业务链只执行一次。[O17][O18]
4. **讲者建议／设计推论**：发送前持久化业务通知 ID，以同一 ID 重试，并依赖接收端明确的幂等键契约（范围、有效期、内容一致性）。若无此能力，先查发送记录或人工对账，不盲目补发。事务 outbox 可持久化发送意图，**单独使用仍不能消除上述重复窗口**；这里未宣称 Pi 内置了 outbox 或远端去重。[O16–O18]

因此可讲“提交去重＋有条件恢复”，不可讲“`requestId` 让任意外部工具 exactly-once”。规范的关键原句是：**“External effects do not run inside the Session mutation transaction.”** [O18]

本地实操的证据另列：教材制作记录报告 10 项离线校验、初始 4 过 1 失败／参考修复 5 过 0 失败，以及真实 Pi loader＋exec 的 `/verify` FAIL/PASS；未调用模型、凭据、TUI。这不能证明线上模型、交互终端或 Durable 崩溃恢复已实测。本代理按要求未检查 demo 代码。

## 4. 完整出处与稳定 ID

以下官网／文章链接可能随时间变化；源码和测试均固定版本或提交。URL 为完整地址，未使用跳转短链。GitHub API／npm 元数据以公开只读请求补核。

<a id="o01"></a>
### O01 · 版本、发行与 Node
- `https://github.com/earendil-works/pi/releases/tag/v1.1.0`
- `https://api.github.com/repos/earendil-works/pi/releases/latest`
- `https://api.github.com/repos/earendil-works/pi/releases?per_page=5`
- `https://registry.npmjs.org/%40earendil-works/pi-coding-agent`
- `https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/package.json`
- 标签核验：`https://api.github.com/repos/earendil-works/pi/git/ref/tags/v1.1.0`

<a id="o02"></a>
### O02 · 定位与运行循环
- `https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/README.md`
- `https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/docs/how-pi-works.md`

<a id="o03"></a>
### O03 · 默认工具与选择范围
- `https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/docs/cli.md#tools`

<a id="o04"></a>
### O04 · 会话、分支与压缩
- `https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/docs/sessions.md`
- `https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/docs/session-format.md`

<a id="o05"></a>
### O05 · Steering 冲突裁定与固定版本时序
- 冲突首页：`https://pi.dev/`
- 版本文档：`https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/docs/usage.md`
- 固定实现：`https://github.com/earendil-works/pi/blob/v1.1.0/packages/agent/src/agent-loop.ts#L260-L296`
- 顺序为 `await executeToolCalls` → `turn_end` → `getSteeringMessages`；O12 的 SDK 文档也采用 turn 后介入的说法。本轮重新核对固定版本源码，并增加 L03 的顺序/并行实跑，不采用附件中“跳过同批剩余调用”的描述。

<a id="o06"></a>
### O06 · Prompt templates
- `https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/docs/prompt-templates.md`

<a id="o07"></a>
### O07 · Skills
- `https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/docs/skills.md`

<a id="o08"></a>
### O08 · Extensions
- `https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/docs/extensions.md`

<a id="o09"></a>
### O09 · Packages
- `https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/docs/packages.md`

<a id="o10"></a>
### O10 · MCP
- `https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/docs/mcp.md`

<a id="o11"></a>
### O11 · Codemode
- `https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/docs/codemode.md`

<a id="o12"></a>
### O12 · SDK／RPC
- `https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/docs/sdk.md`
- `https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/docs/rpc.md`

<a id="o13"></a>
### O13 · 权限、trust 与隔离
- `https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/docs/security.md`
- `https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/docs/settings.md`

<a id="o14"></a>
### O14 · MCP 引入时间
- `https://pi.dev/changelog/releases/0.99.0`
- `https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/CHANGELOG.md`
- `https://earendil.com/posts/you-said-no-mcp/`

<a id="o15"></a>
### O15 · 指定网站：Pi Durable
- 2026-10-01，Earendil Engineering：`https://earendil.com/posts/pi-durable/`
- 同版包声明：`https://github.com/earendil-works/pi/blob/v1.1.0/packages/durable/README.md`
- 必要短引文：**“Experimental. The API changes without notice between releases.”**

<a id="o16"></a>
### O16 · requestId 提交去重
- `https://github.com/earendil-works/pi/blob/v1.1.0/packages/durable/src/harness/submissions.ts#L141-L163`
- `https://github.com/earendil-works/pi/blob/v1.1.0/packages/durable/test/harness-submissions.test.ts#L82-L107`
- 核查点：按 `conversationId + requestId` 查找；同类型直接返回旧 ID；测试明确传入不同内容，并验证另一个 conversation 可复用相同 requestId。

<a id="o17"></a>
### O17 · 中断工具、默认 unsafe 与重放
- `https://github.com/earendil-works/pi/blob/v1.1.0/packages/durable/src/harness/tool.ts#L33-L111`
- `https://github.com/earendil-works/pi/blob/v1.1.0/packages/durable/test/harness-tools-recovery.test.ts#L108-L164`
- 测试是实现证据，来源核验阶段仅阅读，未运行；特别区分“持久意图后中断”与“意图前中断”。

<a id="o18"></a>
### O18 · 事务与外部副作用
- `https://github.com/earendil-works/pi/blob/v1.1.0/packages/durable/docs/spec.md#L44-L78`
- 文件标题仍为 `Pico5 specification`，正文自述为规范；核对 §1 的事务边界、§6 的提交去重及工具恢复章节，不将内部代号当另一个发布产品。

<a id="c01"></a>
### C01 · 指定网站：Pi School
- `https://pi-school.ziki.boo/`
- `https://pi-school.ziki.boo/about/`
- 作者仓库固定说明：`https://github.com/agentschools/pi-school/blob/94a34c9410ea86b54f4148f15cede24775702edf/src/pages/about.astro`
- Pi 1.0 更新：`https://github.com/agentschools/pi-school/commit/dd1c302127a0b1cf1e0723fea78d33b591dc4e05`
- 新增两课：`https://github.com/agentschools/pi-school/commit/54b8d42bb2a4dde1c1480872a95e4954d80bdd35`
- 本轮网页抓取不可达，改读作者仓库原文与提交；不把仓库日期冒充站点首次公开日期。

<a id="c02"></a>
### C02 · Armin：支线／review 与访谈回答扩展
- `https://lucumr.pocoo.org/2026/1/31/pi/`
- `/answer` 固定源码：`https://github.com/mitsuhiko/agent-stuff/blob/67bfb288446351cfd6ae4293bb217e4fe9ed9fe2/extensions/answer.ts`
- 作者文章中的“只有四个工具／没有 MCP”只作历史语境；当前事实分别使用 O03／O14。

<a id="c03"></a>
### C03 · Julian：CLI 先行，再加薄 UI
- `https://jprokay.com/post/018-pi-coding-agent`

<a id="c04"></a>
### C04 · Colin：缩小误操作影响范围
- `https://www.linkedin.com/pulse/what-i-learned-making-my-coding-agent-less-yolo-colin-jermain-igbme`
- 固定仓库安全边界：`https://github.com/cjermain/pi-less-yolo/blob/204a753854d909ad0a4f132f4b0a649884da82db/README.md`
- 只采纳作者亲历、设计及限制；不复述文中未另行核查的攻击事件规模或 CVE 对比数字。


<a id="l01"></a>
### L01 · 本地教材验证，不是模型演示录像

- [完整报告](/Users/bloks/bzdev/playground/hello-pi/verification/report.json)
- [初始测试输出](/Users/bloks/bzdev/playground/hello-pi/verification/broken-tests.txt)
- [参考修复测试输出](/Users/bloks/bzdev/playground/hello-pi/verification/fixed-tests.txt)
- [CLI 前后结果](/Users/bloks/bzdev/playground/hello-pi/verification/sample-outputs.json)
- 验证入口：工作区根目录 `npm test`；业务样例没有第三方依赖。
- 真实 Pi 1.1.0 loader 与 exec 已验证失败/成功；UI 通知通过接口桩收集，不等于 TUI 交互实测。
- stopped 分支为模拟返回值测试，不是耗时 15 秒的真实超时压力测试。
- 这是基础版验证范围：未执行真实模型调用、凭据检查、静态 TypeScript 检查、MCP 连接或界面录屏。新增 Durable 等机制验证另见 L02。
- 人工参考修复与题目共同构成教学材料，不是模型运行记录。


## 5. 亮点优先版新增出处与机制验证

<a id="o19"></a>
### O19 · Virtual Models：选择与派发、连续性、路由状态
- `https://pi.dev/docs/latest/virtual-models`
- 固定版本：`https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/docs/virtual-models.md`
- route 在请求前选择实际模型与 thinking level；continuation/retry 的保持策略、缓存与思考签名限制见文档。回调测试不证明真实模型质量或费用收益。

<a id="o20"></a>
### O20 · Subagent 示例与真实 SDK / faux provider
- 官方扩展示例：`https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/examples/extensions/subagent/index.ts`
- Agent 定义：`https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/examples/extensions/subagent/agents.ts`
- SDK：`https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/src/core/sdk.ts`
- 资源加载：`https://github.com/earendil-works/pi/blob/v1.1.0/packages/coding-agent/src/core/resource-loader.ts`
- 官方测试 provider：`https://github.com/earendil-works/pi/blob/v1.1.0/packages/ai/src/providers/faux.ts`
- 本场离线示例是自编双进程 SDK 协调器，不是官方扩展的演示录像；进程/上下文隔开不等于 OS 安全隔离。
- 细节见 [Codemode/Subagent 核查备忘](/Users/bloks/bzdev/playground/hello-pi/research/advanced-codemode-subagent.md)。

<a id="o21"></a>
### O21 · Durable 无模型持久任务与 Node 存储
- 包版本与入口：`https://github.com/earendil-works/pi/blob/v1.1.0/packages/durable/package.json`
- Harness：`https://github.com/earendil-works/pi/blob/v1.1.0/packages/durable/src/harness/harness.ts`
- 任务调度恢复：`https://github.com/earendil-works/pi/blob/v1.1.0/packages/durable/src/harness/scheduler.ts`
- Node JSONL：`https://github.com/earendil-works/pi/blob/v1.1.0/packages/durable/src/storage/jsonl/node.ts`
- 无真实模型的官方任务示例：`https://github.com/earendil-works/pi/blob/v1.1.0/packages/durable/test/examples/24-child-tasks.ts`
- defineTask 类型：`https://github.com/earendil-works/pi/blob/v1.1.0/packages/durable/src/types.ts`
- 本场调用 Harness.open / waitForTask；不是把纯 createSession 当作任务运行器。自定义任务恢复不等于 ToolTask unsafe 恢复或外部通知 exactly-once。
- [Durable API 核查备忘](/Users/bloks/bzdev/playground/hello-pi/research/advanced-durable-demo.md)保留的是实现前草案；当前演示的真实结果以 L02 为准。

<a id="o22"></a>
### O22 · 官方 Pi 1.0 的自定制与路由演示
- `https://earendil.com/posts/pi-1-0/`
- 用于说明官方展示的可塑性方向，不把文章中的特定模型选择或当时效果当作本场实测。

<a id="l02"></a>
### L02 · 亮点优先版的本地机制演示
- [汇总](/Users/bloks/bzdev/playground/hello-pi/verification/advanced/summary.json)
- [路由回调](/Users/bloks/bzdev/playground/hello-pi/verification/advanced/router.json)：模型目录与描述为fixture，未实际派发。
- [会话分支](/Users/bloks/bzdev/playground/hello-pi/verification/advanced/sessions.json)：真实SessionManager，手写输入/摘要。
- [Codemode](/Users/bloks/bzdev/playground/hello-pi/verification/advanced/codemode.json)：真实QuickJS与宿主工具；无MCP传输、无模型生成脚本。
- [Subagent](/Users/bloks/bzdev/playground/hello-pi/verification/advanced/subagents.json)：真实双进程/SDK/工具调用；fauxProvider给出预置响应。
- [部分失败](/Users/bloks/bzdev/playground/hello-pi/verification/advanced/subagents-partial-failure.json)：一项失败没有被汇总为全部通过。
- [Durable](/Users/bloks/bzdev/playground/hello-pi/verification/advanced/durable.json)：真实1.1.0任务、JSONL存储、SIGKILL及新进程恢复；不是模型驱动对话或外部通知实验。
- 运行入口：`npm run check:advanced`。在线Subagent脚本另行提供，本次未执行；未读取私人认证或调用真实provider。
- Codemode 运行时补充：`https://github.com/earendil-works/pi/blob/v1.1.0/packages/codemode/src/runtime/host.ts`；类型：`https://github.com/earendil-works/pi/blob/v1.1.0/packages/codemode/src/types.ts`。


## 6. 控制面主线版补充验证

<a id="l03"></a>
### L03 · Steering / Follow-up 的本地时序证据

- 源码：[steering.mjs](/Users/bloks/bzdev/playground/hello-pi/demo/advanced/steering.mjs)；报告：[steering.json](/Users/bloks/bzdev/playground/hello-pi/verification/advanced/steering.json)。
- 入口：`npm run demo:steering`，已加入 `npm run check:advanced`；进阶检查现在为 7 组。
- 真实执行 Pi 1.1.0 的 Agent core loop、队列、事件与内存工具；分别验证 sequential / parallel 两种批次。
- 在 A 运行中先排入 Follow-up 再排入 Steering。两个工具都结束、turn_end 之后才交付 Steering；第 2 次请求包含纠偏且没有 Follow-up；当前工作收尾后第 4 次请求才包含 Follow-up。
- 使用官方 faux core provider 的预置响应，每种模式 4 次 fixture 请求，真实模型请求 0。直接核心 API，无 SDK 资源发现、个人认证、TUI、热加载或外部操作。
- 证明消息交付位置，不证明模型服从、取消能力、外部回滚或权限隔离。所有工具只记录内存事件。
- 参考实现：`https://github.com/earendil-works/pi/blob/v1.1.0/packages/agent/src/agent-loop.ts`；测试 provider：`https://github.com/earendil-works/pi/blob/v1.1.0/packages/ai/src/providers/faux.ts`。

### 稿件整合的边界

- 附件提供叙事与主题参考，不作为固定版本 API 的优先事实来源；没有执行其中的安装命令，也没有将构造的开场改写成讲者亲历。
- 维持 1.1.0 演示基线，不将 Pi 1.0 的发布叙事当作当前功能全貌。不复制缺少测量条件的 token 百分比或全称式竞品比较。
- AGENTS.md / 扩展热更新属于文档机制与可选 TUI 彩排；本轮新增的 Steering 测试不覆盖它，不能混写成实测。
