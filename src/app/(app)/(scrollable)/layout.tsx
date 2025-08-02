"use client";

import AppHeader from "@/components/core/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { authClient } from "@/server/auth/client";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  
  // Show loading state while session is being fetched
  if (isPending) {
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

  // If no session (shouldn't happen due to middleware, but safety fallback)
  if (!session?.user) {
    return (
      <div className="bg-background flex min-h-screen flex-col">
        <AppHeader />
        <main className="vertical mx-auto mt-[var(--header-height)] w-full max-w-[var(--container-max-width)] flex-1 px-4 py-4">
          {children}
        </main>
      </div>
    );
  }

  // Authenticated user - show sidebar layout
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
