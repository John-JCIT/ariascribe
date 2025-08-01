import { CommonMenuItem } from "@/components/CommonMenuItem";
import { Settings, UserCog, Crown } from "lucide-react";
import { LogoutMenuItem } from "@/components/auth/LogoutMenuItem";
import { type LucideIcon } from "lucide-react";
import { useSettingsDialog } from "@/hooks/useSettingsDialog";
import { useDialog } from "@/components/DialogManager";
import { EditEntityDialog } from "@/components/EditEntityDialog";
import EditProfileFormWithData from "@/components/forms/EditProfileForm/EditProfileFormWithData";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUserBillingStatus } from "@/hooks/useUserBillingStatus";
import { authClient } from "@/server/auth/client";
import { CustomBadge } from "@/components/CustomBadge";
import { clientEnv } from "@/env/client";
import { useUpgradeToProDialog } from "@/hooks/useUpgradeToProDialog";
import { AdminStatusMenuItem } from "./AdminStatusMenuItem";
import { useIsImpersonating } from "@/hooks/useIsImpersonating";
import { SimpleTooltip } from "@/components/SimpleTooltip";

export type LinkType = {
  href: string;
  label: string;
  icon?: LucideIcon;
};

export interface HeaderUserDropdownMenuProps {
  links: LinkType[];
}

export function HeaderUserDropdownMenu({ links }: HeaderUserDropdownMenuProps) {
  const { openSettings } = useSettingsDialog();
  const { openDialog } = useDialog();
  const { openUpgradeDialog } = useUpgradeToProDialog();
  const user = useCurrentUser();
  const { data: userSession } = authClient.useSession();
  const { isPro } = useUserBillingStatus({ enabled: !!userSession });
  const { isImpersonating, impersonatedUserName } = useIsImpersonating();

  const userName = user?.name;
  const userEmail = user?.email;
  const isAdmin = user?.isAdmin;

  const handleEditProfileClick = () => {
    openDialog({
      title: "Edit Profile",
      showCloseButton: false,
      showCancel: false,
      component: EditEntityDialog,
      props: {
        Component: EditProfileFormWithData,
      },
    });
  };

  return (
    <div className="vertical gap-2 py-2">
      <div className="border-b border-gray-200 px-4 py-2 dark:border-gray-700">
        <div className="horizontal center-v gap-2">
          <div className="text-md font-medium">
            {userName ?? "User"}
            {isImpersonating && (
              <span className="ml-2 inline-flex items-center">
                <SimpleTooltip
                  content={`Impersonating ${impersonatedUserName}`}
                >
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                </SimpleTooltip>
              </span>
            )}
          </div>
          {isPro && (
            <CustomBadge color="bg-violet-500" size="sm" leftIcon={Crown}>
              Pro
            </CustomBadge>
          )}
        </div>
        {userEmail && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {userEmail}
          </div>
        )}
      </div>

      <CommonMenuItem onClick={openSettings} leftIcon={Settings}>
        Settings
      </CommonMenuItem>

      <CommonMenuItem onClick={handleEditProfileClick} leftIcon={UserCog}>
        Edit Profile
      </CommonMenuItem>

      <AdminStatusMenuItem />

      {!isPro && clientEnv.NEXT_PUBLIC_ENABLE_POLAR && (
        <CommonMenuItem leftIcon={Crown} onClick={openUpgradeDialog}>
          Upgrade to Pro
        </CommonMenuItem>
      )}

      {links.map((link) => (
        <CommonMenuItem key={link.href} href={link.href} leftIcon={link.icon}>
          {link.label}
        </CommonMenuItem>
      ))}

      <LogoutMenuItem />
    </div>
  );
}
