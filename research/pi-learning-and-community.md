# Pi 学习材料与社区实践：有界研究备忘

调研基准：2026-10-09，Asia/Shanghai。仅供 60–90 分钟技术分享的 grilling 访谈使用，不是讲稿或结构建议。指定链接已用 web.run 阅读；提交日期另用 GitHub API 只读核对。未安装软件、授权账户或运行来源代码；下述“演示前提”是待完成条件，不代表已经实测。

## 一、指定材料与产品时期

**Pi School**：Zeke Sikelianos（GitHub：zeke）创建、维护的免费开源自学课程；About 明示是社区项目，非 Earendil Works 官方产品。现有 15 课、11 个练习，覆盖安装、访谈、信任、指令、模型、上下文、会话/分支、Skills、Tools、MCP、Code mode、扩展和图像；安装后主要在 Pi 内交互学习，不能把目录当成一场分享的天然大纲。[S1]

站点没有单一发布日期。仓库初始计划提交为 **2026-07-20**（不是公开开课日证明）；**2026-10-06** 的 `dd1c302` 明确更新至 Pi 1.0，同日 `54b8d42` 新增 MCP、Code mode 课程。因此它始于 1.0 前，但本次看到的已是 1.0 后内容，不能统称“旧教程”。作者与日期以提交记录核验。[S2]

**Pi Durable**：文章日期 **2026-10-01**，页面署名 **Earendil Engineering**；同日 Pi 1.0 公告说明详文由 Mario 撰写。这里的 durable 确实指新包 `@earendil-works/pi-durable`，是构建长运行 agent 应用的实验性 harness，不是对普通 Pi 的形容词，也不替代终端 coding agent。[S3][S4]

文中机制包括任务检查点、重开同一存储后恢复、工具的安全重放声明；不安全的中断调用会被报告给模型，而非无条件重做。`requestId` 的 exactly-once 针对提交去重，不能外推为任意外部副作用只执行一次。文章明确 API 仍可能变化，故不宜包装成成熟通用“持久执行框架”。[S3]

**历史陷阱**：Armin 的 2026-01-31 文章说 Pi 没有 MCP；2026-10-01 官方公告已加入原生 MCP/Codemode。保留旧帖的工作流经验，但旧功能清单不得当作当前能力；最新版本全貌交由另一调研负责。[S4][S5]

## 二、四条社区一手经验候选

以下均为作者实践，不是官方效果承诺；风险与演示建议为本备忘评估。

### 1. 分支处理临时任务，再带摘要返回

**来源/日期**：Armin Ronacher，2026-01-31；他用会话分支修复工具，再回到原任务，也用新审查上下文做 review。[S5]
**场景**：实现中冒出调试支线，或比较两种方案。
**代价/风险**：摘要可能漏信息；不能据此假定文件也被回滚，需另备 Git 恢复点。
**演示前提**：一个可丢弃仓库、已有分叉会话；先验证所用版本的 `/tree`。当前课程明确摘要在“切换分支”时提供，而非仅打开树时，演示脚本不可混淆。[S6]

### 2. 自然语言访谈后，用 `/answer` 收集答案

**来源/日期**：同一作者 2026-01-31 的实践帖；当前仓库仍有 `answer.ts`，会提取上一条回复中的问题并显示回答界面。[S5][S7]
**场景**：需求澄清、设计评审，保留解释但减少逐题复制。
**代价/风险**：代码另调用模型提取问题，有延迟、调用成本与漏题风险；它不是内置命令。
**演示前提**：提前审阅、固定扩展版本，确认交互终端和可用模型；用无敏感信息的三问样例人工比对。代码可读不等于已证实兼容当前 Pi。[S7]

### 3. 先做独立 CLI，再加薄的 Pi 界面

**来源/日期**：Julian Prokay，2026-02-15，文章另有 2026-04 更新说明。他的 `pic` 用 SQLite 保存 Epic→Task→清单，Pi 的 `/task` 只负责呈现 CLI 输出。[S8]
**场景**：团队已有内部命令，想加入可交互的任务管理而不绑死在 agent 界面。
**代价/风险**：要维护 CLI、数据结构和适配层；作者未提供通用收益测量。
**演示前提**：先有可复现的独立 CLI、假任务数据库与薄扩展；本文是架构经验，不是可直接安装的官方方案。

### 4. 用隔离边界降低误操作影响，不许诺绝对安全

**来源/日期**：Colin Jermain，2026-05-12，因未跟踪文件被误删而制作 `pi-less-yolo`；本次仓库仍说明 Docker 挂载和只读模式。[S9]
**场景**：阅读陌生仓库、受控展示文件访问边界。
**代价/风险**：容器配置成本；可写 Pi 配置可能持久化恶意扩展，网络仍可外联，作者明确不作安全保证。
**演示前提**：事先准备容器、隔离配置和假秘密文件，核对挂载及凭据；不临场安装、不转发真实 SSH agent，不把只读项目等同于无风险。[S9]

## 三、回交访谈的关键歧义

优先请用户决定：听众要“会使用与定制 Pi”，还是“理解并构建长期运行 agent 应用”？两处指定材料分别偏向这两个目标。是否纳入实验性 Durable、是否愿意承担扩展与容器的演示准备，尚未决定；不得据本备忘自动确定最终结构。

## 一手出处

- [S1] [课程首页](https://pi-school.ziki.boo/)；[About 的非官方声明](https://pi-school.ziki.boo/about/)。
- [S2] [初始计划，80ef774](https://github.com/agentschools/pi-school/commit/80ef77443bca42ac28831a6b682de2e21fa86ab1)；[Pi 1.0 更新，dd1c302](https://github.com/agentschools/pi-school/commit/dd1c302127a0b1cf1e0723fea78d33b591dc4e05)；[新增两课，54b8d42](https://github.com/agentschools/pi-school/commit/54b8d42bb2a4dde1c1480872a95e4954d80bdd35)。日期核验端点：[GitHub 提交 API](https://api.github.com/repos/agentschools/pi-school/commits?per_page=100)。
- [S3] [Pi Durable，2026-10-01](https://earendil.com/posts/pi-durable/)。
- [S4] [Pi 1.0，2026-10-01](https://earendil.com/posts/pi-1-0/)。
- [S5] [Armin：Pi: The Minimal Agent Within OpenClaw，2026-01-31](https://lucumr.pocoo.org/2026/1/31/pi/)。
- [S6] [Pi School：Branching](https://pi-school.ziki.boo/lessons/branching/)。
- [S7] [Armin 的 answer.ts 源码](https://github.com/mitsuhiko/agent-stuff/blob/main/extensions/answer.ts)（main 为浮动引用，演示前须固定提交）。
- [S8] [Julian：pi: The Coding Agent For Your Workflow，2026-02-15](https://jprokay.com/post/018-pi-coding-agent)。
- [S9] [Colin 本人实践文章，2026-05-12](https://www.linkedin.com/pulse/what-i-learned-making-my-coding-agent-less-yolo-colin-jermain-igbme)；[作者仓库及安全边界](https://github.com/cjermain/pi-less-yolo)（main 为浮动引用）。
