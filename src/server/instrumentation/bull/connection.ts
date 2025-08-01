import { Redis } from "ioredis";
import { serverEnv } from "@/env";

// Build connection options with required fields
export const bullConnection = new Redis({
  host: serverEnv.REDIS_HOST,
  port: serverEnv.REDIS_PORT,
  maxRetriesPerRequest: null,
  ...(serverEnv.REDIS_USERNAME && { username: serverEnv.REDIS_USERNAME }),
  ...(serverEnv.REDIS_PASSWORD && { password: serverEnv.REDIS_PASSWORD }),
  ...(serverEnv.REDIS_TLS && { tls: {} }),
});

bullConnection.on("connect", () => {
  console.log("🐂 BullMQ connected to Redis");
});

bullConnection.on("error", (err) => {
  console.error("🐂 BullMQ Redis connection error:", err);
});

bullConnection.on("close", () => {
  console.log("🐂 BullMQ Redis connection closed");
});

bullConnection.on("reconnecting", () => {
  console.log("🐂 BullMQ reconnecting to Redis...");
});
