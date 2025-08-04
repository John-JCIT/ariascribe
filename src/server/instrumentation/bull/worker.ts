import { type Job, type JobProgress, Worker } from "bullmq";
import { PrismaClient } from "@/generated/prisma";
import { QUEUE_TYPES, WORKER_NAME, type WorkerContext, type MbsIngestXmlJobData, type MbsGenerateEmbeddingsJobData, type MbsUpdateSearchVectorsJobData } from "./types";
import { bullConnection } from "./connection";
import { MbsWorkerService } from "@/server/services/mbs/MbsWorkerService";
import { serverEnv } from "@/env";

const db = new PrismaClient();

export const startWorker = () => {
  const worker = new Worker(
    WORKER_NAME,
    async (job: Job) => {
      console.log(`⚙️ Processing job #${job.id} - ${job.name}`);

      const context: WorkerContext = { db };

      try {
        switch (job.name) {
          case QUEUE_TYPES.EnhanceArticleWithAI: // Example queue type
            console.log("⚙️ Enhancing article...");
            // await enhanceArticleWithAI(job.data, context); // Placeholder call
            break;

          // MBS Worker Cases
          case QUEUE_TYPES.MBS_INGEST_XML:
            await processMbsIngestXml(job.data as MbsIngestXmlJobData, context);
            break;

          case QUEUE_TYPES.MBS_GENERATE_EMBEDDINGS:
            await processMbsGenerateEmbeddings(job.data as MbsGenerateEmbeddingsJobData, context);
            break;

          case QUEUE_TYPES.MBS_UPDATE_SEARCH_VECTORS:
            await processMbsUpdateSearchVectors(job.data as MbsUpdateSearchVectorsJobData, context);
            break;

          // Add more cases for other job types specific to your application
          default:
            console.warn(`⚙️ No processor found for job name: ${job.name}`);
            break;
        }
      } catch (error) {
        console.error(`⚙️ Job #${job.id} (${job.name}) failed:`, error);
        // Rethrow the error so BullMQ marks the job as failed
        throw error;
      }
    },
    {
      connection: bullConnection,
      // Add concurrency or other worker options if needed
      // concurrency: 5,
    },
  );

  worker.on("completed", (job: Job) => {
    console.log(`✅ Job #${job.id} (${job.name}) has completed!`);
  });

  worker.on("failed", (job: Job | undefined, err: Error) => {
    // Job can be undefined if the worker crashes before processing begins
    const jobId = job?.id ?? "unknown";
    const jobName = job?.name ?? "unknown";
    console.error(
      `❌ Job #${jobId} (${jobName}) has failed with ${err.message}`,
      err.stack,
    );
  });

  worker.on("progress", (job: Job, progress: JobProgress) => {
    console.log(`🔄 Job #${job.id} (${job.name}) has progressed: ${progress}%`);
  });

  worker.on("error", (err: Error) => {
    // Log worker errors (e.g., connection issues)
    console.error("⚙️ Worker encountered an error:", err);
  });

  worker.waitUntilReady().then(() => {
    console.log("⚙️ Worker is ready and listening for jobs!");
  });

  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("⚙️ Shutting down worker...");
      await worker.close();
      console.log("⚙️ Worker shut down complete.");
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("⚙️ Shutting down worker...");
      await worker.close();
      console.log("⚙️ Worker shut down complete.");
      process.exit(0);
    });
  }

  return worker;
};

// MBS Job Processors

async function processMbsIngestXml(data: MbsIngestXmlJobData, context: WorkerContext) {
  console.log(`📋 Processing MBS XML ingestion: ${data.fileName}`);
  
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required for MBS processing");
  }

  const mbsService = new MbsWorkerService(context.db, openaiApiKey);
  const result = await mbsService.ingestXmlFile(data.filePath, data.fileName, data.forceReprocess);
  
  if (!result.success) {
    throw new Error(`MBS XML ingestion failed: ${result.errorMessage}`);
  }
  
  console.log(`✅ MBS XML ingestion completed: ${result.itemsProcessed} items processed`);
  return result;
}

async function processMbsGenerateEmbeddings(data: MbsGenerateEmbeddingsJobData, context: WorkerContext) {
  console.log(`🧠 Processing MBS embedding generation for ${data.itemIds?.length || 'all'} items`);
  
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required for MBS processing");
  }

  const mbsService = new MbsWorkerService(context.db, openaiApiKey);
  const result = await mbsService.generateEmbeddings(data.itemIds, data.batchSize);
  
  if (!result.success) {
    throw new Error(`MBS embedding generation failed: ${result.errorMessage}`);
  }
  
  console.log(`✅ MBS embedding generation completed: ${result.itemsUpdated} items updated`);
  return result;
}

async function processMbsUpdateSearchVectors(data: MbsUpdateSearchVectorsJobData, context: WorkerContext) {
  console.log(`🔍 Processing MBS search vector update for ${data.itemIds?.length || 'all'} items`);
  
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required for MBS processing");
  }

  const mbsService = new MbsWorkerService(context.db, openaiApiKey);
  const result = await mbsService.updateSearchVectors(data.itemIds);
  
  if (!result.success) {
    throw new Error(`MBS search vector update failed: ${result.errorMessage}`);
  }
  
  console.log(`✅ MBS search vector update completed: ${result.itemsUpdated} items updated`);
  return result;
};
