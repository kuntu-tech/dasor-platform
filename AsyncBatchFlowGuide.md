# 批量异步生成接口使用说明

## 1. 提交任务

**POST** `/generate-batch`

- Header: `Content-Type: application/json`
- Body 示例：

```json
{
  "user_id": "USER_UUID",
  "supabase_config": {
    "supabase_url": "https://project.supabase.co",
    "supabase_key": "service-role-key"
  },
  "queries": [
    { "query": "自然语言描述 A", "sql": "SELECT * FROM ..." },
    { "query": "自然语言描述 B", "sql": "" }
  ],
  "anchorIndex": "{...table schema json...}",
  "app": {
    "name": "Marketing Dashboard",
    "description": "批量生成的 Supabase 工具",
    "connection_id": "CONNECTION_UUID"
  }
}
成功响应（202 Accepted）：
json

{
  "appId": "app-record-id",
  "status": "pending",
  "message": "批量生成任务已提交，稍后可查询进度",
  "statusEndpoint": "/generate-batch/<jobId>/status"
}
2. 查询进度
GET /generate-batch/{appId}/status

返回字段：

字段	说明
status	pending / generating / succeeded / failed
currentQueryIndex / totalQueries	当前处理到第几个查询
currentToolName, currentToolIndex, totalToolsInCurrentQuery	当前生成的工具信息
message, error	文本消息与错误描述
startedAt, completedAt, lastUpdatedAt	时间戳
建议 3–5 秒轮询或使用指数退避，直到状态进入 succeeded 或 failed。

3. Supabase apps 表数据
新加入的三个 JSONB 列用于承载生成结果：

列名	内容示例
generator_config	{ "plan": {...}, "outputDir": "...", "mcpPort": 8201 }
generator_meta	{ "anchorIndex": "...", "totalQueries": 3, "status": "completed", "completedAt": "...", "error": null }
generator_servers	[ { "serviceId": "...", "domain": "https://xxx.datail.ai", "status": "running" } ]
前端在任务完成后可读取这些字段渲染计划、域名等信息。

4. 推荐前端流程
提交 /generate-batch，根据返回的appId。
使用 statusEndpoint 轮询，展示进度条或“当前生成的工具”文案。
status === "succeeded" 时，查询 apps 表获取 generator_config/meta/servers，展示 MCP 域名及计划详情。
status === "failed" 时，显示 error，并可从 generator_meta.error 读取更多上下文。
5. 错误约定
场景	响应
参数校验失败	400 ValidationError（包含 issues）
未知 jobId	404 JobNotFound
服务端异常	500 BatchGenerationFailed
按照以上流程即可在 Web 端安全地发起/追踪批量 MCP 生成任务。若需扩展展示内容，使用 generator_meta 中的 JSON 即可。