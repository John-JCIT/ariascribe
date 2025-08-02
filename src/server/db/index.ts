import { PrismaClient } from "@/generated/prisma";
import { serverEnv } from "@/env";
import { IS_DEV } from "@/config/dev-prod";
import { userExtension } from "./extensions/user"; // Import the extension

function getExtendedClient() {
  return new PrismaClient({
    log: IS_DEV ? ["query", "error", "warn"] : ["error"],
  }).$extends(userExtension);
}

type ExtendedPrismaClient = ReturnType<typeof getExtendedClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined; // Use the extended type here
};

const prisma = globalForPrisma.prisma ?? getExtendedClient(); // Use the function to get the client

if (IS_DEV) globalForPrisma.prisma = prisma;

export const db = prisma;

export * from "@/generated/prisma";
