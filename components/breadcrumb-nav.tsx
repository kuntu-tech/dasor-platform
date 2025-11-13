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
import { useState, useEffect, useMemo } from "react";
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
  const [breadcrumbAppId, setBreadcrumbAppId] = useState<string | null>(null);
  const [breadcrumbAppName, setBreadcrumbAppName] = useState<string | null>(
    null
  );

  // Parse the current path
  const pathSegments = useMemo(
    () => pathname.split("/").filter(Boolean),
    [pathname]
  );

  useEffect(() => {
    const appIndex = pathSegments.findIndex((segment) => segment === "app");
    if (appIndex !== -1 && appIndex + 1 < pathSegments.length) {
      const nextId = pathSegments[appIndex + 1];
      setBreadcrumbAppId(nextId);
    } else {
      setBreadcrumbAppId(null);
      setBreadcrumbAppName(null);
    }
  }, [pathSegments]);

  useEffect(() => {
    if (!breadcrumbAppId) return;
    let isCancelled = false;

    const fetchAppName = async () => {
      try {
        const response = await fetch(`/api/apps/${breadcrumbAppId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch app info: ${response.status}`);
        }
        const data = await response.json();
        if (!isCancelled) {
          setBreadcrumbAppName(data?.data?.name || null);
        }
      } catch (error) {
        console.warn("Failed to load breadcrumb app name", error);
        if (!isCancelled) {
          setBreadcrumbAppName(null);
        }
      }
    };

    fetchAppName();

    return () => {
      isCancelled = true;
    };
  }, [breadcrumbAppId]);

  // Map path segments to breadcrumb metadata
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

  // Build breadcrumb items
  const breadcrumbs = [];
  let currentPath = "";

  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i];
    currentPath += `/${segment}`;

    const pathInfo = pathMap[segment];
    const isAppRoute = segment === "app" || segment === breadcrumbAppId;

    if (pathInfo) {
      breadcrumbs.push({
        label: pathInfo.label,
        icon: pathInfo.icon,
        href:
          i === pathSegments.length - 1 || isAppRoute
            ? undefined
            : pathInfo.href || currentPath,
        isLast: i === pathSegments.length - 1,
        isDisabled: isAppRoute,
      });
    } else {
      const formattedLabel =
        breadcrumbAppId && segment === breadcrumbAppId
          ? breadcrumbAppName || appName || segment
          : segment;
      breadcrumbs.push({
        label: formattedLabel,
        icon: FileText,
        href:
          i === pathSegments.length - 1 || isAppRoute ? undefined : currentPath,
        isLast: i === pathSegments.length - 1,
        isDisabled: segment === breadcrumbAppId,
      });
    }
  }

  // Check whether the current route is the preview page
  const isPreviewPage = pathname.startsWith("/preview");
  const appId = searchParams.get("id");

  const navigateToPublish = () => {
    if (appId) {
      router.push(`/publish?id=${appId}`);
    } else {
      router.push("/publish");
    }
  };

  // Fetch application publication status
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
          console.log("Failed to get app status:", error);
        }
      };

      fetchAppStatus();
    }
  }, [isPreviewPage, appId, session]);

  // Handle application save action
  const handleSaveApp = async () => {
    console.log(user);

    if (!appName.trim()) {
      alert("Please enter the application name.");
      return;
    }

    if (!user || !session) {
      alert("Please log in first.");
      return;
    }

    setIsSaving(true);

    // Legacy preview save functionality (currently unused)
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
        throw new Error(data.error || "Failed to save application.");
      }

      // Save succeeded
      console.log("Application saved successfully:", data);

      // Close dialog state
      setIsSaveDialogOpen(false);
      setAppName("");
      setAppDescription("");

      // Navigate to publish page after saving
      navigateToPublish();
    } catch (error) {
      console.log("Failed to save application:", error);
      alert(
        `Save failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel action
  const handleCancelSave = () => {
    setIsSaveDialogOpen(false);
    setAppName("");
    setAppDescription("");
  };

  return (
    <div className="flex items-center justify-between mb-6">
      {/* Left breadcrumb navigation */}
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
            {item.isLast || item.isDisabled || !item.href ? (
              <div className="flex items-center gap-2">
                <item.icon className="size-4" />
                <span className="font-medium text-gray-900">{item.label}</span>
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

      {/* Right action buttons: only visible on preview pages before publishing */}
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

      {/* Published state display */}
      {/* {isPreviewPage && appStatus === "published" && (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            published
          </Badge>
        </div>
      )} */}

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
