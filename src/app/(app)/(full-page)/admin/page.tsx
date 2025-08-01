"use client";

import { TabPanels } from "@/components/TabPanels";
import { Users } from "lucide-react";
import AdminDashboardTabUsers from "./_components/AdminDashboardTabUsers";
import { useQueryState } from "nuqs";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useQueryState("tab", {
    defaultValue: "users",
    parse: (value) => (["users"].includes(value) ? value : "users"),
  });

  const tabs = [
    {
      value: "users",
      label: "Users",
      icon: Users,
      content: <AdminDashboardTabUsers />,
    },
  ];

  return (
    <main className="mx-auto grid w-full max-w-[var(--container-max-width)] grid-rows-[auto_1fr] gap-2 overflow-hidden px-0 px-4 md:px-4">
      <h1 className="text-2xl font-medium">Admin Panel</h1>

      <TabPanels
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        classNames={{
          root: "grid h-full grid-rows-[auto_1fr] gap-4 overflow-hidden",
          content: "grid h-full overflow-hidden",
        }}
      />
    </main>
  );
}
