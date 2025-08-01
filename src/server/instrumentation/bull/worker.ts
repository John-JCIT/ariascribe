import { type Job, type JobProgress, Worker } from "bullmq";
import { PrismaClient } from "@/generated/prisma";
import { QUEUE_TYPES, WORKER_NAME, type WorkerContext } from "./types";
import { bullConnection } from "./connection";

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
