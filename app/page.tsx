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
} from "lucide-react";
import { Trash2 } from "lucide-react";
type AppItem = {
  id: string;
  name: string;
  description: string;
  status: "Published" | "Draft";
  database: {
    url: string;
    apiKey: string;
  };
  featureCount: number;
  createdAt: string;
  lastEditedAt: string;
  publishedAt: string;
  visits: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const getUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    console.log(data);
    return data;
  };
  useEffect(() => {
    getUsers();
  }, []);

  const initialApps: AppItem[] = [
    {
      id: "app-1",
      name: "E-commerce Operations Assistant",
      description:
        "Includes user behavior analysis, sales dashboard, inventory queries and more",
      database: {
        url: "https://supabase.com/project/production",
        apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
      featureCount: 5,
      status: "Published",
      createdAt: "2025-10-01",
      lastEditedAt: "2025-10-10",
      publishedAt: "2025-10-11",
      visits: 1234,
    },
    {
      id: "app-2",
      name: "Data Analytics Platform",
      description: "Multi-dimensional data analysis and visualization toolkit",
      database: {
        url: "https://supabase.com/project/analytics",
        apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
      featureCount: 8,
      status: "Published",
      createdAt: "2025-10-03",
      lastEditedAt: "2025-10-08",
      publishedAt: "2025-10-09",
      visits: 856,
    },
    {
      id: "app-3",
      name: "Customer Management System",
      description:
        "Customer information queries, behavior tracking, value assessment",
      database: {
        url: "https://supabase.com/project/crm",
        apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
      featureCount: 6,
      status: "Draft",
      createdAt: "2025-10-02",
      lastEditedAt: "2025-10-05",
      publishedAt: "-",
      visits: 0,
    },
  ];
  const [appItems, setAppItems] = useState<AppItem[]>(initialApps);

  const handleDelete = (id: string) => {
    setAppItems((prev) => prev.filter((a) => a.id !== id));
  };

  const filteredApps = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return appItems;
    return appItems.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.database.url.toLowerCase().includes(q) ||
        a.database.apiKey.toLowerCase().includes(q)
    );
  }, [query, appItems]);

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Filter className="size-4 mr-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem>Published</DropdownMenuItem>
                <DropdownMenuItem>Draft</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                              app.status === "Published"
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
                      {app.status === "Published" ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              asChild
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <Link href={`/app/${app.id}/versions`}>
                                Versions
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(app.id);
                          }}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <div className="truncate">
                        <span className="text-foreground/80">URL: </span>
                        <span className="font-mono">{app.database.url}</span>
                      </div>
                      <div className="truncate text-right md:text-left">
                        <span className="text-foreground/80">
                          FeaturesNum:{" "}
                        </span>
                        <span className="tabular-nums">{app.featureCount}</span>
                      </div>
                      <div className="truncate">
                        <span className="text-foreground/80">API Key: </span>
                        <span className="font-mono">{app.database.apiKey}</span>
                      </div>
                      <div className="truncate">
                        <span className="text-foreground/80">
                          Last Edit Date:{" "}
                        </span>
                        <span className="tabular-nums">{app.lastEditedAt}</span>
                      </div>
                      <div className="truncate">
                        <span className="text-foreground/80">
                          Published Date:{" "}
                        </span>
                        <span className="tabular-nums">{app.publishedAt}</span>
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
                    <TableHead className="w-[15%]">URL</TableHead>
                    <TableHead className="w-[15%]">API Key</TableHead>
                    <TableHead className="w-[10%] text-center">
                      Features
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
                            app.status === "Published"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {app.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground truncate max-w-[360px]">
                        {app.description}
                      </TableCell>
                      <TableCell className="truncate text-xs text-muted-foreground">
                        {app.database.url}
                      </TableCell>
                      <TableCell className="truncate text-xs text-muted-foreground font-mono">
                        {app.database.apiKey}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {app.featureCount}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {app.lastEditedAt}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {app.publishedAt}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {app.status === "Published" ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  asChild
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  <Link href={`/app/${app.id}/versions`}>
                                    Versions
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(app.id);
                              }}
                            >
                              <Trash2 className="size-4 text-destructive" />
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
