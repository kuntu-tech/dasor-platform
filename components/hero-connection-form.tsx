"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Info, AlertCircle } from "lucide-react";

interface HeroConnectionFormProps {
  onConnect?: (projectId: string, accessToken: string) => void;
}

export function HeroConnectionForm({ onConnect }: HeroConnectionFormProps) {
  const [projectId, setProjectId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [errors, setErrors] = useState<{
    projectId?: string;
    accessToken?: string;
  }>({});

  // 验证 Project ID 格式（Supabase Project ID 通常是 20 个字符的字符串）
  const validateProjectId = (value: string): string | undefined => {
    if (!value.trim()) {
      return "Project ID is required";
    }
    // Supabase Project ID 通常是字母数字组合，长度在 15-30 之间
    const projectIdPattern = /^[a-zA-Z0-9]{15,30}$/;
    if (!projectIdPattern.test(value.trim())) {
      return "Invalid Project ID format";
    }
    return undefined;
  };

  // 验证 Access Token
  const validateAccessToken = (value: string): string | undefined => {
    if (!value.trim()) {
      return "Access Token is required";
    }
    // Access Token 通常是较长的字符串，至少 20 个字符
    if (value.trim().length < 20) {
      return "Access Token seems too short";
    }
    return undefined;
  };

  const handleProjectIdChange = (value: string) => {
    setProjectId(value);
    if (errors.projectId) {
      const error = validateProjectId(value);
      setErrors((prev) => ({
        ...prev,
        projectId: error,
      }));
    }
  };

  const handleAccessTokenChange = (value: string) => {
    setAccessToken(value);
    if (errors.accessToken) {
      const error = validateAccessToken(value);
      setErrors((prev) => ({
        ...prev,
        accessToken: error,
      }));
    }
  };

  const handleConnect = () => {
    const projectIdError = validateProjectId(projectId);
    const accessTokenError = validateAccessToken(accessToken);

    if (projectIdError || accessTokenError) {
      setErrors({
        projectId: projectIdError,
        accessToken: accessTokenError,
      });
      return;
    }

    // 调用回调函数触发弹窗显示
    if (onConnect) {
      onConnect(projectId.trim(), accessToken.trim());
    }
  };

  return (
    <div className="mt-8 max-w-md mx-auto">
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <div className="space-y-4">
          {/* Project ID Input */}
          <div className="space-y-1.5">
            <Input
              placeholder="Enter your Supabase project ID"
              value={projectId}
              onChange={(e) => handleProjectIdChange(e.target.value)}
              onBlur={() => {
                const error = validateProjectId(projectId);
                setErrors((prev) => ({
                  ...prev,
                  projectId: error,
                }));
              }}
              className={`h-10 ${
                errors.projectId
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }`}
              aria-invalid={!!errors.projectId}
            />
            {errors.projectId ? (
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="size-3" />
                <span>{errors.projectId}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Info className="size-3" />
                <span>Found in Project Settings → General</span>
              </div>
            )}
          </div>

          {/* Access Token Input */}
          <div className="space-y-1.5">
            <Input
              type="password"
              placeholder="Enter your Access Token"
              value={accessToken}
              onChange={(e) => handleAccessTokenChange(e.target.value)}
              onBlur={() => {
                const error = validateAccessToken(accessToken);
                setErrors((prev) => ({
                  ...prev,
                  accessToken: error,
                }));
              }}
              className={`h-10 ${
                errors.accessToken
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }`}
              aria-invalid={!!errors.accessToken}
            />
            {errors.accessToken ? (
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="size-3" />
                <span>{errors.accessToken}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Info className="size-3" />
                <span>Found in Account Settings → Access Tokens</span>
              </div>
            )}
          </div>

          {/* Connect Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleConnect}
              disabled={!projectId.trim() || !accessToken.trim()}
              className="h-10 px-6"
              size="default"
            >
              Connect & Generate
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

