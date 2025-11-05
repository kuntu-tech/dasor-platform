import { StripeAccount } from '@/lib/types/stripe'

export const mockStripeAccount: StripeAccount | null = null // 初始状态为未连接

export const mockStripeAccountConnected: StripeAccount = {
  id: 'stripe_1',
  stripeAccountId: 'acct_1234567890abcdef',
  email: 'john.doe@example.com',
  displayName: 'John Doe',
  type: 'individual',
  isVerified: true,
  isActive: true,
  connectedAt: '2024-01-15T10:30:00Z',
  lastSyncAt: '2024-01-20T14:22:00Z',
  permissions: {
    canReceivePayments: true,
    autoTransfer: false,
    notifications: true
  },
  country: 'US',
  currency: 'usd',
  businessType: 'individual',
  chargesEnabled: true,
  payoutsEnabled: true
}

export const mockStripeOAuthUrl = 'https://connect.stripe.com/oauth/authorize?response_type=code&client_id=ca_test_1234567890&scope=read_write&redirect_uri=https://your-app.com/stripe/callback'

// 模拟Stripe API调用
export const mockStripeAPI = {
  connectAccount: async (authCode: string): Promise<StripeAccount> => {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return {
      id: 'stripe_new',
      stripeAccountId: 'acct_' + Math.random().toString(36).substr(2, 16),
      email: 'new.user@example.com',
      displayName: 'New User',
      type: 'individual',
      isVerified: true,
      isActive: true,
      connectedAt: new Date().toISOString(),
      lastSyncAt: new Date().toISOString(),
      permissions: {
        canReceivePayments: true,
        autoTransfer: false,
        notifications: true
      },
      country: 'US',
      currency: 'usd',
      businessType: 'individual',
      chargesEnabled: true,
      payoutsEnabled: true
    }
  },
  
  disconnectAccount: async (accountId: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return true
  },
  
  updatePermissions: async (accountId: string, permissions: Partial<StripeAccount['permissions']>): Promise<StripeAccount> => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    // 返回更新后的账户信息
    return mockStripeAccountConnected
  }
}
