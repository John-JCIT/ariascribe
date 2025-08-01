"use client";
import { AppHeaderUser } from "@/components/core/HeaderUser";
import { Logo } from "@/components/core/Logo";
import { aboutLink, blogLink, pricingLink } from "@/config/links";
import { useKitzeUI } from "@/components/KitzeUIContext";
import { ThemeSwitchMinimalNextThemes } from "@/components/ThemeSwitchMinimalNextThemes";
import { HeaderLinks } from "@/components/core/HeaderLinks";
import { HeaderCustomized } from "@/components/core/HeaderCustomized";

export default function LandingPageHeader() {
  const { isMobile } = useKitzeUI();

  const navigationLinks = [blogLink, pricingLink, aboutLink];

  return (
    <HeaderCustomized
      leftSide={
        <div className="flex items-center space-x-2">
          <Logo />
        </div>
      }
      middle={isMobile ? null : <HeaderLinks links={navigationLinks} />}
      renderRightSide={() => (
        <div className="flex items-center gap-2 select-none">
          <ThemeSwitchMinimalNextThemes buttonProps={{ variant: "ghost" }} />
          <AppHeaderUser links={navigationLinks} />
        </div>
      )}
    />
  );
}
