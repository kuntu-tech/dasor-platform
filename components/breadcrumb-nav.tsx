"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
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
  Cog,
} from "lucide-react";

export function BreadcrumbNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, session } = useAuth();
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [appName, setAppName] = useState("");
  const [appDescription, setAppDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [appStatus, setAppStatus] = useState<string | null>(null);

  // 解析路径
  const pathSegments = pathname.split("/").filter(Boolean);

  // 路径映射
  const pathMap: Record<string, { label: string; icon: any; href?: string }> = {
    dashboard: { label: "Dashboard", icon: BarChart3, href: "/dashboard" },
    connect: { label: "Connect Database", icon: Database, href: "/connect" },
    preview: { label: "Preview", icon: Eye, href: "/preview" },
    publish: { label: "Publish", icon: Upload, href: "/publish" },
    auth: { label: "Authentication", icon: Users, href: "/auth" },
    login: { label: "Login", icon: Users, href: "/auth/login" },
    register: { label: "Register", icon: Users, href: "/auth/register" },
    app: { label: "App", icon: FileText, href: "/app" },
    versions: { label: "Versions", icon: FileText, href: "" },
    overview: { label: "Overview", icon: BarChart3, href: "/overview" },
    generate: { label: "Generate", icon: Cog, href: "/generate" },
    "connected-list": {
      label: "Connected Apps",
      icon: Database,
      href: "/connected-list",
    },
    "save-success": {
      label: "Save Success",
      icon: FileText,
      href: "/save-success",
    },
  };

  // 构建面包屑
  const breadcrumbs = [];
  let currentPath = "";

  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i];
    currentPath += `/${segment}`;

    const pathInfo = pathMap[segment];
    if (pathInfo) {
      breadcrumbs.push({
        label: pathInfo.label,
        icon: pathInfo.icon,
        href:
          i === pathSegments.length - 1
            ? undefined
            : pathInfo.href || currentPath,
        isLast: i === pathSegments.length - 1,
      });
    } else {
      // 对于动态路由参数，显示原始值
      breadcrumbs.push({
        label: segment,
        icon: FileText,
        href: i === pathSegments.length - 1 ? undefined : currentPath,
        isLast: i === pathSegments.length - 1,
      });
    }
  }

  // 检查是否在 preview 页面
  const isPreviewPage = pathname.startsWith("/preview");
  const appId = searchParams.get("id");

  const navigateToPublish = () => {
    if (appId) {
      router.push(`/publish?id=${appId}`);
    } else {
      router.push("/publish");
    }
  };

  // 获取应用状态
  useEffect(() => {
    if (isPreviewPage && appId && session) {
      const fetchAppStatus = async () => {
        try {
          const response = await fetch(`/api/apps/${appId}`, {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setAppStatus(data.data?.status || null);
          }
        } catch (error) {
          console.log("获取应用状态失败:", error);
        }
      };

      fetchAppStatus();
    }
  }, [isPreviewPage, appId, session]);

  // 处理保存应用
  const handleSaveApp = async () => {
    console.log(user);

    if (!appName.trim()) {
      alert("请输入应用名称");
      return;
    }

    if (!user || !session) {
      alert("请先登录");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/apps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: appName.trim(),
          description: appDescription.trim(),
          status: "draft",
          app_version: null,
          build_status: "pending",
          deployment_status: "not_deployed",
          connection_id: "42d2234c-7dca-4199-87fb-56fa26b7b50f",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "保存失败");
      }

      // 保存成功
      console.log("应用保存成功:", data);

      // 关闭对话框
      setIsSaveDialogOpen(false);
      setAppName("");
      setAppDescription("");

      // 跳转到保存成功页面
      navigateToPublish();
    } catch (error) {
      console.log("保存应用失败:", error);
      alert(`保存失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 处理取消保存
  const handleCancelSave = () => {
    setIsSaveDialogOpen(false);
    setAppName("");
    setAppDescription("");
  };

  return (
    <div className="flex items-center justify-between mb-6">
      {/* 左侧面包屑导航 */}
      <div className="flex items-center gap-1 text-sm text-gray-700">
        {/* Home Icon */}
        <Link href="/" className="flex items-center gap-1 hover:text-gray-900">
          {/* <Zap className="size-4 text-green-500" /> */}
          <img src="/logo.png" alt="Logo" className="size-8 object-contain" />
        </Link>

        {/* Breadcrumb Items */}
        {breadcrumbs.map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            <span className="text-gray-400">/</span>
            {item.isLast ? (
              <div className="flex items-center gap-2">
                <item.icon className="size-4" />
                <span className="font-medium text-gray-900">{item.label}</span>
                {item.label === "Versions" && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-orange-100 text-orange-800 border-orange-200"
                  >
                    Production
                  </Badge>
                )}
              </div>
            ) : (
              <Link
                href={item.href || "#"}
                className="flex items-center gap-2 hover:text-gray-900"
              >
                <item.icon className="size-4" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* 右侧按钮组 - 只在 preview 页面显示，且应用未发布时显示 */}
      {isPreviewPage && appStatus !== "published" && (
        <div className="flex items-center gap-2">
          {/* <Button
            size="sm"
            variant="ghost"
            className="h-8 px-3"
            onClick={() => setIsSaveDialogOpen(true)}
          >
            Save
          </Button> */}
          <Button
            size="sm"
            variant="default"
            className="h-8 px-3"
            onClick={navigateToPublish}
          >
            Publish
          </Button>
        </div>
      )}

      {/* 已发布状态显示 */}
      {isPreviewPage && appStatus === "published" && (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            published
          </Badge>
        </div>
      )}

      {/* Save Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Application</DialogTitle>
            <DialogDescription>
              Please enter the application's name and description to save your
              application configuration.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="app-name">Application Name *</Label>
              <Input
                id="app-name"
                placeholder="Please enter application name"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
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
              disabled={!appName.trim() || isSaving}
            >
              {isSaving ? "Saving..." : "Save Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
