"use client";

import { CommonMenuItem } from "@/components/CommonMenuItem";
import { LogOut } from "lucide-react";
import { useLogout } from "@/hooks/useLogout";

interface LogoutMenuItemProps {
  onLogout?: () => void;
}

export function LogoutMenuItem({ onLogout }: LogoutMenuItemProps) {
  const { logout } = useLogout();

  const handleLogout = async () => {
    await logout({ onSuccess: onLogout });
  };

  return (
    <CommonMenuItem leftIcon={LogOut} destructive onClick={handleLogout}>
      Logout
    </CommonMenuItem>
  );
}
