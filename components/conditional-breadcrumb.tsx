"use client"

import { usePathname } from "next/navigation"
import { BreadcrumbNav } from "./breadcrumb-nav"

export function ConditionalBreadcrumb() {
  const pathname = usePathname()
  
  // 在首页和认证页面不显示面包屑导航
  if (pathname === "/" || pathname.startsWith("/auth/")) {
    return null
  }

  return (
    <div className="px-6 pt-6">
      <BreadcrumbNav />
    </div>
  )
}
