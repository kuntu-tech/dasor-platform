"use client"

import { usePathname } from "next/navigation"
import { BreadcrumbNav } from "./breadcrumb-nav"

export function ConditionalBreadcrumb() {
  const pathname = usePathname()
  
  // Hide breadcrumbs on the homepage and auth routes
  if (pathname === "/" || pathname.startsWith("/auth/")) {
    return null
  }

  return (
    <div className="px-6 pt-6">
      <BreadcrumbNav />
    </div>
  )
}
