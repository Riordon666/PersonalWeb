---
name: Agent Trace Workbench
slug: agent-trace-workbench
tagline: 面向 Coding Agent 的本地优先轨迹观察与回放工作台
repo: https://github.com/Riordon666/agent-trace-workbench
tech: [Node.js, TypeScript, node-pty, Anthropic API, OpenAI API]
status: 活跃开发
featured: true
year: 2026
---

把一次 Coding Agent 运行中散落在 API 流、Agent History、工具调用和终端输出里的信息，整理成同一个本地 Session。支持 Claude Code 与 Codex CLI。

- **实时捕获**：通过本地 Gateway 观察 Anthropic Messages API 与 OpenAI Responses API 的流式请求
- **统一时间线**：多来源统一为稳定的 `events.jsonl` 事件模型
- **逐轮回放**：在 user、assistant、reasoning、tool call、tool result、usage 之间快速定位
- **双源对齐**：对照 Gateway 抓取与 Agent History，发现缺失、旁路和内容差异
- **非阻断诊断**：warning / error 只解释数据状态，不扣留 Session 也不阻止导出
- **纯本地**：默认只监听 `127.0.0.1`，没有账号、云端后端或遥测，凭证脱敏 + SHA-256 校验
