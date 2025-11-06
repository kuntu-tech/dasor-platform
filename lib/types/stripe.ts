export interface StripeAccount {
  id: string
  stripeAccountId: string
  email: string
  displayName: string
  type: 'individual' | 'company'
  isVerified: boolean
  isActive: boolean
  connectedAt: string
  lastSyncAt: string
  permissions: {
    canReceivePayments: boolean
    autoTransfer: boolean
    notifications: boolean
  }
  country: string
  currency: string
  businessType?: string
  chargesEnabled: boolean
  payoutsEnabled: boolean
}

export interface StripeOAuthState {
  isConnecting: boolean
  error: string | null
  success: boolean
}

export interface StripeConnectResponse {
  accountId: string
  email: string
  displayName: string
  type: 'individual' | 'company'
  country: string
  currency: string
  businessType?: string
  chargesEnabled: boolean
  payoutsEnabled: boolean
}
