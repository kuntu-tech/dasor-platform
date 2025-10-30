# 安全配置指南

## 问题解决

GitHub 检测到了代码中的硬编码 API 密钥，已自动阻止推送。我们已经修复了所有硬编码的密钥，现在需要配置环境变量。

## 已修复的文件

1. **app/api/connect/route.ts** - 移除了硬编码的 OpenAI API 密钥
2. **app/market-exploration/page.tsx** - 移除了硬编码的 OpenAI API 密钥和 Supabase 访问令牌
3. **components/connect-flow.tsx** - 移除了注释中的硬编码 API 密钥

## 环境变量配置

### 1. 创建 .env.local 文件

在项目根目录创建 `.env.local` 文件：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# OpenAI API 配置
OPENAI_API_KEY=your-openai-api-key
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-api-key

# Supabase 访问令牌（用于外部 API 调用）
NEXT_PUBLIC_SUPABASE_ACCESS_TOKEN=your-supabase-access-token
```

### 2. 获取必要的密钥

#### Supabase 配置：

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 Settings → API
4. 复制以下值：
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

#### OpenAI API 配置：

1. 登录 [OpenAI Platform](https://platform.openai.com/)
2. 进入 API Keys 页面
3. 创建新的 API 密钥
4. 将密钥值设置为 `OPENAI_API_KEY` 和 `NEXT_PUBLIC_OPENAI_API_KEY`

#### Supabase 访问令牌：

1. 在 Supabase Dashboard 中
2. 进入 Settings → API
3. 复制 `Access Token` 或创建新的访问令牌
4. 设置为 `NEXT_PUBLIC_SUPABASE_ACCESS_TOKEN`

### 3. 验证配置

重启开发服务器：

```bash
npm run dev
# 或
pnpm dev
```

检查控制台是否显示环境变量加载成功。

## 安全最佳实践

1. **永远不要**将 `.env.local` 文件提交到 Git
2. **永远不要**在代码中硬编码 API 密钥
3. 使用环境变量来管理敏感信息
4. 定期轮换 API 密钥
5. 在生产环境中使用更安全的密钥管理服务

## 推送代码

现在可以安全地推送代码到 GitHub：

```bash
git add .
git commit -m "Remove hardcoded API keys and use environment variables"
git push origin zyp
```

## 故障排除

如果仍然遇到问题：

1. 检查 `.env.local` 文件是否存在且格式正确
2. 确保所有环境变量都已设置
3. 重启开发服务器
4. 检查控制台是否有错误信息

## 生产环境部署

在生产环境中，需要在部署平台（如 Vercel、Netlify 等）的设置中配置这些环境变量，而不是使用 `.env.local` 文件。
