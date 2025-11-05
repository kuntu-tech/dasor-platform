import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";

export interface App {
  id: string;
  user_id: string;
  connection_id?: string;
  name: string;
  description?: string;
  status: "draft" | "published" | "archived";
  category?: string;
  tags?: string[];
  config?: any;
  metadata?: any;
  is_public: boolean;
  is_featured: boolean;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  users?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  data_connections?: {
    id: string;
    connection_info?: any;
  };
}

export interface AppsResponse {
  success: boolean;
  data: App[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  error?: string;
}

export interface AppResponse {
  success: boolean;
  data: App;
  error?: string;
}

export function useApps() {
  const { session } = useAuth();
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取应用列表
  const fetchApps = async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
      status?: string;
      user_id?: string;
    } = {}
  ) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.search) queryParams.append("search", params.search);
      if (params.category) queryParams.append("category", params.category);
      if (params.status) queryParams.append("status", params.status);
      if (params.user_id) queryParams.append("user_id", params.user_id);

      const response = await fetch(`/api/apps?${queryParams.toString()}`);
      const data: AppsResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "获取应用列表失败");
      }

      setApps(data.data);
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "获取应用列表失败";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 获取单个应用
  const fetchApp = async (id: string): Promise<App> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/apps/${id}`);
      const data: AppResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "获取应用失败");
      }

      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "获取应用失败";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 创建应用
  const createApp = async (appData: {
    name: string;
    description?: string;
    category?: string;
    tags?: string[];
    config?: any;
    metadata?: any;
    is_public?: boolean;
  }): Promise<App> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/apps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token && {
            Authorization: `Bearer ${session.access_token}`,
          }),
        },
        body: JSON.stringify(appData),
      });

      const data: AppResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "创建应用失败");
      }

      // 更新本地状态
      setApps((prev) => [data.data, ...prev]);
      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "创建应用失败";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 更新应用
  const updateApp = async (
    id: string,
    appData: {
      name?: string;
      description?: string;
      category?: string;
      tags?: string[];
      config?: any;
      metadata?: any;
      is_public?: boolean;
      status?: "draft" | "published" | "archived";
    }
  ): Promise<App> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/apps/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token && {
            Authorization: `Bearer ${session.access_token}`,
          }),
        },
        body: JSON.stringify(appData),
      });

      const data: AppResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "更新应用失败");
      }

      // 更新本地状态
      setApps((prev) => prev.map((app) => (app.id === id ? data.data : app)));
      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "更新应用失败";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 删除应用
  const deleteApp = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/apps/${id}`, {
        method: "DELETE",
        headers: {
          ...(session?.access_token && {
            Authorization: `Bearer ${session.access_token}`,
          }),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "删除应用失败");
      }

      // 更新本地状态
      setApps((prev) => prev.filter((app) => app.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "删除应用失败";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    apps,
    loading,
    error,
    fetchApps,
    fetchApp,
    createApp,
    updateApp,
    deleteApp,
  };
}
