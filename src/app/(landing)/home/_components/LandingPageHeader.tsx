"use client";
import { AppHeaderUser } from "@/components/core/HeaderUser";
import { Logo } from "@/components/core/Logo";
import { aboutLink, blogLink, pricingLink } from "@/config/links";
import { useKitzeUI } from "@/components/KitzeUIContext";
import { ThemeSwitchMinimalNextThemes } from "@/components/ThemeSwitchMinimalNextThemes";
import { HeaderLinks } from "@/components/core/HeaderLinks";
import { HeaderCustomized } from "@/components/core/HeaderCustomized";
import { usePathname } from "next/navigation";

export default function LandingPageHeader() {
  const { isMobile } = useKitzeUI();
  const pathname = usePathname();

  // Hide navigation links on auth pages (signin, signup, etc.)
  const authPages = ['/signin', '/signup', '/forgot-password', '/email-verified'];
  const isAuthPage = authPages.some(authPath => 
    pathname === authPath || pathname.startsWith(authPath + '/')
  );
  const navigationLinks = isAuthPage ? [] : [blogLink, pricingLink, aboutLink];
  
  // For user dropdown, we don't want any of these marketing links - users are already logged in
  const userDropdownLinks: any[] = [];

  return (
    <HeaderCustomized
      leftSide={
        <div className="flex items-center space-x-2">
          <Logo />
        </div>
      }
      middle={isMobile || isAuthPage ? null : <HeaderLinks links={navigationLinks} />}
      renderRightSide={() => (
        <div className="flex items-center gap-2 select-none">
          <ThemeSwitchMinimalNextThemes buttonProps={{ variant: "ghost" }} />
          <AppHeaderUser links={userDropdownLinks} />
        </div>
      )}
    />
  );
}
