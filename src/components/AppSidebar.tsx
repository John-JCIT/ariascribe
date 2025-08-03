"use client";

import {
  Home,
  Stethoscope,
  AudioLines,
  ClipboardList,
  Settings,
  FileAudio,
  FileText,
  CreditCard,
  BarChart3,
  Search,
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

// Clinical navigation is now the default - original navigation removed

export function AppSidebar() {
  const user = useCurrentUser();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Stethoscope className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">AriaScribe</span>
            <span className="text-xs text-muted-foreground">Clinical Dashboard</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
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
      </SidebarContent>

      <SidebarFooter>
        {/* Footer content can be added here if needed */}
      </SidebarFooter>
    </Sidebar>
  );
}