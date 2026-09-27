# Jev 决策机

已部署为独立 Cloudflare Worker：`https://jev-decision-web.llhleo1113.workers.dev/`。网页使用独立访问口令与 HttpOnly 会话 Cookie；口令保存在 `WEB_ACCESS_PASSWORD` Secret 中，签名密钥保存在 `SESSION_SIGNING_KEY` Secret 中。请不要把口令或 OpenRouter Key 提交到 Git。

- `index.html`：手机优先的 Choice / Noul / Score 表单、结果、Key usage 和原始 JSON。
- `web-worker.template.js`：网页登录、输入限制、调用 `JEV_GATEWAY` 服务绑定和输出整理。
- `web-worker.js`：将 HTML 嵌入模板后的部署文件。
- `gateway.js`：`jev-work-decision` 当前部署源码，在保留 Agent Toolkit 原有三个工具的基础上增加仅供 Service Binding 调用的 `webDecision` RPC；OpenRouter Key 仍只在此 Worker 的 Secret。

重新构建 `web-worker.js`：将模板中的唯一 `__HTML__` 替换为 `index.html` 内容的 JSON 字符串。不要将已部署站点的登录口令写入源码。

当前会话的 Cloudflare 1010 阻断了自动化请求的 POST，因此线上 Choice / Noul / Score 真实模型结果尚未验证；本地模拟 RPC 测试已通过。Noul 原生响应没有单独的 confidence 字段，界面应如实显示“此模式不单独提供”。当 `/api/v1/key` 返回 null 独立限额时，界面显示未设限，不把它当作账户总余额。
