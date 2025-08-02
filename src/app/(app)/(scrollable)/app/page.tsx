import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  PieChart,
  Users,
  CreditCard,
  ArrowUpRight,
  Clock,
  Plus,
  Settings,
  Bell,
  Search,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function AppPage() {
  return (
    <div className="vertical space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Demo Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, legend</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <input
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border py-2 pl-10 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Search..."
          type="search"
        />
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between space-y-2">
            <h3 className="text-muted-foreground text-sm font-medium">
              Total Revenue
            </h3>
            <BarChart3 className="text-muted-foreground h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">$45,231.89</div>
            <Badge className="bg-green-100 text-green-800" color="green">
              +20.1%
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            Compared to last month
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between space-y-2">
            <h3 className="text-muted-foreground text-sm font-medium">
              Subscriptions
            </h3>
            <Users className="text-muted-foreground h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">+2,350</div>
            <Badge className="bg-green-100 text-green-800" color="green">
              +10.5%
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            New subscribers this week
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between space-y-2">
            <h3 className="text-muted-foreground text-sm font-medium">Sales</h3>
            <CreditCard className="text-muted-foreground h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">+12,234</div>
            <Badge className="bg-green-100 text-green-800" color="green">
              +15.3%
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            Total sales this month
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between space-y-2">
            <h3 className="text-muted-foreground text-sm font-medium">
              Active Users
            </h3>
            <PieChart className="text-muted-foreground h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">+573</div>
            <Badge className="bg-amber-100 text-amber-800" color="amber">
              +5.2%
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            Currently active users
          </p>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 md:grid-cols-7">
        {/* Activity Feed */}
        <Card className="col-span-4 p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {[
              "Invoice paid",
              "New subscriber",
              "New review",
              "New sale",
              "New support ticket",
            ].map((activity, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-lg border p-3"
              >
                <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-full">
                  {i % 2 === 0 ? (
                    <ArrowUpRight className="text-primary h-5 w-5" />
                  ) : (
                    <Clock className="text-primary h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm leading-none font-medium">{activity}</p>
                  <p className="text-muted-foreground text-xs">Just now</p>
                </div>
                <Button variant="ghost" size="sm">
                  View
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3 p-6">
          <h2 className="mb-6 text-xl font-semibold">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Button className="h-auto flex-col items-start justify-start p-4">
              <div className="bg-primary/10 mb-2 flex h-10 w-10 items-center justify-center rounded-full">
                <Plus className="text-primary h-5 w-5" />
              </div>
              <div className="space-y-1 text-left">
                <p className="text-background dark:text-foreground text-sm leading-none font-medium">
                  New Transaction
                </p>
                <p className="text-background dark:text-muted-foreground text-xs">
                  Add a new transaction
                </p>
              </div>
            </Button>

            <Button
              className="h-auto flex-col items-start justify-start p-4"
              variant="outline"
            >
              <div className="bg-primary/10 mb-2 flex h-10 w-10 items-center justify-center rounded-full">
                <Users className="text-primary h-5 w-5" />
              </div>
              <div className="space-y-1 text-left">
                <p className="text-sm leading-none font-medium">Manage Users</p>
                <p className="text-muted-foreground text-xs">
                  View and manage users
                </p>
              </div>
            </Button>

            <Button
              className="h-auto flex-col items-start justify-start p-4"
              variant="outline"
            >
              <div className="bg-primary/10 mb-2 flex h-10 w-10 items-center justify-center rounded-full">
                <BarChart3 className="text-primary h-5 w-5" />
              </div>
              <div className="space-y-1 text-left">
                <p className="text-sm leading-none font-medium">View Reports</p>
                <p className="text-muted-foreground text-xs">
                  Access analytics
                </p>
              </div>
            </Button>

            <Button
              className="h-auto flex-col items-start justify-start p-4"
              variant="outline"
            >
              <div className="bg-primary/10 mb-2 flex h-10 w-10 items-center justify-center rounded-full">
                <Settings className="text-primary h-5 w-5" />
              </div>
              <div className="space-y-1 text-left">
                <p className="text-sm leading-none font-medium">Settings</p>
                <p className="text-muted-foreground text-xs">
                  Configure account
                </p>
              </div>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
