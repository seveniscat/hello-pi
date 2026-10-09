# 控制面主线版：问答卡与反例练习

基线：2026-10-09 / Pi 1.1.0。以下区分产品事实、教学设计和工程建议；引用索引见来源登记表。

## 十八个优先问题

### 1. 这场分享到底为什么选 Pi，而不是再讲一次 AI 编程？

Pi 是方便打开、观察和改造的 Agent Harness 样本。我们借它建立输入、工具、历史、介入时机和恢复的判断标准；这些标准也可以用于评价其他工具。不要求听众换产品，不是“Pi 的模型更聪明”，也不是只有 Pi 才能提供这些能力。〔证据：[O02](/Users/bloks/bzdev/playground/hello-pi/research/source-register.md#o02)、[O08](/Users/bloks/bzdev/playground/hello-pi/research/source-register.md#o08)、[O12](/Users/bloks/bzdev/playground/hello-pi/research/source-register.md#o12)〕

### 2. 为什么不把所有要求都写进一份长提示词？

方法说明仍然重要，但可执行逻辑与自然语言约定不同。模板减少重复输入，Skill 提供任务方法，Extension 提供运行时入口。能用简单说明解决的事，不必急着写代码；需要确定执行、状态或程序接入时，再选择相应接口。〔证据：[O06](/Users/bloks/bzdev/playground/hello-pi/research/source-register.md#o06)、[O07](/Users/bloks/bzdev/playground/hello-pi/research/source-register.md#o07)、[O08](/Users/bloks/bzdev/playground/hello-pi/research/source-register.md#o08)〕

### 3. Virtual Model 是把几个模型训练成一个模型吗？

不是。它为一次请求选择实际模型与思考等级，选择的虚拟名称与实际派发目标是两个概念。本例测试路由回调，没有实际 provider 调用；不能据此宣称质量不降或成本下降。〔证据：[O19](/Users/bloks/bzdev/playground/hello-pi/research/source-register.md#o19)〕

### 4. 为什么路由例子不在每次工具调用后换模型？

本例有意维持同一轮工具后续与重试的模型连续性。官方文档提醒切换模型可能影响缓存与思考签名。你可以设计不同策略，但应该用真实任务评估，而不是把频繁切换本身当亮点。〔证据：[O19](/Users/bloks/bzdev/playground/hello-pi/research/source-register.md#o19)〕

### 5. 会话分支和 Git 分支有什么关系？

不是同一层。会话导航决定当前上下文的路径，不保证磁盘文件、数据库或外部服务回到同一时刻。我们的 SessionManager 演示实际验证了导航后临时文件仍保持修改后的内容。〔证据：[O04](/Users/bloks/bzdev/playground/hello-pi/research/source-register.md#o04)、[L02](/Users/bloks/bzdev/playground/hello-pi/research/source-register.md#l02)〕

### 6. Codemode、MCP、Subagent 的区别是什么？

MCP 是工具与资源的接入方式；Codemode 让代码组合工具调用和处理结果；Subagent 是把任务交给另一套角色、上下文与执行实例的组织方式。工具编排不等于 agent 分工，二者可以组合。〔证据：[O10](/Users/bloks/bzdev/playground/hello-pi/research/source-register.md#o10)、[O11](/Users/bloks/bzdev/playground/hello-pi/research/source-register.md#o11)、[O20](/Users/bloks/bzdev/playground/hello-pi/research/source-register.md#o20)〕

### 7. 两个本地工具的 Codemode 演示验证了 MCP 吗？

没有，除非实际建立了 MCP 连接。本演示会明确列出工具接线方式。真实执行官方 Codemode 运行时，可以证明脚本、工具调用和结果处理机制；不能顺带宣称验证了 MCP 传输、认证或服务端兼容性。

### 8. Subagent 是 Pi 的内置命令吗？

不是一种固定的内置工作流。终端 Pi 官方提供扩展示例，也可以用 SDK 或子进程构建。讲者必须说出本例究竟采用哪种方式，不把自己写的协调脚本冒充 `/subagent` 内置命令。〔证据：[O20](/Users/bloks/bzdev/playground/hello-pi/research/source-register.md#o20)〕

### 9. 独立上下文是不是意味着安全隔离？

不是。独立 session / 子进程不自动隔离文件、凭据和网络；多个 worker 如果共享可写目录，仍然可能相互影响。只读工具选择也不等于 OS 沙箱。需要按真实威胁模型安排环境边界。〔证据：[O13](/Users/bloks/bzdev/playground/hello-pi/research/source-register.md#o13)、[O20](/Users/bloks/bzdev/playground/hello-pi/research/source-register.md#o20)〕

### 10. 多 agent 会比单 agent 更好吗？

本资料没有这样的对照证据。任务能独立准备输入、结果有清楚契约时，分工值得试；高度共享背景、反复交接的任务可能增加成本。先看失败率、返工、人工审查、调用成本和总体耗时，不以并行窗口数量作为效果指标。

### 11. 离线使用 fixture，演示还有什么意义？

可以独立检查连接、状态、数据范围和失败处理。例如两份上下文是否真的不同、路由是否选错、框架是否重跑了某一步。它不能证明模型推理正确，也不能作为任务质量基准。讲者必须在输出前指出替身的位置，而不是等提问后才承认。

### 12. Durable 就是把聊天写到 JSONL 吗？

不是。终端会话历史与长运行任务的调度、持久状态和恢复不是同一层。Durable 是另一个实验性框架；具体恢复保证取决于使用的存储、任务层与工具重放语义。〔证据：[O04](/Users/bloks/bzdev/playground/hello-pi/research/source-register.md#o04)、[O15](/Users/bloks/bzdev/playground/hello-pi/research/source-register.md#o15)、[O21](/Users/bloks/bzdev/playground/hello-pi/research/source-register.md#o21)〕

### 13. Durable 演示没有模型调用，能说明什么？

能说明所演示的持久任务、存储和恢复机制；如果实际跨进程运行，也能检查恢复前后的执行次数。不能自动推出 agent 在真实 provider 中断后一定给出正确决策，更不能把低层任务演示说成完整 agent 应用验收。

### 14. requestId 去重等于通知不会重复吗？

不等于。相同 conversation 下的提交去重，与外部通知副作用是不同范围。外部服务已接受但本地确认未保存时，仍需要核对或有效的业务幂等机制。〔证据：[O16](/Users/bloks/bzdev/playground/hello-pi/research/source-register.md#o16)、[O17](/Users/bloks/bzdev/playground/hello-pi/research/source-register.md#o17)、[O18](/Users/bloks/bzdev/playground/hello-pi/research/source-register.md#o18)〕

### 15. 有了 /verify 是否就能放心提交或发布？

没有。它是一个验证入口，不是不可绕过的门禁，代码之后也可能再次变化。正式要求应在真正掌握提交、发布和权限的系统里落实；本例不代替 CI。

### 16. 团队从哪里开始，避免一上来造平台？

建议先选一个验收明确的低风险任务，只改变一个控制点：例如结果裁剪、审查分工或模型路由。对照现有方式记录收益和维护成本，再决定是否继续。不要求一次覆盖全部控制点，也不要求先换工具或构建多 Agent 平台。

### 17. Steering 会跳过同一批剩余工具吗？为什么不是急停？

本场固定 Pi 1.1.0：当前 turn 及其工具批次完成后，循环才读取 Steering；Follow-up 等当前工作没有更多工具或 Steering 待处理时再交付。已实跑的顺序/并行两种模式都显示 A、B 完成后才交付纠偏，Follow-up 虽先排入却更晚交付。取消是另一条路径，已发生的副作用不会被排队消息撤销。〔证据：[O05](/Users/bloks/bzdev/playground/hello-pi/research/source-register.md#o05)、[L03](/Users/bloks/bzdev/playground/hello-pi/research/source-register.md#l03)〕

演示模型响应是预置的，证明的是交付时机，不是模型一定服从，也不是 TUI 按键测试。

### 18. AGENTS.md 能 diff、能重新加载，为什么还不算安全控制？

可编辑规则让输入来源更可检查；它不能约束进程实际权限，也不能证明模型每次遵守。模型、配置、依赖和动态数据仍会影响可复现性。需要禁止某类操作时，要在工具执行与运行环境落实有效边界，不能用一句“禁止修改”代替。热更新的真实 TUI 与模型行为在本资料中仍未彩排。〔证据：[O08](/Users/bloks/bzdev/playground/hello-pi/research/source-register.md#o08)、[O13](/Users/bloks/bzdev/playground/hello-pi/research/source-register.md#o13)〕

---

## 90 分钟版的七个扩展动作

与主稿附录严格对应：2 + 2 + 2 + 3 + 2 + 2 + 2 = **15 分钟**。先让听众预测，再展示反例，不重新讲一遍所有功能。

### A｜场景一 +2 分：模型路由的连续性

高档位用户请求选 planner；工具结果回来时，界面档位已是 low。是否马上换 builder？

本例不换，continuation 使用 previous。请指出这是教学策略，不是所有任务的最佳答案；真实采用还需检查模型兼容、缓存、成本与效果。

### B｜场景二 +2 分：少一个过滤条件会怎样？

数据中存在“已经完成，但历史检查失败”的任务。去掉 status !== 'done'，T-103 会被错误返回。使用脚本已有的 missingDoneFilterResult，不必临场修改教材。

目标：反例必须真实改变结果，不能把“程序没报错”当作正确。

### C｜场景三 +2 分：修一份丢掉约束的摘要

坏摘要：“已经修好，可以发布。”

参考改写：“只排除 archived:true；缺省也计入。本次不改测试。五项测试通过，样例输出4/1/1/2。未验证非法输入或发布流程，不代表发布授权。”

指出这仍是课堂手写摘要，不是自动摘要质量证明。

### D｜场景四 +3 分：先预测，再看队列时序

工具 A/B 在同一 turn 中。A 执行时先排入 Follow-up，再排入 Steering。请预测：B 会不会执行？哪类消息先进入后续请求？改为并行工具后，哪些相对顺序可以变，哪些不能变？

验证：A/B 都结束后才能交付 Steering；A/B 相互结束顺序可以改变。Follow-up 等当前工作收尾。展示 demo:steering 的两个 cases 与 requests，不把预置响应解释成真实模型遵从。

### E｜长跑段 +2 分：一个 Subagent 失败

运行已备好的 demo:subagents:failure，直接看 complete:false、成功角色与失败角色；不从头展开 SDK 代码。父任务不能宣称两项都通过。模型仍是 fixture，验证的是失败汇总。

### F｜长跑段 +2 分：通知已发，记录未保存

讨论能否按稳定操作 ID 查询外部结果；没有查询或幂等语义时，如何保留不确定状态、交给人核对？这是故障推演，不是本地真实通知实验，不能用 requestId 包装成端到端 exactly-once。

### G｜收束 +2 分：只改变一个控制点

每位听众补完：“我想改变 Agent 的____，因为现在在____处反复失败；我通过____验收，并记录____维护成本。”

不要写“全面自动化研发”。把判断标准落到一个可以比较的小实验。
