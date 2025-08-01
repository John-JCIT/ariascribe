import AppHeader from "@/components/core/AppHeader";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid h-screen max-h-screen min-h-screen grid-rows-[auto_1fr_auto] overflow-hidden">
      <AppHeader />
      {children}
    </div>
  );
}
