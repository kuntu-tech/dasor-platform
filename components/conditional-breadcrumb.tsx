"use client"

import { usePathname } from "next/navigation"
import { BreadcrumbNav } from "./breadcrumb-nav"

export function ConditionalBreadcrumb() {
  const pathname = usePathname()
  
  // 只在非首页显示面包屑导航
  if (pathname === "/") {
    return null
  }

  return (
    <div className="px-6 pt-6">
      <BreadcrumbNav />
    </div>
  )
}
