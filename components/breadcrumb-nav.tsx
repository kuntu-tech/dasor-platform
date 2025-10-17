"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState } from "react"
import { 
  Zap, 
  Home,
  Database,
  Eye,
  Upload,
  Settings,
  Users,
  FileText,
  BarChart3,
  Cog
} from "lucide-react"

export function BreadcrumbNav() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [saveAppName, setSaveAppName] = useState("")
  const [appDescription, setAppDescription] = useState("")
  
  // 获取URL参数
  const appId = searchParams.get('id')
  const appNameParam = searchParams.get('appName')
  const fromPage = searchParams.get('from')
  
  // 如果没有appName参数，尝试从localStorage获取
  const getAppName = () => {
    if (appNameParam) return appNameParam
    if (appId) {
      try {
        const stored = localStorage.getItem("currentApp")
        if (stored) {
          const app = JSON.parse(stored)
          if (app.id === appId) {
            return app.name
          }
        }
      } catch (e) {
        console.error("Failed to parse current app", e)
      }
    }
    return null
  }
  
  const appName = getAppName()
  
  // 解析路径
  const pathSegments = pathname.split('/').filter(Boolean)
  
  // 路径映射
  const pathMap: Record<string, { label: string; icon: any; href?: string }> = {
    'dashboard': { label: 'Dashboard', icon: BarChart3, href: '/dashboard' },
    'connect': { label: 'Connect Database', icon: Database, href: '/connect' },
    'preview': { label: 'Preview', icon: Eye, href: '/preview' },
    'publish': { label: 'Publish', icon: Upload, href: '/publish' },
    'auth': { label: 'Authentication', icon: Users, href: '/auth' },
    'login': { label: 'Login', icon: Users, href: '/auth/login' },
    'register': { label: 'Register', icon: Users, href: '/auth/register' },
    'app': { label: 'App', icon: FileText, href: '/app' },
    'versions': { label: 'Versions', icon: FileText, href: '' },
    'overview': { label: 'Overview', icon: BarChart3, href: '/overview' },
    'generate': { label: 'Generate', icon: Cog, href: '/generate' },
    'connected-list': { label: 'Connected Apps', icon: Database, href: '/connected-list' },
    'save-success': { label: 'Save Success', icon: FileText, href: '/save-success' }
  }

  // 构建智能面包屑
  const buildSmartBreadcrumbs = () => {
    const breadcrumbs = []
    
    // 总是从Home开始
    breadcrumbs.push({
      label: 'Home',
      icon: Home,
      href: '/',
      isLast: false
    })
    
    // 根据当前页面和URL参数构建动态路径
    if (pathname === '/preview' && appId) {
      // Preview页面：显示 Home > [App Name] > Preview
      if (appName) {
        breadcrumbs.push({
          label: appName,
          icon: FileText,
          href: `/connected-list?id=${appId}`,
          isLast: false
        })
      }
      breadcrumbs.push({
        label: 'Preview',
        icon: Eye,
        href: undefined, // 当前页面，不可点击
        isLast: true
      })
    } else if (pathname === '/overview' && appId) {
      // Overview页面：显示 Home > Generate > [App Name] > Overview
      breadcrumbs.push({
        label: 'Generate',
        icon: Cog,
        href: '/generate',
        isLast: false
      })
      if (appName) {
        breadcrumbs.push({
          label: appName,
          icon: FileText,
          href: `/overview?id=${appId}`,
          isLast: false
        })
      }
      breadcrumbs.push({
        label: 'Overview',
        icon: BarChart3,
        href: undefined, // 当前页面，不可点击
        isLast: true
      })
    } else if (pathname === '/publish' && appId) {
      // Publish页面：显示 Home > Generate > [App Name] > Overview > Preview > Publish
      breadcrumbs.push({
        label: 'Generate',
        icon: Cog,
        href: '/generate',
        isLast: false
      })
      if (appName) {
        breadcrumbs.push({
          label: appName,
          icon: FileText,
          href: `/overview?id=${appId}`,
          isLast: false
        })
      }
      breadcrumbs.push({
        label: 'Overview',
        icon: BarChart3,
        href: `/overview?id=${appId}`,
        isLast: false
      })
      breadcrumbs.push({
        label: 'Preview',
        icon: Eye,
        href: `/preview?id=${appId}`,
        isLast: false
      })
      breadcrumbs.push({
        label: 'Publish',
        icon: Upload,
        href: undefined, // 当前页面，不可点击
        isLast: true
      })
    } else {
      // 其他页面使用默认映射
      for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i]
        if (pathMap[segment]) {
          breadcrumbs.push({
            label: pathMap[segment].label,
            icon: pathMap[segment].icon,
            href: i === pathSegments.length - 1 ? undefined : (pathMap[segment].href || `/${segment}`),
            isLast: i === pathSegments.length - 1
          })
        }
      }
    }
    
    return breadcrumbs
  }
  
  const breadcrumbs = buildSmartBreadcrumbs()

  // 检查是否在 preview 页面
  const isPreviewPage = pathname.startsWith('/preview')

  // 处理保存应用
  const handleSaveApp = () => {
    if (!saveAppName.trim()) {
      return // 如果名称为空则不保存
    }
    
    // 关闭对话框
    setIsSaveDialogOpen(false)
    
    // 跳转到保存成功页面
    router.push("/save-success")
  }

  // 处理取消保存
  const handleCancelSave = () => {
    setIsSaveDialogOpen(false)
    setSaveAppName("")
    setAppDescription("")
  }

  return (
    <div className="flex items-center justify-between mb-6">
      {/* 左侧面包屑导航 */}
      <div className="flex items-center gap-1 text-sm text-gray-700">
        {/* Breadcrumb Items */}
        {breadcrumbs.map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            {index > 0 && <span className="text-gray-400">/</span>}
            {item.isLast ? (
              <div className="flex items-center gap-2">
                <item.icon className="size-4" />
                <span className="font-medium text-gray-900">{item.label}</span>
                {item.label === 'Versions' && (
                  <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                    Production
                  </Badge>
                )}
              </div>
            ) : (
              <Link href={item.href || '#'} className="flex items-center gap-2 hover:text-gray-900">
                <item.icon className="size-4" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* 右侧按钮组 - 只在 preview 页面显示 */}
      {isPreviewPage && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-3"
            onClick={() => setIsSaveDialogOpen(true)}
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="default"
            className="h-8 px-3"
            onClick={() => router.push("/publish")}
          >
            Publish
          </Button>
        </div>
      )}

      {/* Save Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Application</DialogTitle>
            <DialogDescription>
              Please enter the application's name and description to save your application configuration.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="app-name">Application Name *</Label>
              <Input
                id="app-name"
                placeholder="Please enter application name"
                value={saveAppName}
                onChange={(e) => setSaveAppName(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="app-description">Application Description</Label>
              <Textarea
                id="app-description"
                placeholder="Please enter application description (optional)"
                value={appDescription}
                onChange={(e) => setAppDescription(e.target.value)}
                className="w-full min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelSave}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveApp}
              disabled={!saveAppName.trim()}
            >
              Save Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
