"use client";

import { useAuth } from "@/components/AuthProvider";

export default function TestAuthPage() {
  const { user, session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Authentication Status Test Page
        </h1>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <div className="space-y-2">
            <p>
              <strong>Signed-in Status:</strong> {user ? "Signed In" : "Signed Out"}
            </p>
            <p>
              <strong>User Email:</strong> {user?.email || "N/A"}
            </p>
            <p>
              <strong>User Name:</strong>
              {user?.user_metadata?.full_name || "N/A"}
            </p>
            <p>
              <strong>User ID:</strong> {user?.id || "N/A"}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Session Information</h2>
          <pre className="bg-white p-4 rounded border overflow-auto text-sm">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
