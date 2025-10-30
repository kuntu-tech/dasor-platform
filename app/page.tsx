"use client";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Filter,
  LayoutGrid,
  List as ListIcon,
  MoreHorizontal,
  ArrowRight,
  Calendar,
  Info,
} from "lucide-react";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
type AppItem = {
  id: string;
  name: string;
  description: string;
  status: "published" | "draft";
  data_connections: {
    connection_info: {
      project_id: string;
      access_token: string;
    };
  };

  features: number;
  createdAt: string;
  updated_at: string;
  published_at: string;
  visits: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "draft"
  >("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { user, session } = useAuth();

  const getApps = async () => {
    const queryParams = new URLSearchParams();

    if (user?.id) {
      console.log(user);
      queryParams.append("user_id", user.id);
    }

    // 添加时间戳防止缓存
    queryParams.append("_t", Date.now().toString());

    const response = await fetch(`/api/apps?${queryParams.toString()}`);
    const data = await response.json();
    console.log(data);
    setAppItems(data.data);
    return data;
  };
  useEffect(() => {
    if (user) {
      getApps();
    }
  }, [user]);

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
  //     createdAt: "2025-10-03",
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
    // 确认删除
    if (!confirm("确定要删除这个应用吗？此操作不可撤销。")) {
      return;
    }

    setDeletingId(id);

    try {
      // 调用后端API删除应用
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
        throw new Error(errorData.error || "删除应用失败");
      }

      // 删除成功后重新获取数据，确保数据同步
      await getApps();

      console.log("应用删除成功");
    } catch (error) {
      console.error("删除应用失败:", error);
      alert(`删除失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredApps = useMemo(() => {
    let filtered = appItems;

    // 状态筛选
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // 搜索筛选 - 只筛选name字段
    const q = query.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((a) => {
        // 只匹配name字段
        return a.name.toLowerCase().includes(q);
      });
    }

    return filtered;
  }, [appItems, query, statusFilter]);

  return (
    <div className="min-h-screen bg-background">
      <main className="px-6 py-8">
        {/* Hero Section */}
        <section className="py-16 md:py-24 mb-12 flex items-center justify-center bg-black">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Button
              size="lg"
              asChild
              className="h-12 px-6 text-base rounded-lg bg-transparent text-white hover:bg-white hover:text-black hover:backdrop-blur-sm hover:border-transparent border border-transparent transition-all duration-300"
            >
              <Link href="/connect">
                <Plus className="size-5 mr-2" /> Create Your App
              </Link>
            </Button>
          </div>
        </section>
        {/* 主标题区 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">MyApps</h1>
            <p className="text-sm text-muted-foreground">
              {filteredApps.length} apps
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="search App"
                className="pl-9 w-72"
              />
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Filter className="size-4 mr-1" />
                    {statusFilter === "all"
                      ? "All Status"
                      : statusFilter === "published"
                      ? "Published"
                      : "Draft"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem
                    onClick={() => setStatusFilter("all")}
                    className={statusFilter === "all" ? "bg-accent" : ""}
                  >
                    All Status
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatusFilter("published")}
                    className={statusFilter === "published" ? "bg-accent" : ""}
                  >
                    Published
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatusFilter("draft")}
                    className={statusFilter === "draft" ? "bg-accent" : ""}
                  >
                    Draft
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {statusFilter !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                  className="h-9 text-xs"
                >
                  Clear Filter
                </Button>
              )}
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

        {/* 主体列表区 */}
        {view === "grid" ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredApps.map((app) => (
                <Card
                  key={app.id}
                  className="hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => router.push(`/preview?id=${app.id}`)}
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
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {app.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {app.description}
                        </p>
                      </div>
                      {app.status === "published" ? (
                        // <DropdownMenu>
                        //   <DropdownMenuTrigger asChild>
                        //     <Button
                        //       variant="ghost"
                        //       size="icon"
                        //       onClick={(e) => {
                        //         e.stopPropagation();
                        //       }}
                        //     >
                        //       <MoreHorizontal className="size-4" />
                        //     </Button>
                        //   </DropdownMenuTrigger>
                        //   <DropdownMenuContent align="end">
                        //     <DropdownMenuItem
                        //       asChild
                        //       onClick={(e) => {
                        //         e.stopPropagation();
                        //       }}
                        //     >
                        //       <Link href={`/app/${app.id}/versions`}>
                        //         Versions
                        //       </Link>
                        //     </DropdownMenuItem>
                        //   </DropdownMenuContent>
                        // </DropdownMenu>

                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deletingId === app.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/preview?id=${app.id}`);
                          }}
                        >
                          <Info className="size-4 text-blue-600" />
                        </Button>
                      ) : (
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
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <div className="truncate">
                        <span className="text-foreground/80">Project ID: </span>
                        <span className="font-mono">
                          {app.data_connections.connection_info.project_id}
                        </span>
                      </div>
                      <div className="truncate">
                        <span className="text-foreground/80">
                          Access Token:{" "}
                        </span>
                        <span className="font-mono">
                          {app.data_connections.connection_info.access_token}
                        </span>
                      </div>
                      <div className="truncate text-right md:text-left">
                        <span className="text-foreground/80">
                          Valued Questions:{" "}
                        </span>
                        <span className="tabular-nums">{app.features}</span>
                      </div>

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
                    <TableHead className="w-[10%] text-center">
                      Valued Questions
                    </TableHead>
                    <TableHead className="w-[10%]">Last Edit Date</TableHead>
                    <TableHead className="w-[10%]">Published Date</TableHead>
                    <TableHead className="w-[8%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApps.map((app) => (
                    <TableRow
                      key={app.id}
                      onClick={() => router.push(`/preview?id=${app.id}`)}
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
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {app.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground truncate max-w-[260px]">
                        {app.description}
                      </TableCell>
                      <TableCell className="truncate text-xs text-muted-foreground">
                        {app.data_connections.connection_info.project_id}
                      </TableCell>
                      <TableCell className="truncate text-xs text-muted-foreground font-mono max-w-[260px]">
                        {app.data_connections.connection_info.access_token}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {app.features}
                      </TableCell>
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
                          {app.status === "published" ? (
                            // <DropdownMenu>
                            //   <DropdownMenuTrigger asChild>
                            //     <Button
                            //       variant="ghost"
                            //       size="icon"
                            //       onClick={(e) => {
                            //         e.stopPropagation();
                            //       }}
                            //     >
                            //       <MoreHorizontal className="size-4" />
                            //     </Button>
                            //   </DropdownMenuTrigger>
                            //   <DropdownMenuContent align="end">
                            //     <DropdownMenuItem
                            //       asChild
                            //       onClick={(e) => {
                            //         e.stopPropagation();
                            //       }}
                            //     >
                            //       <Link href={`/app/${app.id}/versions`}>
                            //         Versions
                            //       </Link>
                            //     </DropdownMenuItem>
                            //   </DropdownMenuContent>
                            // </DropdownMenu>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={deletingId === app.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/preview?id=${app.id}`);
                              }}
                            >
                              <Info className="size-4 text-blue-600" />
                            </Button>
                          ) : (
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
                          )}
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
