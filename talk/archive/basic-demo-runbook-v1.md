# Pi 技术分享：演示手册与故障兜底

基线：Pi **1.1.0**，Node **22.19.0**，macOS / Linux shell。Windows 用户建议使用自己事先验证过的等效终端环境，不把本手册的 shell 命令当作已验证的 Windows 步骤。

## 先区分三个状态

| 项目 | 本次状态 |
|---|---|
| 示例失败、参考修复、CLI 输出 | **已实际运行验证** |
| Pi 1.1.0 真实扩展加载器 + 真实进程执行 | **已验证 FAIL / PASS**；没有模型调用 |
| 真实模型完成修复、TUI 操作、`/reload` 的界面表现 | **待讲者彩排** |
| 模型账号、网络、配额、费用 | **未检查，也未读取凭据** |
| MCP / Codemode / Durable 运行 | **不在本场现场演示范围，未执行** |
| 模型演示录像 | **尚未录制**；不能拿参考修复伪装为模型录像 |

已准备的兜底是可运行参考修复、真实测试输出与实际 CLI 结果，不是假对话。

## 1. 目录与动作范围

```text
hello-pi/
├── demo/starter/                 # 故意保留一个缺陷的原始教学样例
├── demo/reference/               # 讲者参考答案，不放进演示副本
├── demo/resources/.pi/           # 审阅后加载的小扩展、模板与 Skill
├── scripts/prepare-demo.mjs      # 创建唯一的新副本，不覆盖旧目录
├── scripts/verify-workshop.mjs   # 同时检查“应失败”和“应通过”
├── verification/                # 本次真实运行结果
└── .rehearsals/                  # 临时演示副本；不要作为分享资料外发
```

示例的输入约束：有效的 Task 数组，status 为三个已知值，archived 为布尔或缺省。**没有生产级运行时 schema 校验。** Node 的类型擦除不等于 `tsc` 静态检查。

修复验收边界是公共 `summarize` 行为和 CLI 样例输出，不断言实现必须使用哪个内部函数。

## 2. 分享前至少一天：离线检查

从本工作区根目录执行：

```bash
cd /Users/bloks/bzdev/playground/hello-pi
ROOT="$PWD"
node --version
pi --version
npm test
```

本机结果：10 项检查通过，包括初始 **4 pass / 1 fail**、参考修复 **5 pass / 0 fail**、CLI 输入/输出、扩展的空闲/目录/中止分支，以及真实 Pi 加载/执行的两条路径。

`npm test` 在工作区根目录验证整套教学资料，预期退出码是 0。**进入 starter 运行 `npm test` 则预期失败，这是故障教材的设计，不要误认为资料坏了。**

没有第三方业务依赖，不需要在示例里 `npm install`。验证脚本若找不到全局 npm 安装的 **Pi 1.1.0**，会明确跳过真实加载器检查并写入 report 的 limits；不能把这种结果说成完整 10 项验证。

如果机器尚无合适的 Pi，先审阅官方安装说明，再由讲者自行选择安装。为了复现本讲稿，使用锁定版本，而不是临场升级 `latest`。下面是可选安装命令，**本次未执行**：

```bash
npm install -g @earendil-works/pi-coding-agent@1.1.0
```

已有其他版本的用户不要未经评估就覆盖自己的日常安装。可另备演示环境，并在环境中重复上述检查。

## 3. 准备独立的演示配置，不复制个人凭据

建议使用专门的演示 profile。以下动作会在本工作区的忽略目录中创建配置位置，但本次只提供步骤，**没有读取或复制讲者的现有认证文件**。

```bash
mkdir -p "$ROOT/.rehearsals/pi-agent-profile"
export PI_CODING_AGENT_DIR="$ROOT/.rehearsals/pi-agent-profile"
```

- 由讲者在这个 profile 中使用 Pi 的正常登录/模型选择流程准备好获准使用的模型。
- 若选择环境变量认证，遵循 provider 官方要求；不要把真实密钥写进讲稿、命令参数、截图或源码。
- 不从原有 profile 复制 `auth.json`，不展示认证文件，不在录屏时打印环境变量。
- **`.rehearsals/` 之后可能含认证、会话和模型数据。即使被 Git 忽略，也不能打包外发。**
- 使用 `--no-context-files` 等显式开关避免自动引入个人上下文；这些开关不是 OS 隔离。
- `--no-extensions` 对显式 `-e` 指定的扩展保留加载能力，是演示二刻意使用的行为。

## 4. 准备演示一：永远用新副本

