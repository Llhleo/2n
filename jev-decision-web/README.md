# Jev 决策页（前端草案）

这是独立的静态页面，尚未接入后端。为避免把 OpenRouter API Key 放入公开的 GitHub Pages，本分支不部署到正式站点。

## 接入要求

同源 `POST /api/decision` 接收 `{mode, question, context, ...}`：
- choice：`items` 长度 2–8，每项 `{name, criteria}`。
- noul：`support`、`against`、`uncertainty`。
- score：`criteria` 和 `items` 长度 3–10，每项 `{name, meaning}`。

成功响应应包含 `result`（含 `choice` / `verdict` / `score` / `label` 主结论、`confidence`、`probabilities`），`usage`（`input_tokens`、`output_tokens`），`cost` 与 `key_usage`（`usage`、`limit_remaining`）。API 响应不得含密钥。后端负责验证数据长度、限流、服务端调用 Jev、获取 `/api/v1/key`、过滤错误并配置同源路由。`limit_remaining: null` 表示没有独立上限，不代表无限账户余额。

GitHub Pages 是静态托管，不能提供此接口。需要通过 Cloudflare Worker 或其他有 Secret 管理能力的后端同源托管，完成后再上线。现有 `jev-work-decision` 的 Agent Toolkit 工具不应被公开代理直接转发。
