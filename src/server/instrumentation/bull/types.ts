import { type Job, type JobProgress, Worker } from "bullmq";
import { PrismaClient } from "@/generated/prisma";

export const WORKER_NAME = "aria-scribe-worker";

export const QUEUE_TYPES = {
  EnhanceArticleWithAI: "enhance-article-with-ai",
  // MBS Worker Queue Types
  MBS_INGEST_XML: "mbs-ingest-xml",
  MBS_GENERATE_EMBEDDINGS: "mbs-generate-embeddings",
  MBS_UPDATE_SEARCH_VECTORS: "mbs-update-search-vectors",
} as const;

export type QueueType = typeof QUEUE_TYPES[keyof typeof QUEUE_TYPES];

export interface WorkerContext {
  db: PrismaClient;
}

// MBS Job Data Types
export interface MbsIngestXmlJobData {
  filePath: string;
  fileName: string;
  forceReprocess?: boolean;
}

export interface MbsGenerateEmbeddingsJobData {
  itemIds?: number[]; // If not provided, process all items without embeddings
  batchSize?: number;
  startFromId?: number;
}

export interface MbsUpdateSearchVectorsJobData {
  itemIds?: number[]; // If not provided, update all items
}