import "@/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { TRPCReactProvider } from "@/trpc/react";

import { ThemeWrapper } from "@/context/ThemeWrapper";
import { MediaQueriesProvider } from "@/context/MediaQueriesContext";
import { Suspense } from "react";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { ErrorBoundary } from "react-error-boundary";
import { RootErrorFallback } from "@/components/RootErrorFallback";
import { KitzeUIProviders } from "@/components/core/KitzeUIProviders";
import { RegisterHotkeys } from "@/components/RegisterHotkeys";
import { hotkeys } from "@/config/hotkeys";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { APP_NAME, APP_DESCRIPTION } from "@/config/config";
import { LevaPanel } from "@/components/dev/LevaPanel";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

// you can use this instead of <ThemeColorUpdater/>  if you want it to be set based on the OS system settings

// export const viewport: Viewport = {
//   themeColor: [
//     { media: "(prefers-color-scheme: light)", color: "white" },
//     { media: "(prefers-color-scheme: dark)", color: "black" },
//   ],
// };

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="apple-mobile-web-app-title" content={APP_NAME} />
      </head>
      <body className="vertical min-h-screen">
        <NuqsAdapter>
          <TRPCReactProvider>
            <ThemeWrapper>
              <MediaQueriesProvider>
                <KitzeUIProviders>
                  <ErrorBoundary FallbackComponent={RootErrorFallback}>
                    <Suspense fallback={<FullPageSpinner />}>
                      {children}
                    </Suspense>
                  </ErrorBoundary>
                  <RegisterHotkeys hotkeys={hotkeys} />
                  <Toaster />
                </KitzeUIProviders>
              </MediaQueriesProvider>
            </ThemeWrapper>
          </TRPCReactProvider>
        </NuqsAdapter>
        <LevaPanel />
      </body>
    </html>
  );
}
