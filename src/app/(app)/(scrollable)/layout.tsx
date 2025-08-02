"use client";

import AppHeader from "@/components/core/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser();
  
  // Show sidebar only for authenticated users
  if (!user) {
    return (
      <div className="bg-background flex min-h-screen flex-col">
        <AppHeader />
        <main className="vertical mx-auto mt-[var(--header-height)] w-full max-w-[var(--container-max-width)] flex-1 px-4 py-4">
          {children}
        </main>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col">
          <AppHeader />
          <main className="vertical mx-auto mt-[var(--header-height)] w-full max-w-[var(--container-max-width)] flex-1 px-4 py-4">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
