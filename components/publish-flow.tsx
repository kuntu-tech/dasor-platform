"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, CheckCircle2, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/AuthProvider";
export function PublishFlow() {
  const router = useRouter();
  const { session } = useAuth();
  const [appName, setAppName] = useState("");
  const [description, setDescription] = useState("");
  const [monetization, setMonetization] = useState("free");
  const [paymentPrice, setPaymentPrice] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  const [featureCount, setFeatureCount] = useState(0);
  const currentAppUrl = localStorage.getItem("currentAppUrl") || "";

  useEffect(() => {
    // setIsPublished(true);
    const stored = localStorage.getItem("currentApp");
    if (stored) {
      try {
        const app = JSON.parse(stored);
        setFeatureCount(app.features?.length || 0);
      } catch (e) {
        console.error("Failed to parse current app", e);
      }
    }
  }, []);

  const handlePublish = async () => {
    // const stored = localStorage.getItem("currentApp");
    // if (stored) {
    //   try {
    //     const app = JSON.parse(stored);
    //     app.name = appName;
    //     app.description = description;
    //     app.monetization = monetization;
    //     app.status = "published";
    //     localStorage.setItem("currentApp", JSON.stringify(app));
    //   } catch (e) {
    //     console.error("Failed to update app", e);
    //   }
    // }

    // setTimeout(() => {
    //   setIsPublished(true);
    // }, 1000);
    try {
      const response = await fetch("/api/apps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          name: appName.trim(),
          description: description.trim(),
          payment_model: JSON.stringify({
            model: monetization,
            price: Number(paymentPrice),
          }),
          status: "published",
          app_version: "1.0.0",
          build_status: "success",
          deployment_status: "success",
          published_at: new Date().toISOString(),
          connection_id: "42d2234c-7dca-4199-87fb-56fa26b7b50f",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          // 重名错误，显示特定提示
          alert(data.error || "应用名称已存在，请使用其他名称");
          return;
        }
        throw new Error(data.error || "保存失败");
      }

      console.log("应用保存成功:", data);
      setIsPublished(true);
    } catch (error) {
      console.log("应用保存失败:", error);
    }
  };

  if (isPublished) {
    return (
      <div className="min-h-screen bg-background">
        {/* Top navigation removed for a cleaner publish success view */}

        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="size-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="size-8 text-green-600" />
              </div>
              <CardTitle className="mb-2 text-2xl">
                APP Created Successfully!
              </CardTitle>

              {/* App Details Section */}
              <div className="w-full max-w-lg space-y-4 mb-8">
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-600">
                    You can now copy and paste these details into ChatGPT to
                    create your application
                  </p>
                </div>

                {/* URL */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    URL
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={currentAppUrl}
                      readOnly
                      className="flex-1 bg-gray-50"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigator.clipboard.writeText(currentAppUrl)
                      }
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Name
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={appName}
                      readOnly
                      className="flex-1 bg-gray-50"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(appName)}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Description
                  </Label>
                  <div className="flex items-start gap-2">
                    <Textarea
                      value={description}
                      readOnly
                      className="flex-1 bg-gray-50 min-h-[60px]"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(description)}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" asChild>
                  <Link href="/">Return to home</Link>
                </Button>
                <Button>Go to ChatGPT</Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top navigation removed on publish page */}

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Publish</h1>
          <p className="text-muted-foreground">
            Name your ChatApp and choose monetization model
          </p>
          {featureCount > 0 && (
            <Badge variant="outline" className="mt-2">
              Contains {featureCount} features
            </Badge>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ChatApp Information</CardTitle>
            <CardDescription>
              This information will be displayed in the ChatGPT App Store
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="app-name">ChatApp Name *</Label>
              <Input
                id="app-name"
                placeholder="e.g., E-commerce Operations Assistant"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">ChatApp Description *</Label>
              <Textarea
                id="description"
                placeholder="Briefly describe your ChatApp
's features and purpose..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-3">
              <Label>Monetization Model</Label>
              <RadioGroup value={monetization} onValueChange={setMonetization}>
                <div className="flex items-start space-x-3 border border-border rounded-lg p-4">
                  <RadioGroupItem value="free" id="free" className="mt-1" />
                  <div className="flex-1">
                    <Label
                      htmlFor="free"
                      className="font-medium cursor-pointer"
                    >
                      Free
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      All users can use your ChatApp for free
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 border border-border rounded-lg p-4">
                  <RadioGroupItem
                    value="subscription"
                    id="subscription"
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="subscription"
                      className="font-medium cursor-pointer"
                    >
                      Subscription
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Users need to pay for a subscription to use your ChatApp
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {monetization === "subscription" && (
              <div className="space-y-2">
                <Label htmlFor="price">Subscription Price (Monthly)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">¥</span>
                  <Input
                    id="price"
                    type="number"
                    placeholder="9.9"
                    className="flex-1"
                    value={paymentPrice}
                    onChange={(e) => setPaymentPrice(Number(e.target.value))}
                  />
                </div>
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handlePublish}
              disabled={!appName || !description}
            >
              Generate URL
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
