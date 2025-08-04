import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";
import { MbsQueueService } from "@/server/services/mbs/MbsQueueService";
import { TRPCError } from "@trpc/server";

/**
 * Factory function to create MbsQueueService instance
 * This improves testability and resource management by avoiding singleton pattern
 */
const createMbsQueueService = () => new MbsQueueService();

export const mbsAdminRouter = createTRPCRouter({
  /**
   * Queue XML ingestion job
   */
  queueXmlIngestion: adminProcedure
    .input(z.object({
      filePath: z.string(),
      fileName: z.string(),
      forceReprocess: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      try {
        const mbsQueueService = createMbsQueueService();
        const jobId = await mbsQueueService.queueXmlIngestion(input);
        return { success: true, jobId };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to queue XML ingestion',
        });
      }
    }),

  /**
   * Queue embedding generation job
   */
  queueEmbeddingGeneration: adminProcedure
    .input(z.object({
      itemIds: z.array(z.number()).optional(),
      batchSize: z.number().min(1).max(100).default(50),
    }))
    .mutation(async ({ input }) => {
      try {
        const mbsQueueService = createMbsQueueService();
        const jobId = await mbsQueueService.queueEmbeddingGeneration(input);
        return { success: true, jobId };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to queue embedding generation',
        });
      }
    }),

  /**
   * Queue full ingestion pipeline
   */
  queueFullPipeline: adminProcedure
    .input(z.object({
      filePath: z.string(),
      fileName: z.string(),
      forceReprocess: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      try {
        const mbsQueueService = createMbsQueueService();
        const result = await mbsQueueService.queueFullIngestionPipeline(
          input.filePath,
          input.fileName,
          input.forceReprocess
        );
        return { success: true, ...result };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to queue full pipeline',
        });
      }
    }),

  /**
   * Get job status
   */
  getJobStatus: adminProcedure
    .input(z.object({
      jobId: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const mbsQueueService = createMbsQueueService();
        const status = await mbsQueueService.getJobStatus(input.jobId);
        return status;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get job status',
        });
      }
    }),

  /**
   * Get queue statistics
   */
  getQueueStats: adminProcedure
    .query(async () => {
      try {
        const mbsQueueService = createMbsQueueService();
        const stats = await mbsQueueService.getQueueStats();
        return stats;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get queue stats',
        });
      }
    }),

  /**
   * Get ingestion logs
   */
  getIngestionLogs: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const logs = await ctx.db.mbsIngestionLog.findMany({
          take: input.limit,
          skip: input.offset,
          orderBy: {
            startedAt: 'desc',
          },
        });

        const total = await ctx.db.mbsIngestionLog.count();

        return {
          logs,
          total,
          hasMore: input.offset + input.limit < total,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get ingestion logs',
        });
      }
    }),

  /**
   * Get MBS item statistics
   */
  getItemStats: adminProcedure
    .query(async ({ ctx }) => {
      try {
        const [
          totalItems,
          activeItems,
          itemsWithEmbeddings,
          categoryCounts,
          providerTypeCounts,
        ] = await Promise.all([
          ctx.db.mbsItem.count(),
          ctx.db.mbsItem.count({ where: { isActive: true } }),
          // Count items that have embeddings (embedding field is not null)
          ctx.db.$queryRaw<[{ count: bigint }]>`
            SELECT COUNT(*) as count 
            FROM mbs.items 
            WHERE embedding IS NOT NULL
          `.then(result => Number(result[0]?.count ?? 0)),
          ctx.db.mbsItem.groupBy({
            by: ['category'],
            _count: true,
            where: { isActive: true },
            orderBy: { _count: { category: 'desc' } },
            take: 10,
          }),
          ctx.db.mbsItem.groupBy({
            by: ['providerType'],
            _count: true,
            where: { isActive: true },
            orderBy: { _count: { providerType: 'desc' } },
          }),
        ]);

        return {
          totalItems,
          activeItems,
          itemsWithEmbeddings,
          categoryCounts: categoryCounts.map(c => ({
            category: c.category,
            count: c._count,
          })),
          providerTypeCounts: providerTypeCounts.map(p => ({
            providerType: p.providerType,
            count: p._count,
          })),
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get item stats',
        });
      }
    }),

  /**
   * Clean up old jobs
   */
  cleanJobs: adminProcedure
    .mutation(async () => {
      try {
        const mbsQueueService = createMbsQueueService();
        await mbsQueueService.cleanJobs();
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to clean jobs',
        });
      }
    }),
});