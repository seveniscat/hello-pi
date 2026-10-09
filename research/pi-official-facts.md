# Pi 官方事实备忘（仅作 grilling 访谈输入）

访问日期统一为 **2026-10-09，Asia/Shanghai**（任务指定本地日期）。只核查官方文档、发行记录、包元数据及固定版本源码；未安装或运行 Pi，未读取本机凭据、修改全局设置。以下不是讲稿或分享提纲。

## 产品与版本

Pi 定位为终端中的可扩展 AI agent/harness，协调模型、文件及命令，可用于编码以外的多步任务。当前官方仓库为 `earendil-works/pi`，包为 `@earendil-works/pi-coding-agent`。[^1][^2]

GitHub latest 与 npm `latest` 均为 **1.1.0**。官网发行页标 **2026-10-07**；GitHub API 的 `published_at=2026-10-07T22:26:31Z`，即上海 **10 月 8 日 06:26:31**。npm 发布时间为 `2026-10-07T22:16:26.802Z`：不同发布事件，不是版本冲突。npm 另保留 `legacy-node20=0.74.2`，不能当作最新版。[^2]

独立确认首页确有 Pi 1.0 / Pi Durable 横幅；它对应 **2026-10-01** 公告，不表示当前仍是 1.0。Durable 是另行发布的实验性持久 agent 框架，不替代终端 coding agent。[^1][^3]

## 核心运行机制

消息进入活动分支 → 组合系统提示、上下文、工具声明与模型设置 → 模型流式返回文本/工具调用 → 执行并记录结果 → 必要时继续下一轮；不是单次聊天补全。[^4]

默认启用 `read/bash/edit/write`；另有可选 `powershell/grep/find/ls`，不能说“总共只有四个工具”。Codemode、tool_search 由内建扩展注册但初始不激活，MCP 配置可自动激活它们。[^5][^11]

会话是带父子关联的 JSONL 树；模型读取活动分支，而非全部分支。`/tree` 在原文件分支，`/fork` 新建会话；压缩以摘要减少后续请求上下文，不删除原始历史。[^6]

## 扩展机制的边界

- **Templates**：Markdown 参数化提示，`/name` 展开成输入；**Skills**：`SKILL.md` 加脚本、参考资料，启动时仅披露摘要，正文按需读取，也可 `/skill:name` 强制加载。两者不等于运行时插件。[^7][^8]
- **Extensions**：进程内 TypeScript/JavaScript，可注册工具、事件、命令、provider、UI；**Packages**：通过 npm/git/本地目录分发扩展、技能、提示、主题的容器，并非新执行权限层。[^9][^10]
- **MCP**：现已内建，接 stdio 或 streamable HTTP 的工具/资源，不支持旧 SSE；默认工具 exposure 为 codemode，可改 direct/deferred/hidden。[^11]
- **Codemode**：QuickJS 中组合、并行调用及筛选工具结果；无直接 Node、文件系统、网络 API，但调用工具是真实操作，失败不会撤销先前副作用。[^12]
- **SDK/RPC**：前者在 Node/Bun 进程内用 TypeScript 管理会话，后者以 stdin/stdout JSONL 控制独立 Pi 子进程，不是 MCP。SDK 默认不加载内建扩展，MCP/Codemode 需显式接入资源加载器。[^13][^14][^11]

## 安全默认值及旧说法

没有默认逐工具审批或内建操作系统沙箱；工具、扩展继承 Pi 进程权限，工作目录不是访问边界。项目信任默认 `ask`，控制项目资源加载；非交互模式无既有批准时默认跳过受保护资源。但拒绝信任后 `AGENTS.md` 等上下文仍会加载，`sessionDir` 甚至先于信任读取。**项目信任、Codemode 解释器沙箱均不等于整机隔离。**[^15][^12]

“Pi 不支持 MCP”已过时：**0.99.0，2026-09-29** 引入内建 MCP/Codemode；“无内建 sub-agents/plan mode”仍见当前首页，可用扩展实现。[^16][^17]

确有文档冲突：首页称 steering 在当前工具后介入并中断剩余工具，详细文档/SDK 则称当前 turn 及工具调用完成后。**v1.1.0 源码先 await 工具批次、再取 steering，支持后者**；不可沿用首页的中断承诺。[^17][^4][^13][^18]

