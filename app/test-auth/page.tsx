"use client";

import { useAuth } from "@/components/AuthProvider";

export default function TestAuthPage() {
  const { user, session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          认证状态测试页面
        </h1>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">认证状态</h2>
          <div className="space-y-2">
            <p>
              <strong>登录状态:</strong> {user ? "已登录" : "未登录"}
            </p>
            <p>
              <strong>用户邮箱:</strong> {user?.email || "无"}
            </p>
            <p>
              <strong>用户名:</strong> {user?.user_metadata?.full_name || "无"}
            </p>
            <p>
              <strong>用户ID:</strong> {user?.id || "无"}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">会话信息</h2>
          <pre className="bg-white p-4 rounded border overflow-auto text-sm">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
