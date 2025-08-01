import { ThemeProvider } from "next-themes";
import { ThemeColorUpdater } from "@/components/ThemeColorUpdater";

export const ThemeWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="theme"
      disableTransitionOnChange
    >
      {children}
      <ThemeColorUpdater />
    </ThemeProvider>
  );
};
