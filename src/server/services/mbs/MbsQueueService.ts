import { Queue } from "bullmq";
import { bullConnection } from "@/server/instrumentation/bull/connection";
import { QUEUE_TYPES, type MbsIngestXmlJobData, type MbsGenerateEmbeddingsJobData, type MbsUpdateSearchVectorsJobData } from "@/server/instrumentation/bull/types";

export class MbsQueueService {
  private queue: Queue;

  constructor() {
    this.queue = new Queue("aria-scribe-worker", {
      connection: bullConnection,
    });
  }

  /**
   * Queue XML file ingestion job
   */
  async queueXmlIngestion(data: MbsIngestXmlJobData, priority = 0): Promise<string> {
    const job = await this.queue.add(
      QUEUE_TYPES.MBS_INGEST_XML,
      data,
      {
        priority,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 10, // Keep last 10 completed jobs
        removeOnFail: 50, // Keep last 50 failed jobs for debugging
      }
    );

    console.log(`📋 Queued MBS XML ingestion job: ${job.id} for file ${data.fileName}`);
    return job.id!;
  }

  /**
   * Queue embedding generation job
   */
  async queueEmbeddingGeneration(data: MbsGenerateEmbeddingsJobData, priority = 0): Promise<string> {
    const job = await this.queue.add(
      QUEUE_TYPES.MBS_GENERATE_EMBEDDINGS,
      data,
      {
        priority,
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 5,
        removeOnFail: 20,
      }
    );

    console.log(`🧠 Queued MBS embedding generation job: ${job.id} for ${data.itemIds?.length || 'all'} items`);
    return job.id!;
  }

  /**
   * Queue search vector update job
   */
  async queueSearchVectorUpdate(data: MbsUpdateSearchVectorsJobData, priority = 0): Promise<string> {
    const job = await this.queue.add(
      QUEUE_TYPES.MBS_UPDATE_SEARCH_VECTORS,
      data,
      {
        priority,
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 5,
        removeOnFail: 10,
      }
    );

    console.log(`🔍 Queued MBS search vector update job: ${job.id} for ${data.itemIds?.length || 'all'} items`);
    return job.id!;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string) {
    const job = await this.queue.getJob(jobId);
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      opts: job.opts,
    };
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const waiting = await this.queue.getWaiting();
    const active = await this.queue.getActive();
    const completed = await this.queue.getCompleted();
    const failed = await this.queue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length,
    };
  }

  /**
   * Clean up old jobs
   */
  async cleanJobs() {
    await this.queue.clean(24 * 60 * 60 * 1000, 100, 'completed'); // Remove completed jobs older than 24 hours
    await this.queue.clean(7 * 24 * 60 * 60 * 1000, 100, 'failed'); // Remove failed jobs older than 7 days
  }

  /**
   * Process full MBS ingestion pipeline
   * 1. Ingest XML
   * 2. Generate embeddings
   * 3. Update search vectors
   */
  async queueFullIngestionPipeline(filePath: string, fileName: string, forceReprocess = false): Promise<{
    xmlJobId: string;
    embeddingJobId: string;
    vectorJobId: string;
  }> {
    // Queue XML ingestion with high priority
    const xmlJobId = await this.queueXmlIngestion({
      filePath,
      fileName,
      forceReprocess,
    }, 10);

    // Queue embedding generation (will process after XML ingestion)
    const embeddingJobId = await this.queueEmbeddingGeneration({
      batchSize: 50,
    }, 5);

    // Queue search vector update (will process after embeddings)
    const vectorJobId = await this.queueSearchVectorUpdate({}, 1);

    console.log(`🚀 Queued full MBS ingestion pipeline: XML(${xmlJobId}) → Embeddings(${embeddingJobId}) → Vectors(${vectorJobId})`);

    return {
      xmlJobId,
      embeddingJobId,
      vectorJobId,
    };
  }
}