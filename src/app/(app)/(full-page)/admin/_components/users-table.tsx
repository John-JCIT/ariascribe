"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { authClient } from "@/server/auth/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type AuthUserType } from "@/server/auth";
import { ImpersonateUser } from "./impersonate-user";
import { Spinner } from "@/components/Spinner";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useAutoAnimate } from "@formkit/auto-animate/react";

export default function UsersTable() {
  const currentUser = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [tableBodyRef] = useAutoAnimate();

  const {
    isLoading,
    data: usersResponse,
    error,
  } = useQuery({
    queryKey: ["admin_list_user"],
    queryFn: async () =>
      await authClient.admin.listUsers({
        query: {},
      }),
  });

  const users = usersResponse?.data?.users as
    | (AuthUserType & {
        role?: string;
        banned?: boolean;
      })[]
    | undefined;

  if (isLoading) return <Spinner size="lg" className="h center my-8" />;

  if (error || (!isLoading && !users)) {
    return (
      <div className="h flex justify-center text-red-500">
        {error?.message ?? "Failed to load users."}
      </div>
    );
  }

  const filteredUsers =
    users?.filter((user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  return (
    <div className="grid grid-rows-[auto_1fr] gap-4 overflow-hidden">
      <div className="w-full max-w-xs">
        <Input
          placeholder="Search by email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="overflow-y-auto">
        <Table>
          <TableHeader className="bg-background/50 sticky top-0 z-50 backdrop-blur-lg">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          {/* Use 'filteredUsers' for mapping */}
          <TableBody ref={tableBodyRef}>
            {/* Adjusted empty state message */}
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.username ?? ""}</TableCell>
                  <TableCell>{user.role ?? "User"}</TableCell>
                  <TableCell>
                    {user.emailVerified ? (
                      <Badge
                        color="primary"
                        variant="outline"
                        size="sm"
                        className="text-center"
                      >
                        Verified
                      </Badge>
                    ) : (
                      <Badge
                        color="destructive"
                        variant="outline"
                        size="sm"
                        className="text-center"
                      >
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.banned ? (
                      <Badge
                        color="destructive"
                        size="sm"
                        variant="outline"
                        className="text-center"
                      >
                        Banned
                      </Badge>
                    ) : (
                      <Badge
                        color="primary"
                        variant="outline"
                        size="sm"
                        className="text-center"
                      >
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.createdAt), "PPP")}
                  </TableCell>
                  <TableCell>
                    <div className="h gap-2">
                      <ImpersonateUser
                        userId={user.id}
                        currentUserId={currentUser?.id}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground py-4 text-center"
                >
                  {searchTerm
                    ? `No users found matching "${searchTerm}"`
                    : "No users exist yet."}
                </TableCell>
              </TableRow>
            )}
            {/* Removed loading placeholder rows */}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