```bash
DEMO="$(node "$ROOT/scripts/prepare-demo.mjs" broken)"
printf '演示目录：%s\n' "$DEMO"
cd "$DEMO"
npm test
npm run demo
```

不要在连续命令链里使用 `npm test && npm run demo`，因为第一步故意失败，会阻断第二步。

预期：

```text
测试：tests 5 / pass 4 / fail 1
失败：missing archived defaults to active (mixed fixture)
CLI：total 2 / open 0 / inProgress 1 / done 1
```

启动演示用 Pi：

```bash
pi --no-extensions --no-skills --no-prompt-templates \
   --no-context-files --no-mcp --approve
```

说明：

- 首条任务明确要求读取 `README.md` 和 `AGENTS.md`，不依赖上下文文件自动发现。启动时不传初始提示或 `@file`，避免在讲者粘贴任务之前自动发起一次模型请求。
- `--approve` 仅用于已经审阅过的这份教学副本，不是建议对陌生仓库关闭审查。
- 默认工具仍可接触进程实际有权访问的环境；“只读当前目录”的提示不是可靠隔离。
- 不设置具体 provider/model 名称：讲者应提前选择团队允许且可用的模型，在同一 profile 中完成一次完整彩排。
- 不在这里打开 MCP、陌生扩展或其他动态资源，避免一个小示例受无关服务影响。

### 粘贴的任务

```text
请修复当前任务统计错误。
先读 AGENTS.md、README.md、src/summary.ts 和 test/summary.test.mjs，并运行 npm test 复现。
遵循 README 的产品规则，只做必要的实现修改；不要更改测试或 fixtures，不增加依赖。
修改后再次运行 npm test 和 npm run demo。
最后报告：根因、具体改动、实际验证结果、尚未验证的边界。
不要读取当前演示目录以外的文件。
```

### 讲者观察清单

- [ ] 模型确实拿到了产品规则，不是仅靠函数注释猜测。
- [ ] 有修改前失败的实际测试输出。
- [ ] 没有改测试、fixtures 或额外安装依赖。
- [ ] 改动满足缺省字段语义；不要求必须逐字等同于参考答案。
- [ ] 修改后重新运行测试，看到 5 pass / 0 fail。
- [ ] CLI 输出 `4 / 1 / 1 / 2`，并与原始五条数据相符。
- [ ] 最终回答没有把未执行的 typecheck、安全检查或线上验证说成已完成。

为了防止模型通过修改验收材料伪造通过，可在外部终端核对：

```bash
diff -u "$ROOT/demo/starter/test/summary.test.mjs" "$DEMO/test/summary.test.mjs"
diff -u "$ROOT/demo/starter/fixtures/tasks.json" "$DEMO/fixtures/tasks.json"
diff -u "$ROOT/demo/starter/src/summary.ts" "$DEMO/src/summary.ts"
```

前两条应无差异。第三条应展示实现变化；`diff` 找到差异的退出码 1 是正常含义，不代表测试失败。

### 时间控制

| 主版本时刻 | 必须发生的事 |
|---|---|
| 12:00 | 进入已经准备好的演示目录 |
| 14:00 | 最迟开始模型修复 |
| 17:00 | 停止等待，必要时切换兜底 |
| 19:00 | 开始总结证据与限制 |
| 20:00 | 回到讲稿，不继续排查现场问题 |

## 5. 演示一失败时的两种兜底

### A. 模型慢、账号或网络不可用，CLI 正常

先停止当前 agent 操作并退出 Pi，确认它不会继续改文件。然后由讲者在外部终端执行：

```bash
cp "$ROOT/demo/reference/summary.fixed.ts" "$DEMO/src/summary.ts"
cd "$DEMO"
npm test
npm run demo
```

这会覆盖**本次 disposable 副本中的一个文件**，不是修改原始 starter。若模型还改了测试或其他文件，不在受污染目录继续证明正确；使用下面的全新 fixed 副本。

```bash
DEMO="$(node "$ROOT/scripts/prepare-demo.mjs" fixed)"
cd "$DEMO"
npm test
npm run demo
```

必须说：“我切换到人工准备的参考修复，接下来现场验证这个答案。刚才的模型运行未完成/没有成功。”

### B. 终端或运行环境也不可用

直接展示工作区 `verification/broken-tests.txt`、`verification/fixed-tests.txt` 和 `verification/sample-outputs.json`。这些是本次本地执行留存，不是该场现场执行的结果。

必须说：“以下是准备阶段的真实运行结果，本场没有重新执行。”不要播放假进度或假 agent 对话。

## 6. 准备演示二：显式加载小扩展

