"use client";
import Link from "next/link";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  MoreHorizontal,
  ArrowRight,
  Calendar,
  Info,
} from "lucide-react";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { PricingModal } from "@/components/pricing-modal";
import { CreateAppButton } from "@/components/create-app-button";
import { Hero7 } from "@/components/ui/modern-hero";
type AppItem = {
  id: string;
  name: string;
  description: string;
  status: "published" | "draft" | "generating";
  data_connections?: {
    connection_info?: {
      project_id?: string;
      access_token?: string;
      api_key?: string;
    } | null;
  } | null;
  generator_meta?: {
    queries?: Array<{
      index: number;
      query: string;
    }>;
    [key: string]: any;
  } | null;
  features: number;
  createdAt: string;
  updated_at: string;
  published_at: string;
  visits: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "draft" | "generating"
  >("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const { user, session } = useAuth();
  const { toast } = useToast();

  // Handle subscription_required parameter - only show popup once per session
  useEffect(() => {
    const subscriptionRequired = searchParams.get("subscription_required");
    if (subscriptionRequired === "1" && user?.id) {
      const subscriptionCheckedKey = `subscription_popup_shown_${user.id}`;
      const hasShownPopup =
        sessionStorage.getItem(subscriptionCheckedKey) === "true";

      if (!hasShownPopup) {
        // Show popup only if not shown in this session
        setIsPricingOpen(true);
        sessionStorage.setItem(subscriptionCheckedKey, "true");
        // Remove parameter from URL to prevent popup on refresh
        router.replace("/", { scroll: false });
      } else {
        // If already shown, just remove parameter from URL
        router.replace("/", { scroll: false });
      }
    }
  }, [searchParams, user?.id, router]);

  // Extract queries from generator_meta and store them in localStorage
  const extractAndSaveQueries = (app: AppItem) => {
    // 保存完整的 app 数据到 localStorage，供 preview 页使用
    try {
      localStorage.setItem(`app_data_for_preview`, JSON.stringify(app));
      console.log("Saved app data to localStorage for preview page:", app.id);
    } catch (e) {
      console.warn("Failed to save app data to localStorage:", e);
    }
    try {
      if (
        app.generator_meta?.queries &&
        Array.isArray(app.generator_meta.queries)
      ) {
        // Pick only the query field from each entry
        const selectedProblems = app.generator_meta.queries
          .map((q) => q.query)
          .filter((query) => query && query.trim().length > 0);

        if (selectedProblems.length > 0) {
          localStorage.setItem(
            "selectedProblems",
            JSON.stringify(selectedProblems)
          );
          console.log("Saved queries to selectedProblems:", selectedProblems);
        }
      }
    } catch (error) {
      console.log("Failed to extract and save queries:", error);
    }
  };

  // Cache expiration (1 day)
  const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 1 day

  // Derive the cache key
  const getCacheKey = useCallback(() => {
    return `apps_cache_${user?.id || "anonymous"}`;
  }, [user?.id]);

  // Read cached data
  const getCachedApps = useCallback((): AppItem[] | null => {
    if (typeof window === "undefined") return null;

    try {
      const cacheKey = getCacheKey();
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();

      // Expiration check
      if (now - timestamp > CACHE_EXPIRY) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return Array.isArray(data) ? data : null;
    } catch (e) {
      console.log("Failed to parse cached apps:", e);
      return null;
    }
  }, [getCacheKey]);

  // Write data into the cache
  const setCachedApps = useCallback(
    (data: AppItem[]) => {
      if (typeof window === "undefined") return;

      try {
        const cacheKey = getCacheKey();
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data,
            timestamp: Date.now(),
          })
        );
      } catch (e) {
        console.log("Failed to cache apps:", e);
      }
    },
    [getCacheKey]
  );

  // Clear cached entries
  const clearAppsCache = useCallback(() => {
    if (typeof window === "undefined") return;
    const cacheKey = getCacheKey();
    localStorage.removeItem(cacheKey);
  }, [getCacheKey]);

  // Helper responsible for fetching data from the API
  const fetchAppsFromAPI = useCallback(async () => {
    const queryParams = new URLSearchParams();

    if (user?.id) {
      queryParams.append("user_id", user.id);
    }

    queryParams.append("_t", Date.now().toString());

    const response = await fetch(`/api/apps?${queryParams.toString()}`);
    const data = await response.json();

    if (data.data && Array.isArray(data.data)) {
      setAppItems(data.data);
      // Persist the response in cache
      setCachedApps(data.data);
    }

    return data;
  }, [user?.id, setCachedApps]);

  const getApps = useCallback(
    async (useCache: boolean = true) => {
      // Honor cache first when allowed
      if (useCache) {
        const cachedData = getCachedApps();
        if (cachedData) {
          // Display cached data immediately
          setAppItems(cachedData);
          // Refresh in the background without using cache
          fetchAppsFromAPI().catch(console.log);
          return { data: cachedData };
        }
      }

      // When no cache is available, fetch directly
      try {
        return await fetchAppsFromAPI();
      } catch (error) {
        console.log("Failed to fetch apps:", error);
        // Fall back to cache if the request fails
        const cachedData = getCachedApps();
        if (cachedData) {
          setAppItems(cachedData);
        }
        throw error;
      }
    },
    [getCachedApps, fetchAppsFromAPI]
  );
  useEffect(() => {
    if (user) {
      getApps();
    }
  }, [user, getApps]);

  // const initialApps: AppItem[] = [
  //   {
  //     id: "app-1",
  //     name: "E-commerce Operations Assistant",
  //     description:
  //       "Includes user behavior analysis, sales dashboard, inventory queries and more",
  //     database: {
  //       url: "https://supabase.com/project/production",
  //       apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  //     },
  //     features: 5,
  //     status: "published",
  //     createdAt: "2025-10-01",
  //     lastEditedAt: "2025-10-10",
  //     publishedAt: "2025-10-11",
  //     visits: 1234,
  //   },
  //   {
  //     id: "app-2",
  //     name: "Data Analytics Platform",
  //     description: "Multi-dimensional data analysis and visualization toolkit",
  //     database: {
  //       url: "https://supabase.com/project/analytics",
  //       apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  //     },
  //     features: 8,
  //     status: "published",
  //      createdAt: "2025-10-03",
  //     lastEditedAt: "2025-10-08",
  //     publishedAt: "2025-10-09",
  //     visits: 856,
  //   },
  //   {
  //     id: "app-3",
  //     name: "Customer Management System",
  //     description:
  //       "Customer information queries, behavior tracking, value assessment",
  //     database: {
  //       url: "https://supabase.com/project/crm",
  //       apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  //     },
  //     features: 6,
  //     status: "draft",
  //     createdAt: "2025-10-02",
  //     lastEditedAt: "2025-10-05",
  //     publishedAt: "-",
  //     visits: 0,
  //   },
  // ];
  const [appItems, setAppItems] = useState<AppItem[]>([]);

  const handleDelete = async (id: string) => {
    // Confirm deletion
    if (
      !confirm(
        "Are you sure you want to delete this app? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeletingId(id);

    try {
      // Invoke backend API to delete the app
      const response = await fetch(`/api/apps/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token && {
            Authorization: `Bearer ${session.access_token}`,
          }),
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        //throw new Error(errorData.error || "Failed to delete app");
      }

      // Clear cache and refetch to keep data consistent
      clearAppsCache();
      await getApps(false); // Force refresh without cache

      console.log("App deleted successfully");
    } catch (error) {
      console.log("Failed to delete app:", error);
      toast({
        variant: "error",
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredApps = useMemo(() => {
    // Ensure appItems is always an array
    const items = Array.isArray(appItems) ? appItems : [];
    let filtered = items;

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Search filter - only match the name field
    const q = query.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((a) => {
        // Match against the name field
        return a.name?.toLowerCase().includes(q);
      });
    }

    return filtered;
  }, [appItems, query, statusFilter]);

  return (
    <div className="min-h-screen bg-background">
      <main className="px-6 py-8">
        <Hero7
          heading="Generate chatApps from your data"
          description="Importing and analyzing your Supabase database by AI and instantly build your app"
          buttonComponent={
            <CreateAppButton
              onRequireSubscription={() => setIsPricingOpen(true)}
              className="mt-10 inline-flex h-12 px-6 text-base rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              Connect Database to Start
            </CreateAppButton>
          }
        />

        {/* Pricing Modal */}
        <PricingModal
          isOpen={isPricingOpen}
          onClose={() => setIsPricingOpen(false)}
        />
        {/* Main headline section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">MyApps</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by Name"
                className="pl-9 w-72"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={(
                  value: "all" | "published" | "draft" | "generating"
                ) => setStatusFilter(value)}
              >
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="generating">Generating</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center rounded-md border border-border p-1">
              <Button
                variant={view === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("grid")}
              >
                <LayoutGrid className="size-4 mr-1" />
              </Button>
              <Button
                variant={view === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("list")}
              >
                <ListIcon className="size-4 mr-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main content list */}
        {view === "grid" ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredApps.map((app) => (
                <Card
                  key={app.id}
                  className="hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => {
                    if (app.status === "generating") {
                      router.push(`/generate?appId=${app.id}`);
                    } else {
                      extractAndSaveQueries(app);
                      console.log("app", app);

                      router.push(`/preview?id=${app.id}`);
                    }
                  }}
                >
                  <CardContent className="px-4 py-0.5">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{app.name}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${
                              app.status === "published"
                                ? "bg-green-100 text-green-700"
                                : app.status === "generating"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {app.status === "generating"
                              ? "Generating"
                              : app.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {app.description}
                        </p>
                      </div>
                      {app.status === "generating" ? null : (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deletingId === app.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            extractAndSaveQueries(app);
                            router.push(`/app/${app.id}/versions`);
                          }}
                        >
                          <Info className="size-4 text-blue-600" />
                        </Button>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <div className="truncate">
                        <span className="text-foreground/80">Project ID: </span>
                        <span className="font-mono">
                          {app.data_connections?.connection_info?.project_id ||
                            "-"}
                        </span>
                      </div>
                      <div className="truncate">
                        <span className="text-foreground/80">
                          Access Token:{" "}
                        </span>
                        <span className="font-mono">
                          {app.data_connections?.connection_info
                            ?.access_token || "-"}
                        </span>
                      </div>
                      {/* <div className="truncate text-right md:text-left">
                        <span className="text-foreground/80">
                          Valued Questions:{" "}
                        </span>
                        <span className="tabular-nums">{app.features}</span>
                      </div> */}

                      <div className="truncate">
                        <span className="text-foreground/80">
                          Last Edit Date:{" "}
                        </span>
                        <span className="tabular-nums">
                          {app.updated_at
                            ? new Date(app.updated_at).toLocaleDateString(
                                "en-CA"
                              )
                            : "-"}
                        </span>
                      </div>
                      <div className="truncate">
                        <span className="text-foreground/80">
                          Published Date:{" "}
                        </span>
                        <span className="tabular-nums">
                          {app.published_at
                            ? new Date(app.published_at).toLocaleDateString(
                                "en-CA"
                              )
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[20%]">Name</TableHead>
                    <TableHead className="w-[8%]">Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[15%]">Project ID</TableHead>
                    <TableHead className="w-[15%]">Access Token</TableHead>
                    <TableHead className="w-[15%]">API Key</TableHead>
                    <TableHead className="w-[10%]">Last Edit Date</TableHead>
                    <TableHead className="w-[10%]">Published Date</TableHead>
                    <TableHead className="w-[8%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApps.map((app) => (
                    <TableRow
                      key={app.id}
                      onClick={() => {
                        if (app.status === "generating") {
                          router.push(`/generate?appId=${app.id}`);
                        } else {
                          extractAndSaveQueries(app);
                          router.push(`/preview?id=${app.id}`);
                        }
                      }}
                      className="cursor-pointer hover:bg-muted/40"
                    >
                      <TableCell className="font-medium truncate">
                        {app.name}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            app.status === "published"
                              ? "bg-green-100 text-green-700"
                              : app.status === "generating"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {app.status === "generating"
                            ? "Generating"
                            : app.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground truncate max-w-[260px]">
                        {app.description}
                      </TableCell>
                      <TableCell className="truncate text-xs text-muted-foreground">
                        {app.data_connections?.connection_info?.project_id ||
                          "-"}
                      </TableCell>
                      <TableCell className="truncate text-xs text-muted-foreground font-mono max-w-[260px]">
                        {app.data_connections?.connection_info?.access_token ||
                          "-"}
                      </TableCell>
                      <TableCell className="truncate text-xs text-muted-foreground font-mono max-w-[260px]">
                        {app.data_connections?.connection_info?.api_key || "-"}
                      </TableCell>
                      {/* <TableCell className="text-center tabular-nums">
                        {app.features}
                      </TableCell> */}
                      <TableCell className="tabular-nums">
                        {app.updated_at
                          ? new Date(app.updated_at).toLocaleDateString("en-CA")
                          : "-"}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {app.published_at
                          ? new Date(app.published_at).toLocaleDateString(
                              "en-CA"
                            )
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {app.status === "generating" ? null : app.status ===
                            "published" ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={deletingId === app.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                extractAndSaveQueries(app);
                                router.push(`/app/${app.id}/versions`);
                              }}
                            >
                              <Info className="size-4 text-blue-600" />
                            </Button>
                          ) : null}
                          {app.status === "generating" ? null : app.status ===
                            "draft" ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={deletingId === app.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(app.id);
                              }}
                            >
                              {deletingId === app.id ? (
                                <div className="size-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
                              ) : (
                                <Trash2 className="size-4 text-destructive" />
                              )}
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