## 三个演示候选及前提（不作最终选择）

1. **会话分支与压缩**：预置多轮无敏感会话、可用模型；比较活动分支和保留历史，不将会话导航当文件回滚承诺。[^6]
2. **扩展热重载**：准备审阅过的无外部依赖本地 TS 命令或状态显示；项目级扩展须获信任，修改后 `/reload`，不必先发布 npm 包。[^9]
3. **Codemode 编排只读 MCP 查询**：准备可达、已审阅的 stdio/HTTP 服务及必要认证、最小权限数据；确认工具曝光和 Codemode 已启用，再比较批量调用与筛选结果。[^11][^12]

共同前提：可用 Pi 与模型连接；若用 npm 路径，1.1.0 声明 Node **≥22.19.0**。本机安装版本、账号、网络、费用和现场稳定性均未测试；`latest` 文档会漂移，演示前应按锁定版本复核。候选不代表排序、时长分配或选型决定。[^2]

## 第一手来源（以上统一访问日期适用）

[^1]: [官方文档首页](https://pi.dev/docs/latest)；[官网首页](https://pi.dev/)。
[^2]: [官方 1.1.0 发行说明](https://pi.dev/changelog/releases/1.1.0)；[GitHub latest](https://github.com/earendil-works/pi/releases/latest)（本次指向 [v1.1.0](https://github.com/earendil-works/pi/releases/tag/v1.1.0)）；[GitHub Release API](https://api.github.com/repos/earendil-works/pi/releases/latest)；[npm 完整元数据](https://registry.npmjs.org/@earendil-works/pi-coding-agent)（dist-tags/time）；[npm latest 元数据](https://registry.npmjs.org/@earendil-works/pi-coding-agent/latest)（version/engines）。API 与完整 npm JSON 另经现有 Python 标准库只读抓取，未下载或执行包。
[^3]: [Pi 1.0 公告](https://earendil.com/posts/pi-1-0/)；[Pi Durable 公告](https://earendil.com/posts/pi-durable/)。
[^4]: [How Pi Works](https://pi.dev/docs/latest/how-pi-works)。
[^5]: [Settings：Tools / Resources](https://pi.dev/docs/latest/settings#tools)。
[^6]: [Sessions and Context](https://pi.dev/docs/latest/sessions)；[Session File Format](https://pi.dev/docs/latest/session-format)。
[^7]: [Prompt Templates](https://pi.dev/docs/latest/prompt-templates)。
[^8]: [Skills](https://pi.dev/docs/latest/skills)。
[^9]: [Extensions](https://pi.dev/docs/latest/extensions)；[官网热重载说明](https://pi.dev/#change-the-harness-not-your-workflow)。
[^10]: [Pi Packages](https://pi.dev/docs/latest/packages)。
[^11]: [MCP Servers：transports / exposure / permissions / SDK](https://pi.dev/docs/latest/mcp)。
[^12]: [Codemode：Scripts / Call tools](https://pi.dev/docs/latest/codemode)。
[^13]: [SDK](https://pi.dev/docs/latest/sdk)。
[^14]: [RPC Protocol](https://pi.dev/docs/latest/rpc)。
[^15]: [Run Pi Safely](https://pi.dev/docs/latest/security)；[默认信任设置](https://pi.dev/docs/latest/settings#interaction)。
[^16]: [0.99.0 发行说明](https://pi.dev/changelog/releases/0.99.0)；[官方解释为何改为内建 MCP](https://earendil.com/posts/you-said-no-mcp/)。
[^17]: [官网首页：Steer or follow up / What we didn't build](https://pi.dev/)。
[^18]: [v1.1.0 固定源码 agent-loop.ts](https://github.com/earendil-works/pi/blob/v1.1.0/packages/agent/src/agent-loop.ts#L244-L298)；[同版 raw 源码](https://raw.githubusercontent.com/earendil-works/pi/v1.1.0/packages/agent/src/agent-loop.ts)。顺序为 `await executeToolCalls` → `turn_end` → `getSteeringMessages`。
