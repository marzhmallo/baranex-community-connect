
export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/server"
import { TrendingUp, UserPlus, Home, FileText, BarChart3 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Barangay Census Management System",
}

export default async function DashboardPage() {
  let residentCount = 0
  let householdCount = 0
  let recentActivity = []

  try {
    const supabase = createClient()

    // Get resident count
    const { count: residents, error: residentError } = await supabase
      .from("residents")
      .select("*", { count: "exact", head: true })

    if (!residentError) {
      residentCount = residents || 0
    }

    // Get household count
    const { count: households, error: householdError } = await supabase
      .from("households")
      .select("*", { count: "exact", head: true })

    if (!householdError) {
      householdCount = households || 0
    }

    // Get recent activity
    const { data: activity, error: activityError } = await supabase
      .from("activity_log")
      .select(`
    id,
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    created_at
  `)
      .order("created_at", { ascending: false })
      .limit(5)

    if (!activityError) {
      recentActivity = activity || []
    }
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error)
  }

  const stats = {
    residentCount,
    householdCount,
    recentActivity,
  }

  return (
    <>
      <div className="flex-col md:flex">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex flex-col items-start space-y-2">
            {" "}
            {/* Changed to flex-col and added space-y-2 */}
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-lg text-muted-foreground">
              Welcome to Baranex. Your partner in digital barangay management.
            </p>
          </div>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics" disabled>
                Analytics
              </TabsTrigger>
              <TabsTrigger value="reports" disabled>
                Reports
              </TabsTrigger>
              <TabsTrigger value="notifications" disabled>
                Notifications
              </TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Residents</CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{residentCount}</div>
                    <p className="text-xs text-muted-foreground">Registered individuals</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Households</CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{householdCount}</div>
                    <p className="text-xs text-muted-foreground">Registered households</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Announcements</CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <rect width="20" height="14" x="2" y="5" rx="2" />
                      <path d="M2 10h20" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">Active announcements</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Events</CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">Upcoming events</p>
                  </CardContent>
                </Card>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Population Overview</CardTitle>
                    <CardDescription>Monthly resident registration trends</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] flex items-center justify-center">
                    <div className="w-full h-full bg-muted/30 rounded-md flex items-center justify-center">
                      <TrendingUp className="h-8 w-8 text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">Population Growth Chart</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest updates in the system</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.recentActivity && stats.recentActivity.length > 0 ? (
                        stats.recentActivity.map((activity: any) => (
                          <div key={activity.id} className="flex items-center gap-4">
                            <div className="rounded-full bg-primary/10 p-2">
                              <UserPlus className="h-4 w-4 text-primary" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium">New resident registered</p>
                              <p className="text-xs text-muted-foreground">
                                {activity.first_name} {activity.last_name} -{" "}
                                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-center h-32">
                          <p className="text-muted-foreground">No recent activity</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks and operations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      <Link
                        href="/dashboard/residents/add"
                        className="flex items-center gap-2 p-3 rounded-md hover:bg-muted transition-colors"
                      >
                        <UserPlus className="h-5 w-5 text-primary" />
                        <span>Add New Resident</span>
                      </Link>
                      <Link
                        href="//dashboard/households/add"
                        className="flex items-center gap-2 p-3 rounded-md hover:bg-muted transition-colors"
                      >
                        <Home className="h-5 w-5 text-primary" />
                        <span>Register New Household</span>
                      </Link>
                      <Link
                        href="/dashboard/reports/generate"
                        className="flex items-center gap-2 p-3 rounded-md hover:bg-muted transition-colors"
                      >
                        <FileText className="h-5 w-5 text-primary" />
                        <span>Generate Report</span>
                      </Link>
                      <Link
                        href="/dashboard/statistics"
                        className="flex items-center gap-2 p-3 rounded-md hover:bg-muted transition-colors"
                      >
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <span>View Statistics</span>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Demographic Distribution</CardTitle>
                    <CardDescription>Population breakdown by age and gender</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[250px] flex items-center justify-center">
                    <div className="w-full h-full bg-muted/30 rounded-md flex items-center justify-center">
                      <BarChart3 className="h-8 w-8 text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">Demographic Chart</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}


export default Dashboard;
