"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  
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

  // 构建面包屑
  const breadcrumbs = []
  let currentPath = ''
  
  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i]
    currentPath += `/${segment}`
    
    const pathInfo = pathMap[segment]
    if (pathInfo) {
      breadcrumbs.push({
        label: pathInfo.label,
        icon: pathInfo.icon,
        href: i === pathSegments.length - 1 ? undefined : (pathInfo.href || currentPath),
        isLast: i === pathSegments.length - 1
      })
    } else {
      // 对于动态路由参数，显示原始值
      breadcrumbs.push({
        label: segment,
        icon: FileText,
        href: i === pathSegments.length - 1 ? undefined : currentPath,
        isLast: i === pathSegments.length - 1
      })
    }
  }

  // 检查是否在 preview 页面
  const isPreviewPage = pathname.startsWith('/preview')

  return (
    <div className="flex items-center justify-between mb-6">
      {/* 左侧面包屑导航 */}
      <div className="flex items-center gap-1 text-sm text-gray-700">
        {/* Home Icon */}
        <Link href="/" className="flex items-center gap-1 hover:text-gray-900">
          <Zap className="size-4 text-green-500" />
        </Link>
        
        {/* Breadcrumb Items */}
        {breadcrumbs.map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            <span className="text-gray-400">/</span>
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
    </div>
  )
}
