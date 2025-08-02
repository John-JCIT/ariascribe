// @ts-check

import { auth } from "@/server/auth";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

const users: {
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
  onboarded: boolean;
  verified: boolean;
}[] = [
  {
    name: "Admin Adminovich",
    email: "admin@gmail.com",
    password: "password",
    role: "admin",
    onboarded: true,
    verified: true,
  },
  {
    name: "User 1",
    email: "user1@gmail.com",
    password: "password",
    role: "user",
    onboarded: true,
    verified: true,
  },
  {
    name: "User 2",
    email: "user2@gmail.com",
    password: "password",
    role: "user",
    onboarded: false,
    verified: true,
  },
  {
    name: "User 3",
    email: "user3@gmail.com",
    password: "password",
    role: "user",
    onboarded: false,
    verified: false,
  },
];

(async function main() {
  const [admin, user1, user2, user3] = await Promise.all(
    users.map(async (user) => {
      const res = await auth.api.signUpEmail({
        body: {
          name: user.name,
          email: user.email,
          password: user.password,
        },
      });

      await prisma.user.update({
        where: {
          id: res.user.id,
        },
        data: {
          role: user.role,
          emailVerified: user.verified,
          onboarded: user.onboarded,
        },
      });

      return res;
    }),
  );
})();
