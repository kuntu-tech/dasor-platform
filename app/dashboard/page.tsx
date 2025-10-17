import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Plus, Database, Sparkles, ExternalLink, Settings, Calendar, Activity } from "lucide-react"

export default function DashboardPage() {
  const apps = [
    {
      id: "app-1",
      name: "E-commerce Operations Assistant",
      description: "Includes user behavior analysis, sales dashboard, inventory queries and more",
      database: "production-db",
      featureCount: 5,
      status: "Published",
      createdAt: "2025-10-10",
      visits: 1234,
    },
    {
      id: "app-2",
      name: "Data Analytics Platform",
      description: "Multi-dimensional data analysis and visualization toolkit",
      database: "analytics-db",
      featureCount: 8,
      status: "Published",
      createdAt: "2025-10-08",
      visits: 856,
    },
    {
      id: "app-3",
      name: "Customer Management System",
      description: "Customer information queries, behavior tracking, value assessment",
      database: "crm-db",
      featureCount: 6,
      status: "Draft",
      createdAt: "2025-10-05",
      visits: 0,
    },
  ]

  const hasApps = apps.length > 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="size-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold"> Datail</span>
          </Link>
          <div className="flex items-center gap-4">
            
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="mb-8 flex items-center justify-center">
          <Button className="text-center" size="lg" asChild>
            <Link href="/connect">
              <Plus className="mr-2 size-4" />
              Create Your App
            </Link>
          </Button>
        </div>

        {hasApps ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">My Applicationpp
s</h2>
              <span className="text-sm text-muted-foreground">{apps.length} Applicationpp
s total</span>
            </div>

            <div className="space-y-2">
              {apps.map((app) => (
                <Card key={app.id} className="hover:shadow-md transition-shadow leading-7">
                  <CardContent className="p-4 px-4 py-0 leading-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-semibold">{app.name}</h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              app.status === "Published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {app.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{app.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Database className="size-4" />
                            <span>{app.database}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-4" />
                            <span>{app.createdAt}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Activity className="size-4" />
                            <span>{app.visits} visits</span>
                          </div>
                          <div className="px-2 py-1 rounded bg-muted text-xs">{app.featureCount} features</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/preview?id=${app.id}&appName=${encodeURIComponent(app.name)}`}>
                            <ExternalLink className="mr-1.5 size-4" />
                            Edit
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Database className="size-8 text-muted-foreground" />
              </div>
              <CardTitle className="mb-2">No Applicationpp
s Yet</CardTitle>
              <CardDescription className="mb-6 text-center max-w-md">
                Connect your Supabase database and let AI help you generate your first Applicationpp

              </CardDescription>
              <Button asChild>
                <Link href="/connect">
                  <Plus className="mr-2 size-4" />
                  Create First Applicationpp

                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
