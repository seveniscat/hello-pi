# Task Summary：Pi 分享用的微型故障现场

给定本地 JSON 任务列表，输出未归档任务的状态统计。

## 产品规则

- 只有 `archived: true` 的任务被排除。
- `archived: false` 或缺少 `archived` 字段，都算未归档。
- `status` 在本练习中保证是 `open`、`in_progress` 或 `done`。
- 不修改输入；不增加依赖；不处理网络、数据库或真实用户数据。
- CLI 对外部 JSON 的运行时 schema 校验不在本练习范围，不能当生产代码直接投用。

## 运行

要求 Node.js 22.19.0 或更高；使用 Node 的 TypeScript 类型擦除，不等同于执行静态类型检查。
没有第三方依赖，不需要 `npm install`。

```bash
npm test
npm run demo
```

样例数据的正确结果：`{ "total": 4, "open": 1, "inProgress": 1, "done": 2 }`。
初始版本有一个有意保留的缺陷，测试应当 4 项通过、1 项失败。
先确认失败证据，再进行最小修复。测试是验收条件，不要删除或放宽测试来取得通过。
