import { unstable_ViewTransition as ViewTransition } from "react";
import LandingPageHeader from "./home/_components/LandingPageHeader";
import LandingFooter from "./home/_components/LandingFooter";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <LandingPageHeader />
      <main className="mx-auto mt-[var(--header-height)] flex w-full max-w-[var(--container-max-width)] flex-1 flex-col px-4">
        <ViewTransition name="page">{children}</ViewTransition>
      </main>
      <LandingFooter />
    </div>
  );
}
