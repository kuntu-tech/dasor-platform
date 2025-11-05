"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { 
  Wallet, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Settings,
  Trash2,
  Shield,
  Bell,
  CreditCard
} from "lucide-react"
import { StripeAccount, StripeOAuthState } from "@/lib/types/stripe"
import { mockStripeAccount, mockStripeAccountConnected, mockStripeAPI } from "@/mock/stripe"

interface StripeAccountManagerProps {
  onAccountChange?: (account: StripeAccount | null) => void
}

export function StripeAccountManager({ onAccountChange }: StripeAccountManagerProps) {
  const [account, setAccount] = useState<StripeAccount | null>(mockStripeAccount)
  const [oauthState, setOauthState] = useState<StripeOAuthState>({
    isConnecting: false,
    error: null,
    success: false
  })

  // 模拟从URL参数获取授权码（实际应用中从URL参数获取）
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const authCode = urlParams.get('code')
    const error = urlParams.get('error')
    
    if (authCode && !account) {
      handleStripeConnect(authCode)
    } else if (error) {
      setOauthState({
        isConnecting: false,
        error: 'Authorization failed. Please try again.',
        success: false
      })
    }
  }, [account])

  const handleStripeConnect = async (authCode?: string) => {
    setOauthState({ isConnecting: true, error: null, success: false })
    
    try {
      if (authCode) {
        // 处理授权回调
        const newAccount = await mockStripeAPI.connectAccount(authCode)
        setAccount(newAccount)
        setOauthState({ isConnecting: false, error: null, success: true })
        onAccountChange?.(newAccount)
      } else {
        // 重定向到Stripe OAuth
        window.location.href = 'https://connect.stripe.com/oauth/authorize?response_type=code&client_id=ca_test_1234567890&scope=read_write&redirect_uri=' + encodeURIComponent(window.location.origin + '/settings?tab=payment')
      }
    } catch (error) {
      setOauthState({
        isConnecting: false,
        error: 'Failed to connect Stripe account. Please try again.',
        success: false
      })
    }
  }

  const handleDisconnect = async () => {
    if (!account) return
    
    try {
      await mockStripeAPI.disconnectAccount(account.id)
      setAccount(null)
      setOauthState({ isConnecting: false, error: null, success: false })
      onAccountChange?.(null)
    } catch (error) {
      setOauthState({
        isConnecting: false,
        error: 'Failed to disconnect account. Please try again.',
        success: false
      })
    }
  }

  const handlePermissionChange = async (permission: keyof StripeAccount['permissions'], value: boolean) => {
    if (!account) return
    
    try {
      const updatedAccount = await mockStripeAPI.updatePermissions(account.id, { [permission]: value })
      setAccount(updatedAccount)
      onAccountChange?.(updatedAccount)
    } catch (error) {
      console.error('Failed to update permissions:', error)
    }
  }

  const renderNotConnected = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payment Account</h1>
        <p className="text-muted-foreground mt-2">
          Connect your Stripe account to receive payments
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="size-5" />
            Connect Stripe Account
          </CardTitle>
          <CardDescription>
            Link your Stripe account to start receiving payments securely
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="size-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">Stripe Payment Processing</h3>
              <p className="text-sm text-muted-foreground">
                Accept payments from customers worldwide with Stripe's secure platform
              </p>
            </div>
          </div>

          {oauthState.error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="size-4 text-red-600" />
              <span className="text-sm text-red-700">{oauthState.error}</span>
            </div>
          )}

          <Button 
            onClick={() => handleStripeConnect()} 
            disabled={oauthState.isConnecting}
            className="w-full"
          >
            {oauthState.isConnecting ? (
              <>
                <RefreshCw className="size-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <ExternalLink className="size-4 mr-2" />
                Connect with Stripe
              </>
            )}
          </Button>

          <div className="text-xs text-muted-foreground text-center">
            By connecting, you agree to Stripe's Terms of Service and Privacy Policy
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderConnected = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Account</h1>
          <p className="text-muted-foreground mt-2">
            Manage your Stripe account settings and permissions
          </p>
        </div>
        <Button variant="outline" onClick={handleDisconnect} className="gap-2">
          <Trash2 className="size-4" />
          Disconnect
        </Button>
      </div>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="size-5" />
            Account Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="size-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">{account?.displayName}</h3>
                <p className="text-sm text-muted-foreground">{account?.email}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                Connected
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {account?.isVerified ? 'Verified' : 'Unverified'}
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Account Type:</span>
              <span className="ml-2 font-medium capitalize">{account?.type}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Country:</span>
              <span className="ml-2 font-medium uppercase">{account?.country}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Currency:</span>
              <span className="ml-2 font-medium uppercase">{account?.currency}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Connected:</span>
              <span className="ml-2 font-medium">
                {account?.connectedAt ? new Date(account.connectedAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            Account Permissions
          </CardTitle>
          <CardDescription>
            Manage what your Stripe account can do
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="size-5 text-muted-foreground" />
              <div>
                <h3 className="font-medium">Receive Payments</h3>
                <p className="text-sm text-muted-foreground">
                  Allow this account to receive payments from customers
                </p>
              </div>
            </div>
            <Switch
              checked={account?.permissions.canReceivePayments || false}
              onCheckedChange={(checked) => handlePermissionChange('canReceivePayments', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="size-5 text-muted-foreground" />
              <div>
                <h3 className="font-medium">Auto Transfer</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically transfer funds to your bank account
                </p>
              </div>
            </div>
            <Switch
              checked={account?.permissions.autoTransfer || false}
              onCheckedChange={(checked) => handlePermissionChange('autoTransfer', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="size-5 text-muted-foreground" />
              <div>
                <h3 className="font-medium">Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Receive notifications for payments and account updates
                </p>
              </div>
            </div>
            <Switch
              checked={account?.permissions.notifications || false}
              onCheckedChange={(checked) => handlePermissionChange('notifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            Account Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-2">
              <ExternalLink className="size-4" />
              Open Stripe Dashboard
            </Button>
            <Button variant="outline" className="flex-1 gap-2">
              <RefreshCw className="size-4" />
              Sync Account
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Last synced: {account?.lastSyncAt ? new Date(account.lastSyncAt).toLocaleString() : 'Never'}
          </p>
        </CardContent>
      </Card>
    </div>
  )

  return account ? renderConnected() : renderNotConnected()
}
