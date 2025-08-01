"use client";

import React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useGlobalStore } from "@/context/GlobalStoreContext";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import {
  UserIcon,
  Settings,
  UserCog,
  Shield,
  Crown,
  SunMoon,
  LogOut,
} from "lucide-react";
import { CommandPaletteItem } from "@/components/CommandPaletteItem";
import { useDialog } from "@/components/DialogManager";
import { EditEntityDialog } from "@/components/EditEntityDialog";
import EditProfileFormWithData from "@/components/forms/EditProfileForm/EditProfileFormWithData";
import { useSettingsDialog } from "@/hooks/useSettingsDialog";
import { useTheme } from "next-themes";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUserBillingStatus } from "@/hooks/useUserBillingStatus";
import { authClient } from "@/server/auth/client";
import { clientEnv } from "@/env/client";
import { useUpgradeToProDialog } from "@/hooks/useUpgradeToProDialog";
import { useLogout } from "@/hooks/useLogout";
import {
  homeLink,
  blogLink,
  pricingLink,
  aboutLink,
  chatLink,
} from "@/config/links";

export function CommandPalette() {
  const { isCommandPaletteOpen, setCommandPaletteOpen } = useGlobalStore();
  const utils = api.useUtils();
  const { openDialog } = useDialog();
  const { openSettings } = useSettingsDialog();
  const { theme, setTheme } = useTheme();
  const { openUpgradeDialog } = useUpgradeToProDialog();
  const { logout } = useLogout();

  const user = useCurrentUser();
  const { data: userSession } = authClient.useSession();
  const { isPro } = useUserBillingStatus({ enabled: !!userSession });

  const isAdmin = user?.isAdmin;

  const resetOnboardingMutation = api.user.resetUserOnboarding.useMutation({
    onSuccess: async () => {
      await utils.user.getCurrentUser.invalidate();
      toast.success("User onboarding status has been reset.");
      setCommandPaletteOpen(false); // Close palette on success
    },
    onError: (error) => {
      toast.error(error.message);
      setCommandPaletteOpen(false);
    },
  });

  const runCommand = (command: () => void) => {
    setCommandPaletteOpen(false);
    command();
  };

  // Command handlers
  const handleResetOnboarding = () => {
    resetOnboardingMutation.mutate();
  };

  const handleEditProfile = () => {
    openDialog({
      title: "Edit Profile",
      showCloseButton: false,
      showCancel: false,
      component: EditEntityDialog,
      props: {
        Component: EditProfileFormWithData,
      },
    });
    setCommandPaletteOpen(false);
  };

  const handleSignOut = () => {
    logout({
      onSuccess: () => {
        setCommandPaletteOpen(false);
      },
    });
  };

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    setCommandPaletteOpen(false);
  };

  return (
    <CommandDialog
      open={isCommandPaletteOpen}
      onOpenChange={setCommandPaletteOpen}
    >
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="User">
          <CommandPaletteItem
            icon={UserIcon}
            loading={resetOnboardingMutation.isPending}
            disabled={resetOnboardingMutation.isPending}
            onSelect={() => runCommand(handleResetOnboarding)}
          >
            Reset Onboarding
          </CommandPaletteItem>

          <CommandPaletteItem
            icon={Settings}
            onSelect={() => runCommand(openSettings)}
          >
            Settings
          </CommandPaletteItem>

          <CommandPaletteItem
            icon={UserCog}
            onSelect={() => runCommand(handleEditProfile)}
          >
            Edit Profile
          </CommandPaletteItem>

          {isAdmin && (
            <CommandPaletteItem icon={Shield} href="/admin">
              Admin Dashboard
            </CommandPaletteItem>
          )}

          {!isPro && clientEnv.NEXT_PUBLIC_ENABLE_POLAR && (
            <CommandPaletteItem
              icon={Crown}
              onSelect={() => runCommand(openUpgradeDialog)}
            >
              Upgrade to Pro
            </CommandPaletteItem>
          )}

          <CommandPaletteItem
            icon={LogOut}
            onSelect={() => runCommand(handleSignOut)}
          >
            Sign Out
          </CommandPaletteItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Theme">
          <CommandPaletteItem
            icon={SunMoon}
            onSelect={() => runCommand(handleThemeToggle)}
          >
            Switch to {theme === "dark" ? "Light" : "Dark"} Theme
          </CommandPaletteItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandPaletteItem icon={homeLink.icon} href={homeLink.href}>
            {homeLink.label}
          </CommandPaletteItem>

          {[blogLink, pricingLink, aboutLink, chatLink].filter(Boolean).map(
            (link) =>
              link && (
                <CommandPaletteItem
                  key={link.href}
                  icon={link.icon}
                  href={link.href}
                >
                  {link.label}
                </CommandPaletteItem>
              ),
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
