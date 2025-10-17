"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  CreditCard, 
  FileText, 
  Eye, 
  ExternalLink, 
  ArrowRight, 
  Check, 
  Infinity,
  Download,
  X,
  Camera
} from "lucide-react"

const settingsMenu = [
  { id: "account", label: "Account", icon: User },
  { id: "billing", label: "Usage & Billing", icon: CreditCard },
 
]

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: string
}

export function SettingsModal({ isOpen, onClose, defaultTab = "account" }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  // 处理ESC键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      // 防止背景滚动
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  // 当弹窗打开时，设置默认标签页
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab)
    }
  }, [isOpen, defaultTab])

  const renderAccountContent = () => (
    <div className="space-y-6">
      {/* Account Header */}
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">G</span>
              </div>
              <Button variant="outline" className="gap-2">
                <Camera className="size-4" />
                Change Avatar
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Or drag and drop an image anywhere on this area
            </p>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            <input 
              type="text" 
              defaultValue="Gomberg Lambino"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <input 
              type="text" 
              defaultValue="gomberglambino"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="custom-username" 
                defaultChecked
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="custom-username" className="text-sm text-gray-700">
                Use custom username
              </label>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Bio</label>
            <textarea 
              placeholder="Tell us about yourself"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
            />
            <p className="text-sm text-muted-foreground">180 characters remaining</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderBillingContent = () => (
    <div className="space-y-6">
      {/* Billing Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usage & Billing</h1>
          <div className="mt-1">
            <h2 className="text-lg font-semibold">Billing</h2>
            <p className="text-sm text-muted-foreground">
              For questions about billing,{" "}
              <a href="#" className="text-blue-600 hover:underline">contact us</a>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            Manage subscription
            <ExternalLink className="size-4" />
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            All plans
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Balance</p>
              <p className="text-xs text-muted-foreground">Will be used for your future payments</p>
            </div>
            <p className="text-lg font-semibold">$0.00</p>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Next payment</p>
              <p className="text-xs text-muted-foreground">Pro (monthly)</p>
            </div>
            <p className="text-sm">October 17th, 2025</p>
          </div>
        </CardContent>
      </Card>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Pro</CardTitle>
            <Badge variant="secondary">Current plan</Badge>
          </div>
          <CardDescription>For more projects and usage</CardDescription>
        </CardHeader>
       
      </Card>


      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment history</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>№</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">SKVGEW24-0001</TableCell>
                <TableCell>2025/9/17</TableCell>
                <TableCell>$20.00</TableCell>
                <TableCell>2025/9/17 - 2025/9/17</TableCell>
                <TableCell>
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                    Paid
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <Download className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 蒙版 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 窗口 */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[80vh] mx-4 flex overflow-hidden">
        {/* 左侧导航栏 */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-semibold">Settings</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
          
          <nav className="space-y-1 flex-1">
            {settingsMenu.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3 h-10"
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Button>
              )
            })}
          </nav>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 p-8 overflow-y-auto">
          {activeTab === "account" && renderAccountContent()}
          {activeTab === "billing" && renderBillingContent()}
        </div>
      </div>
    </div>
  )
}
