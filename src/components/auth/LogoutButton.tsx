"use client";

import { useLogout } from "@/hooks/useLogout";

export function LogoutButton() {
  const { logout } = useLogout();

  return (
    <button
      onClick={() => logout()}
      className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600 dark:bg-red-700 dark:text-white dark:hover:bg-red-600"
    >
      Logout
    </button>
  );
}
