import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { MbsQueueService } from "@/server/services/mbs/MbsQueueService";
import { TRPCError } from "@trpc/server";

const mbsQueueService = new MbsQueueService();

export const mbsAdminRouter = createTRPCRouter({
  /**
   * Queue XML ingestion job
   */
  queueXmlIngestion: protectedProcedure
    .input(z.object({
      filePath: z.string(),
      fileName: z.string(),
      forceReprocess: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check if user has admin permissions
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required for MBS operations',
        });
      }

      try {
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
  queueEmbeddingGeneration: protectedProcedure
    .input(z.object({
      itemIds: z.array(z.number()).optional(),
      batchSize: z.number().min(1).max(100).default(50),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required for MBS operations',
        });
      }

      try {
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
  queueFullPipeline: protectedProcedure
    .input(z.object({
      filePath: z.string(),
      fileName: z.string(),
      forceReprocess: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required for MBS operations',
        });
      }

      try {
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
  getJobStatus: protectedProcedure
    .input(z.object({
      jobId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required for MBS operations',
        });
      }

      try {
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
  getQueueStats: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required for MBS operations',
        });
      }

      try {
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
  getIngestionLogs: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required for MBS operations',
        });
      }

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
  getItemStats: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required for MBS operations',
        });
      }

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
          // Note: This is a placeholder - we'll need raw SQL to count embeddings
          ctx.db.mbsItem.count(), // Will be replaced with proper embedding count
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
          itemsWithEmbeddings: itemsWithEmbeddings, // Placeholder
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
  cleanJobs: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required for MBS operations',
        });
      }

      try {
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