"use client";

import {
  Calendar,
  Home,
  Inbox,
  Search,
  BarChart3,
  Users,
  CreditCard,
  FileText,
  Stethoscope,
  AudioLines,
  ClipboardList,
  Settings,
  FileAudio,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useFeatureFlag } from "@/config/feature-flags";
import Link from "next/link";

// Clinical navigation items (Phase 1)
const clinicalNavigationItems = [
  {
    title: "Dashboard",
    url: "/app",
    icon: Home,
    description: "Today's schedule and overview",
  },
  {
    title: "Consultations",
    url: "/app/consultations",
    icon: Stethoscope,
    description: "Active and recent consultations",
  },
  {
    title: "Clinical Notes",
    url: "/app/notes",
    icon: ClipboardList,
    description: "Generated notes and review queue",
  },
  {
    title: "Audio Recordings",
    url: "/app/recordings",
    icon: FileAudio,
    description: "Audio files and processing status",
  },
];

// Clinical tools and management (Phase 1)
const clinicalToolsItems = [
  {
    title: "Templates",
    url: "/app/templates",
    icon: FileText,
    description: "Note templates and customization",
  },
  {
    title: "Billing",
    url: "/app/billing",
    icon: CreditCard,
    description: "MBS suggestions and insights",
  },
  {
    title: "Analytics",
    url: "/app/analytics",
    icon: BarChart3,
    description: "Practice insights and metrics",
  },
];

// Clinical utilities (Phase 1)
const clinicalUtilitiesItems = [
  {
    title: "Search",
    url: "/app/search",
    icon: Search,
    description: "Search consultations and notes",
  },
  {
    title: "Settings",
    url: "/app/settings",
    icon: Settings,
    description: "Practice and EHR settings",
  },
];

// Original navigation items (preserved for fallback)
const originalNavigationItems = [
  {
    title: "Dashboard",
    url: "/app",
    icon: Home,
  },
  {
    title: "Analytics",
    url: "/app/analytics",
    icon: BarChart3,
  },
  {
    title: "Users",
    url: "/app/users",
    icon: Users,
  },
  {
    title: "Billing",
    url: "/app/billing",
    icon: CreditCard,
  },
  {
    title: "Documents",
    url: "/app/documents",
    icon: FileText,
  },
];

// Original secondary items (preserved for fallback)
const originalSecondaryItems = [
  {
    title: "Calendar",
    url: "/app/calendar",
    icon: Calendar,
  },
  {
    title: "Search",
    url: "/app/search",
    icon: Search,
  },
  {
    title: "Inbox",
    url: "/app/inbox",
    icon: Inbox,
  },
];

// Removed settings and account items

export function AppSidebar() {
  const user = useCurrentUser();
  const hasClinicalNavigation = useFeatureFlag('clinical-navigation');

  // Determine which navigation to show based on feature flags
  const showClinicalInterface = user && hasClinicalNavigation;

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            {showClinicalInterface ? (
              <Stethoscope className="h-4 w-4" />
            ) : (
              <Home className="h-4 w-4" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">AriaScribe</span>
            <span className="text-xs text-muted-foreground">
              {showClinicalInterface ? "Clinical Dashboard" : "Dashboard"}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {showClinicalInterface ? (
          // Clinical Navigation Layout
          <>
            {/* Primary Clinical Navigation */}
            <SidebarGroup>
              <SidebarGroupLabel>Clinical Workflow</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {clinicalNavigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.description}>
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />

            {/* Clinical Tools & Management */}
            <SidebarGroup>
              <SidebarGroupLabel>Tools & Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {clinicalToolsItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.description}>
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />

            {/* Clinical Utilities */}
            <SidebarGroup>
              <SidebarGroupLabel>Utilities</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {clinicalUtilitiesItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.description}>
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : (
          // Original Navigation Layout (Preserved for safety)
          <>
            {/* Main Navigation */}
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {originalNavigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />

            {/* Secondary Items */}
            <SidebarGroup>
              <SidebarGroupLabel>Tools</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {originalSecondaryItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        {/* Development indicator when clinical features are enabled */}
        {showClinicalInterface && process.env.NODE_ENV === 'development' && (
          <div className="px-4 py-2">
            <div className="flex items-center gap-2 rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <AudioLines className="h-3 w-3" />
              <span>Clinical Mode</span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}