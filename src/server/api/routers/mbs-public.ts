import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { MbsSearchService } from "@/server/services/mbs/MbsSearchService";
import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@/generated/prisma";


/**
 * Factory function to create MbsSearchService instance
 */
const createMbsSearchService = (db: PrismaClient) => {
  const openaiApiKey = process.env.OPENAI_API_KEY ?? undefined;
  return new MbsSearchService(db, openaiApiKey);
};

// Input validation schemas
const searchInputSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty').max(500, 'Query too long'),
  searchType: z.enum(['text', 'semantic', 'hybrid']).optional().default('hybrid'),
  filters: z.object({
    providerType: z.enum(['G', 'S', 'AD', 'ALL']).optional(),
    category: z.string().optional(),
    includeInactive: z.boolean().optional().default(false),
    minFee: z.number().min(0).optional(),
    maxFee: z.number().min(0).optional(),
  }).optional().default({}),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
  sortBy: z.enum(['relevance', 'fee_asc', 'fee_desc', 'item_number']).optional().default('relevance'),
});

const itemNumberSchema = z.object({
  itemNumber: z.number().int().min(1, 'Item number must be positive'),
});

const enhancedSearchInputSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  searchType: z.enum(['text', 'semantic', 'hybrid']).optional().default('text'),
  intent: z.enum(['exact_item_number', 'item_number_text', 'text_search']).optional(),
  itemNumber: z.number().int().positive().optional(),
  textQuery: z.string().optional(),
  filters: z.object({
    providerType: z.enum(['G', 'S', 'AD', 'ALL']).optional(),
    category: z.string().optional(),
    includeInactive: z.boolean().optional().default(false),
    minFee: z.number().min(0).optional(),
    maxFee: z.number().min(0).optional(),
  }).optional().default({}),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
  sortBy: z.enum(['relevance', 'fee_asc', 'fee_desc', 'item_number']).optional().default('relevance'),
});

export const mbsPublicRouter = createTRPCRouter({
  /**
   * Search MBS items
   * Supports text, semantic, and hybrid search with filtering
   */
  search: publicProcedure
    .input(searchInputSchema)
    .query(async ({ input, ctx }) => {
      try {
        const searchService = createMbsSearchService(ctx.db as unknown as PrismaClient);
        
        // Check if OpenAI is available and normalize search type if needed
        const openaiApiKey = process.env.OPENAI_API_KEY;
        const isOpenAIAvailable = !!openaiApiKey;
        
        // Override search type to 'text' if OpenAI is unavailable and semantic/hybrid was requested
        const normalizedInput = { ...input };
        if (!isOpenAIAvailable && (input.searchType === 'semantic' || input.searchType === 'hybrid')) {
          normalizedInput.searchType = 'text';
          console.log(`OpenAI unavailable: normalized search type from '${input.searchType}' to 'text'`);
        }
        
        // Validate fee range
        if (input.filters?.minFee !== undefined && 
            input.filters?.maxFee !== undefined && 
            input.filters.minFee > input.filters.maxFee) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Minimum fee cannot be greater than maximum fee',
          });
        }

        const result = await searchService.search(normalizedInput);
        return result;
      } catch (error) {
        console.error('MBS search error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Search failed',
        });
      }
    }),

  /**
   * Enhanced smart search with sectioned results
   * Provides intelligent search with exact matches and related items
   */
  smartSearch: publicProcedure
    .input(enhancedSearchInputSchema)
    .query(async ({ input, ctx }) => {
      try {
        const searchService = createMbsSearchService(ctx.db as unknown as PrismaClient);
        
        // Check if OpenAI is available and normalize search type if needed
        const openaiApiKey = process.env.OPENAI_API_KEY;
        const isOpenAIAvailable = !!openaiApiKey;
        
        // Override search type to 'text' if OpenAI is unavailable and semantic/hybrid was requested
        const normalizedInput = { ...input };
        if (!isOpenAIAvailable && (input.searchType === 'semantic' || input.searchType === 'hybrid')) {
          normalizedInput.searchType = 'text';
          console.log(`OpenAI unavailable: normalized search type from '${input.searchType}' to 'text'`);
        }
        
        // Validate fee range
        if (input.filters?.minFee !== undefined && 
            input.filters?.maxFee !== undefined && 
            input.filters.minFee > input.filters.maxFee) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Minimum fee cannot be greater than maximum fee',
          });
        }

        const result = await searchService.smartSearch(normalizedInput);
        return result;
      } catch (error) {
        console.error('MBS smart search error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Smart search failed',
        });
      }
    }),

  /**
   * Get detailed information for a specific MBS item
   */
  getItem: publicProcedure
    .input(itemNumberSchema)
    .query(async ({ input, ctx }) => {
      try {
        const searchService = createMbsSearchService(ctx.db as unknown as PrismaClient);
        const item = await searchService.getItemByNumber(input.itemNumber);

        if (!item) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `MBS item ${input.itemNumber} not found`,
          });
        }

        return item;
      } catch (error) {
        console.error('MBS item lookup error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Item lookup failed',
        });
      }
    }),

  /**
   * Get health status and statistics
   */
  health: publicProcedure
    .query(async ({ ctx }) => {
      try {
        const searchService = createMbsSearchService(ctx.db as unknown as PrismaClient);
        const stats = await searchService.getHealthStats();
        
        return {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          ...stats,
        };
      } catch (error) {
        console.error('MBS health check error:', error);
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Health check failed',
        });
      }
    }),

  /**
   * Get available search filters and their options
   */
  getSearchFilters: publicProcedure
    .query(async ({ ctx }) => {
      try {
        // Get unique categories and provider types from the database
        const [categories, providerTypes] = await Promise.all([
          ctx.db.mbsItem.groupBy({
            by: ['category'],
            where: { 
              isActive: true,
              category: { not: null }
            },
            _count: { _all: true },
            orderBy: { category: 'asc' },
          }),
          ctx.db.mbsItem.groupBy({
            by: ['providerType'],
            where: { 
              isActive: true,
              providerType: { not: null }
            },
            _count: { _all: true },
            orderBy: { providerType: 'asc' },
          }),
        ]);

        return {
          categories: categories.map(c => ({
            value: c.category,
            count: c._count._all,
          })),
          providerTypes: providerTypes.map(p => ({
            value: p.providerType,
            count: p._count._all,
          })),
          searchTypes: [
            { value: 'text', label: 'Text Search', description: 'Fast keyword-based search' },
            { value: 'semantic', label: 'Semantic Search', description: 'AI-powered meaning-based search' },
            { value: 'hybrid', label: 'Smart Search', description: 'Best of both text and semantic search' },
          ],
        };
      } catch (error) {
        console.error('Get search filters error:', error);
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get search filters',
        });
      }
    }),
});
