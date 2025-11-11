"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useApps, App } from "@/hooks/useApps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Eye, Plus } from "lucide-react";

export default function TestAppsPage() {
  const { user, session } = useAuth();
  const { apps, loading, error, fetchApps, createApp, updateApp, deleteApp } =
    useApps();

  // 表单状态
  const [showForm, setShowForm] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    tags: "",
    is_public: false,
  });

  // 搜索和过滤状态
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // 加载应用列表
  useEffect(() => {
    if (user) {
      fetchApps({ user_id: user.id });
    }
  }, [user]);

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const appData = {
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category || undefined,
        tags: formData.tags
          ? formData.tags.split(",").map((tag) => tag.trim())
          : undefined,
      };

      if (editingApp) {
        await updateApp(editingApp.id, appData);
        setEditingApp(null);
      } else {
        await createApp(appData);
      }

      // 重置表单
      setFormData({
        name: "",
        description: "",
        category: "",
        tags: "",
        is_public: false,
      });
      setShowForm(false);
    } catch (err) {
      console.log("操作失败:", err);
    }
  };

  // 处理编辑
  const handleEdit = (app: App) => {
    setEditingApp(app);
    setFormData({
      name: app.name,
      description: app.description || "",
      category: app.category || "",
      tags: app.tags?.join(", ") || "",
      is_public: app.is_public,
    });
    setShowForm(true);
  };

  // 处理删除
  const handleDelete = async (id: string) => {
    if (confirm("确定要删除这个应用吗？")) {
      try {
        await deleteApp(id);
      } catch (err) {
        console.log("删除失败:", err);
      }
    }
  };

  // 处理搜索
  const handleSearch = () => {
    fetchApps({
      search: searchTerm,
      category: categoryFilter,
      status: statusFilter,
      user_id: user?.id,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h1>
          <p className="text-gray-600">此页面需要登录后才能访问</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">应用管理测试</h1>
          <Button
            onClick={() => {
              setEditingApp(null);
              setFormData({
                name: "",
                description: "",
                category: "",
                tags: "",
                is_public: false,
              });
              setShowForm(true);
            }}
            className="bg-black hover:bg-gray-900"
          >
            <Plus className="w-4 h-4 mr-2" />
            创建应用
          </Button>
        </div>

        {/* 搜索和过滤 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>搜索和过滤</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">搜索</Label>
                <Input
                  id="search"
                  placeholder="搜索应用名称或描述"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="category">分类</Label>
                <Input
                  id="category"
                  placeholder="分类"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="status">状态</Label>
                <select
                  id="status"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">全部</option>
                  <option value="draft">草稿</option>
                  <option value="published">已发布</option>
                  <option value="archived">已归档</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} className="w-full">
                  搜索
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 创建/编辑表单 */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingApp ? "编辑应用" : "创建应用"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">应用名称 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">分类</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">描述</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="tags">标签（用逗号分隔）</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                    placeholder="AI, 工具, 生产力"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={formData.is_public}
                    onChange={(e) =>
                      setFormData({ ...formData, is_public: e.target.checked })
                    }
                  />
                  <Label htmlFor="is_public">公开应用</Label>
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" disabled={loading}>
                    {editingApp ? "更新" : "创建"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    取消
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 错误信息 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* 应用列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-8 text-gray-600">
              加载中...
            </div>
          ) : apps.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-600">
              暂无应用
            </div>
          ) : (
            apps.map((app) => (
              <Card key={app.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{app.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {app.description || "暂无描述"}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(app)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(app.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          app.status === "published" ? "default" : "secondary"
                        }
                      >
                        {app.status === "draft"
                          ? "草稿"
                          : app.status === "published"
                          ? "已发布"
                          : "已归档"}
                      </Badge>
                      {app.is_public && <Badge variant="outline">公开</Badge>}
                    </div>
                    {app.category && (
                      <p className="text-sm text-gray-600">
                        分类: {app.category}
                      </p>
                    )}
                    {app.connection_id && (
                      <div className="text-sm">
                        <p className="text-gray-600">
                          数据连接: {app.connection_id}
                        </p>
                        {app.data_connections?.connection_info && (
                          <div className="mt-1 p-2 bg-gray-50 rounded text-xs">
                            <p className="font-medium">连接信息:</p>
                            <pre className="text-gray-600 whitespace-pre-wrap">
                              {JSON.stringify(
                                app.data_connections.connection_info,
                                null,
                                2
                              )}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                    {app.tags && app.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {app.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {app.view_count}
                      </span>
                      <span>❤️ {app.like_count}</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Created:{" "}
                      {new Date(app.created_at).toLocaleDateString("en-US")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
