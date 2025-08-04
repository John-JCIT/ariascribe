import { Queue, type JobsOptions, type Job, type JobProgress } from "bullmq";
import { bullConnection } from "@/server/instrumentation/bull/connection";
import { QUEUE_TYPES, type MbsIngestXmlJobData, type MbsGenerateEmbeddingsJobData, type MbsUpdateSearchVectorsJobData } from "@/server/instrumentation/bull/types";
import { serverEnv } from "@/env";

export class MbsQueueService {
  private queue: Queue;

  constructor() {
    this.queue = new Queue(serverEnv.MBS_QUEUE_NAME, {
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
  async queueEmbeddingGeneration(data: MbsGenerateEmbeddingsJobData, priority = 0, parentJobId?: string): Promise<string> {
    const jobOptions: JobsOptions = {
      priority,
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: 5,
      removeOnFail: 20,
    };

    // Add parent dependency if provided
    if (parentJobId) {
      jobOptions.parent = {
        id: parentJobId,
        queue: "aria-scribe-worker",
      };
    }

    const job = await this.queue.add(
      QUEUE_TYPES.MBS_GENERATE_EMBEDDINGS,
      data,
      jobOptions
    );

    const dependencyMsg = parentJobId ? ` (depends on job ${parentJobId})` : '';
    console.log(`🧠 Queued MBS embedding generation job: ${job.id} for ${data.itemIds?.length ?? 'all'} items${dependencyMsg}`);
    return job.id!;
  }

  /**
   * Queue search vector update job
   */
  async queueSearchVectorUpdate(data: MbsUpdateSearchVectorsJobData, priority = 0, parentJobId?: string): Promise<string> {
    const jobOptions: JobsOptions = {
      priority,
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 5,
      removeOnFail: 10,
    };

    // Add parent dependency if provided
    if (parentJobId) {
      jobOptions.parent = {
        id: parentJobId,
        queue: "aria-scribe-worker",
      };
    }

    const job = await this.queue.add(
      QUEUE_TYPES.MBS_UPDATE_SEARCH_VECTORS,
      data,
      jobOptions
    );

    const dependencyMsg = parentJobId ? ` (depends on job ${parentJobId})` : '';
    console.log(`🔍 Queued MBS search vector update job: ${job.id} for ${data.itemIds?.length ?? 'all'} items${dependencyMsg}`);
    return job.id!;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<{
    id: string | undefined;
    name: string;
    data: unknown;
    progress: JobProgress;
    returnvalue: unknown;
    failedReason: string;
    processedOn: number | undefined;
    finishedOn: number | undefined;
    opts: JobsOptions;
  } | null> {
    const job = await this.queue.getJob(jobId) as Job | undefined;
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
    const waiting = await this.queue.getWaitingCount();
    const active = await this.queue.getActiveCount();
    const completed = await this.queue.getCompletedCount();
    const failed = await this.queue.getFailedCount();

    return {
      waiting,
      active,
      completed,
      failed,
      total: waiting + active + completed + failed,
    };
  }

  /**
   * Get pipeline status for monitoring progress
   */
  async getPipelineStatus(xmlJobId: string, embeddingJobId: string, vectorJobId: string): Promise<{
    xmlJob: {
      id: string | undefined;
      progress: JobProgress;
      processedOn: number | undefined;
      finishedOn: number | undefined;
      failedReason: string;
    } | null;
    embeddingJob: {
      id: string | undefined;
      progress: JobProgress;
      processedOn: number | undefined;
      finishedOn: number | undefined;
      failedReason: string;
    } | null;
    vectorJob: {
      id: string | undefined;
      progress: JobProgress;
      processedOn: number | undefined;
      finishedOn: number | undefined;
      failedReason: string;
    } | null;
  }> {
    const [xmlJob, embeddingJob, vectorJob] = await Promise.all([
      this.getJobStatus(xmlJobId),
      this.getJobStatus(embeddingJobId),
      this.getJobStatus(vectorJobId),
    ]);

    return {
      xmlJob: xmlJob ? {
        id: xmlJob.id,
        progress: xmlJob.progress,
        processedOn: xmlJob.processedOn,
        finishedOn: xmlJob.finishedOn,
        failedReason: xmlJob.failedReason,
      } : null,
      embeddingJob: embeddingJob ? {
        id: embeddingJob.id,
        progress: embeddingJob.progress,
        processedOn: embeddingJob.processedOn,
        finishedOn: embeddingJob.finishedOn,
        failedReason: embeddingJob.failedReason,
      } : null,
      vectorJob: vectorJob ? {
        id: vectorJob.id,
        progress: vectorJob.progress,
        processedOn: vectorJob.processedOn,
        finishedOn: vectorJob.finishedOn,
        failedReason: vectorJob.failedReason,
      } : null,
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
   * Process full MBS ingestion pipeline with enforced sequential execution
   * 1. Ingest XML
   * 2. Generate embeddings (waits for XML completion)
   * 3. Update search vectors (waits for embeddings completion)
   */
  async queueFullIngestionPipeline(filePath: string, fileName: string, forceReprocess = false): Promise<{
    xmlJobId: string;
    embeddingJobId: string;
    vectorJobId: string;
  }> {
    // Step 1: Queue XML ingestion with high priority
    const xmlJobId = await this.queueXmlIngestion({
      filePath,
      fileName,
      forceReprocess,
    }, 10);

    console.log(`🚀 Started MBS ingestion pipeline for ${fileName}`);
    console.log(`   📋 XML Job: ${xmlJobId} (queued)`);

    // Step 2: Queue embedding generation with dependency on XML completion
    const embeddingJobId = await this.queueEmbeddingGeneration({
      batchSize: 50,
    }, 5, xmlJobId); // Pass parent job ID for dependency

    console.log(`   🧠 Embedding Job: ${embeddingJobId} (waiting for XML completion)`);

    // Step 3: Queue search vector update with dependency on embeddings completion
    const vectorJobId = await this.queueSearchVectorUpdate({}, 1, embeddingJobId); // Pass parent job ID for dependency

    console.log(`   🔍 Vector Job: ${vectorJobId} (waiting for embeddings completion)`);
    console.log(`✅ Pipeline queued: XML → Embeddings → Vectors`);

    return {
      xmlJobId,
      embeddingJobId,
      vectorJobId,
    };
  }
}