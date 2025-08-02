import { type PrismaClient } from "@/generated/prisma";

export const WORKER_NAME = "zts-queue";

export const QUEUE_TYPES = {
  EnhanceArticleWithAI: "enhanceArticleWithAI",
  GenerateReport: "generateReport",
} as const;

export type QueueType = (typeof QUEUE_TYPES)[keyof typeof QUEUE_TYPES];

export interface WorkerContext {
  db: PrismaClient;
}

// Define the expected data structure for each job type
// Example:
// export interface EnhanceArticleAIData {
//   articleId: string;
//   userId: string; // Assuming jobs are user-specific
// }

// export interface GenerateReportData {
//   reportType: 'daily' | 'weekly';
//   userId: string;
// }
