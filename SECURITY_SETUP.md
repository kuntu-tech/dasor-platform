# Security Configuration Guide

## Issue Resolution

GitHub detected hard-coded API keys and blocked the push. We have removed all hard-coded secrets; the remaining step is to configure environment variables.

## Files Updated

1. **app/api/connect/route.ts** – removed hard-coded OpenAI API key  
2. **app/market-exploration/page.tsx** – removed hard-coded OpenAI API key and Supabase access token  
3. **components/connect-flow.tsx** – removed hard-coded API keys from comments

## Environment Variable Setup

### 1. Create `.env.local`

Create `.env.local` in the project root:

```bash
# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# OpenAI API configuration
OPENAI_API_KEY=your-openai-api-key
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-api-key

# Supabase access token (for external API calls)
NEXT_PUBLIC_SUPABASE_ACCESS_TOKEN=your-supabase-access-token
```

### 2. Retrieve Required Keys

#### Supabase

1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard)  
2. Select your project  
3. Navigate to **Settings → API**  
4. Copy the following:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

#### OpenAI

1. Log in to the [OpenAI Platform](https://platform.openai.com/)
2. Open the **API Keys** page
3. Create a new API key
4. Assign the value to `OPENAI_API_KEY` and `NEXT_PUBLIC_OPENAI_API_KEY`

#### Supabase Access Token

1. In the Supabase Dashboard  
2. Go to **Settings → API**  
3. Copy the `Access Token` or create a new one  
4. Set it as `NEXT_PUBLIC_SUPABASE_ACCESS_TOKEN`

### 3. Verify Configuration

Restart the development server:

```bash
npm run dev
# or
pnpm dev
```

Confirm the console shows that environment variables loaded successfully.

## Security Best Practices

1. **Never** commit `.env.local` to Git  
2. **Never** hard-code API keys in source code  
3. Manage secrets via environment variables  
4. Rotate API keys periodically  
5. Use a secure secret manager in production

## Push Code

You can now safely push to GitHub:

```bash
git add .
git commit -m "Remove hardcoded API keys and use environment variables"
git push origin zyp
```

## Troubleshooting

If issues persist:

1. Confirm `.env.local` exists and is correctly formatted  
2. Ensure all environment variables are set  
3. Restart the development server  
4. Inspect the console for errors

## Production Deployment

In production, configure these environment variables via your hosting platform (e.g., Vercel, Netlify) instead of using `.env.local`.
