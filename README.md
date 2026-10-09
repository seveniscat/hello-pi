# Pi 技术分享｜控制面主线版

## 分享主题

> **控制面在谁手里？——用 Pi 理解并改造 Agent 的工作方式。**

以四种真实工作中可能遇到的失控为线索：行为漂移、工具挤满上下文、试错污染主线、跑歪后难以插手。每个问题之后立即检查机制与证据，最后讨论分工、长跑恢复和工程责任。

**不是五个功能的产品介绍，也不要求听众换工具。** 目标是带走评价 Agent 的五个问题，并选择一个低风险控制点做试验。基础压缩到 4 分钟，Subagent 在主版本只讲 2 分钟，Steering 加入真实队列演示。

主版本 **75 分钟，包含 10 分钟问答**；另有 60/90 分钟安排。资料基准：2026-10-09 / Pi 1.1.0 / Node.js 22.19.0。固定版本，不在台上安装或升级。

## 讲者入口

1. [完整讲稿](/Users/bloks/bzdev/playground/hello-pi/talk/pi-sharing-manuscript.md)：四个场景、穿插演示、五问检查表与试点。
2. [演示手册](/Users/bloks/bzdev/playground/hello-pi/talk/demo-runbook.md)：实际组件、预置部分、命令与失败兜底。
3. [上台提示卡](/Users/bloks/bzdev/playground/hello-pi/talk/presenter-cue-sheet.md)：每段唯一问题和排障硬截止。
4. [问答与反例练习](/Users/bloks/bzdev/playground/hello-pi/talk/qa-and-exercises.md)：18 个问题与 90 分钟版加时。
5. [来源与验证记录](/Users/bloks/bzdev/playground/hello-pi/research/source-register.md)：固定版本、事实冲突和本地证据。

## 75 分钟安排

| 段落 | 时间 | 分钟 | 内容 |
|---|---|---:|---|
| 0 开场 | 00:00–04:00 | 4 | 一个构造情境，四种失控 |
| 1 最小共同语言 | 04:00–08:00 | 4 | Agent 循环与贯穿样例，不现场修 bug |
| 2 场景一 | 08:00–20:00 | 12 | 输入来源、规则、/verify 与模型路由 |
| 3 场景二 | 20:00–32:00 | 12 | 工具暴露、Codemode 调用与结果筛选 |
| 4 场景三 | 32:00–40:00 | 8 | 会话分支、显式摘要与文件不回滚 |
| 5 场景四 | 40:00–48:00 | 8 | Steering / Follow-up 的真实交付时机 |
| 6 从交互到长跑 | 48:00–59:00 | 11 | 2 分钟 Subagent；9 分钟 Durable |
| 7 自由与责任 | 59:00–63:00 | 4 | 权限、维护、成本与副作用边界 |
| 8 尺子与试点 | 63:00–65:00 | 2 | 五问检查表与一个小实验 |
| 9 问答 | 65:00–75:00 | 10 | 根据实际约束讨论 |

## 一键检查

```bash
cd /Users/bloks/bzdev/playground/hello-pi
npm test
npm run check:advanced
npm run check:docs
```

进阶演示使用已安装的 Pi **1.1.0**；可用 `PI_PACKAGE_DIR` 指定该版本的包目录。Durable 使用独立运行目录，首次准备：

```bash
npm ci --prefix demo/advanced/runtime --ignore-scripts --no-audit --no-fund
```

此准备命令可能访问 npm。本机依赖与 lockfile 已保留，不修改全局 Pi，不运行安装生命周期脚本，不在台上执行。

## 按主线运行

```bash
npm run demo:router
npm run demo:codemode
npm run demo:sessions
npm run demo:steering
npm run demo:durable
```

Subagent 保留为 90 分钟加时或课后材料，不在 75 分钟主场展开：

```bash
npm run demo:subagents
npm run demo:subagents:failure
```

默认显示台上关键结果；完整证据保存在 `verification/advanced/`。命令前加 `PI_TALK_VERBOSE=1` 可显示完整 JSON。详细验证命令仍会运行全部演示，即使某段不在主场展示。

## 已验证和未验证，不能混说

- **基础**：10 项教材与 `/verify` 检查；参考修复由人工准备，TUI 没有实测。
- **进阶**：7 组程序检查，包括 Steering 的 sequential / parallel 两种模式。
- **路由**：真实回调，模型目录为 fixture，没有真实派发或成本测试。
- **Codemode**：真实 QuickJS 与本地宿主工具；无 MCP 连接，无模型生成代码。
- **会话**：真实 SessionManager；消息与摘要手写，不是模型摘要质量评测。
- **Steering**：真实 core loop 与队列；预置模型响应。验证当前 turn / 工具批次结束后才交付纠偏，不证明模型服从，也不是急停。
- **Subagent**：真实双进程、SDK 和工具；模型响应是官方 fauxProvider fixture。
- **Durable**：真实 Harness、JSONL 存储、SIGKILL、新进程恢复；A=1/B=2。无模型或外部通知实验。
- **尚未完成**：真实 provider、TUI、AGENTS.md 热更新交互、MCP 传输、静态 TypeScript 检查及模型质量对照。联网 Subagent 脚本仅做语法检查，本轮未执行。

## 归档与分发

- [亮点优先旧稿](/Users/bloks/bzdev/playground/hello-pi/talk/archive/highlights-first-v2.md)：保留原“五类机制”组织方式，不与本版时间安排混用。
- [基础入门旧稿](/Users/bloks/bzdev/playground/hello-pi/talk/archive/basics-first-v1.md)：用于另外的入门培训。
- 本轮更新项目 Markdown 材料，未覆盖提供参考的 Word 文件，也未生成 PPT。
- 不分发 `node_modules/` 或 `.rehearsals/`，后者以后可能含认证与会话。迁移资料时需更新绝对路径链接。