先确认变量 `ROOT`、`DEMO` 与专用 profile 仍然有效。确保演示一的模型操作已停止，再退出到外部终端。

```bash
mkdir -p "$DEMO/.pi"
cp -R "$ROOT/demo/resources/.pi/." "$DEMO/.pi/"
cd "$DEMO"
```

如果仍是演示一的同一个目录、同一个 profile 且已有会话，用：

```bash
pi --continue --no-extensions --no-skills --no-prompt-templates \
   --no-context-files --no-mcp --approve -e .pi/extensions/verify.ts
```

如果刚才换成了没有历史的新 fixed 副本，去掉 `--continue`：

```bash
pi --no-extensions --no-skills --no-prompt-templates \
   --no-context-files --no-mcp --approve -e .pi/extensions/verify.ts
```

在 Pi 中输入：

```text
/verify
```

预期观察：

```text
verify: PASS; exit=0; stopped=false
...
# tests 5
# pass 5
# fail 0
```

如果当前目录仍是未修复版本，则预期 FAIL；**不要把 FAIL 当成扩展没有加载**。区分命令未注册、执行失败、验收失败三个层次。

### 明确解释这份扩展的行为

- 注册 `/verify` **用户命令**，不是注册模型工具。
- 忙碌时拒绝执行，避免与正在修改文件的 agent 操作争用；这不是通用并发安全证明。
- 检查 package name，减少误在别的目录运行；这不是防恶意伪造的安全边界。
- 固定 argv，`cwd` 指向当前教学目录，15 秒超时。
- 判断 `code === 0 && !killed`；被停止不显示 PASS。
- 保存并显示末尾最多 6000 个字符的输出，防止演示会话被完整日志淹没；**生产场景仍需检查输出是否包含敏感信息**。
- `triggerTurn: false` 不自动启动新一轮模型请求；结果留作之后的会话材料。
- 不拦截提交/发布，不阻止以后再次修改代码，不提供系统沙箱，不代替 CI。

### 可选 reload 展示

只在时间允许且提前彩排成功时做：编辑**演示副本** `.pi/extensions/verify.ts` 的通知文字，加上 `demo checked`；输入 `/reload`，再 `/verify`。

不要改原始资源文件；不要临场加新依赖、新工具或网络行为。主版本 44:00 仍未完成就跳过。

### 演示二界面不可用的兜底

展示扩展源文件与 `verification/report.json` 中的两条 `extensionMessages`，说明是**实际加载器 + 进程执行的离线测试**，不是现场交互结果。继续讲 command/tool 区别与门禁边界。

## 7. Templates / Skills 的扩展练习（不是主版本必做演示）

当前演示启动参数故意关闭了发现，复制资源后不应假定 `/review` 和 `/skill:verify-before-answer` 已经可用。

若要课后体验它们，在审阅资源后退出当前 Pi，显式指定路径；不要同时传入会禁用其加载的 `--no-skills` / `--no-prompt-templates`：

```bash
pi --no-extensions --no-context-files --no-mcp --approve \
   -e .pi/extensions/verify.ts \
   --skill .pi/skills/verify-before-answer \
   --prompt-template .pi/prompts/review.md
```

该模式会恢复 Skill / Template 的正常发现行为；专用 profile、所在目录和祖先目录里仍应只保留你审核过的资源。它不承诺“只加载这些指定文件”。

课后命令：

```text
/review 重点看缺省 archived 与显式 false
/skill:verify-before-answer
```

这两条可能触发模型调用和成本，不属于已经完成的离线验证。

## 8. 上台前最终彩排清单

- [ ] 用本场同一台机器、同一网络、同一模型和显示比例完整走两次。
- [ ] 一次从红色基线出发，另一次专门练“模型无响应”的兜底切换。
- [ ] 对照本手册，确认 `--continue` 用的是正确目录、正确 profile 的演示会话。
- [ ] 所有对外画面都没有密钥、私人路径内容、业务数据或通知弹窗。
- [ ] 屏幕字号能让后排看清断言和三个关键数值，而不是同时铺满全部日志。
- [ ] 若录屏，开头标明版本、日期和“真实模型运行 / 参考修复演示”的性质。
- [ ] 保存实际模型演示录像，或明确只采用本地结果快照兜底；录像不能暗示保证现场重复成功。
- [ ] 演示目录、参考答案、日志各开一个固定终端/标签，不临场找文件。
- [ ] 不临场升级 Pi、安装社区包、连接新的 MCP 服务。

**真正的彩排完成标准**：不只是自己能运行，还要能在失败时于 30 秒内切换到诚实的备用材料，并准时回到主线。
