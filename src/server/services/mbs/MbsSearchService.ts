import type { PrismaClient } from "@/generated/prisma";
import OpenAI from "openai";
import { MbsDataService } from "./MbsDataService";
import type { 
  SearchRequest, 
  SearchResponse, 
  SearchResult, 
  SearchType,
  MbsItemSummary 
} from "./types";

interface CombinedSearchResult {
  item: MbsItemSummary;
  textRank?: number;
  semanticSimilarity?: number;
  finalScore: number;
  searchType: SearchType;
}

/**
 * Service for handling all MBS search operations
 * Supports text, semantic, and hybrid search modes
 */
export class MbsSearchService {
  private dataService: MbsDataService;
  private openai: OpenAI;

  constructor(db: PrismaClient, openaiApiKey: string) {
    this.dataService = new MbsDataService(db);
    this.openai = new OpenAI({ apiKey: openaiApiKey });
  }

  /**
   * Main search method that routes to appropriate search type
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    const startTime = Date.now();
    const {
      query,
      searchType = 'hybrid',
      filters = {},
      limit = 20,
      offset = 0,
      sortBy = 'relevance'
    } = request;

    // Validate inputs
    if (!query.trim()) {
      return {
        results: [],
        total: 0,
        hasMore: false,
        searchType,
        query,
        processingTimeMs: Date.now() - startTime,
      };
    }

    if (limit > 100) {
      throw new Error('Limit cannot exceed 100 results');
    }

    const searchOptions = {
      query: query.trim(),
      filters,
      limit,
      offset,
      sortBy,
    };

    let results: SearchResult[] = [];
    let total = 0;

    try {
      switch (searchType) {
        case 'text':
          ({ results, total } = await this.performTextSearch(searchOptions));
          break;
        case 'semantic':
          ({ results, total } = await this.performSemanticSearch(searchOptions));
          break;
        case 'hybrid':
          ({ results, total } = await this.performHybridSearch(searchOptions));
          break;
        default:
          throw new Error(`Unsupported search type: ${searchType}`);
      }
    } catch (error) {
      console.error('Search error:', error);
      // For production, we might want to fall back to text search
      if (searchType !== 'text') {
        console.log('Falling back to text search due to error');
        ({ results, total } = await this.performTextSearch({
          ...searchOptions,
        }));
      } else {
        throw error;
      }
    }

    const processingTimeMs = Date.now() - startTime;
    
    return {
      results,
      total,
      hasMore: offset + limit < total,
      searchType,
      query,
      processingTimeMs,
    };
  }

  /**
   * Perform text-only search using PostgreSQL full-text search
   */
  private async performTextSearch(options: {
    query: string;
    filters: any;
    limit: number;
    offset: number;
    sortBy: any;
  }): Promise<{ results: SearchResult[]; total: number }> {
    const { results: textResults, total } = await this.dataService.performTextSearch(options);

    const results: SearchResult[] = textResults.map(result => ({
      ...result.item,
      relevanceScore: result.rank,
      searchType: 'text' as SearchType,
      // TODO: Add highlighting in future iteration
      highlightedDescription: result.item.description,
    }));

    return { results, total };
  }

  /**
   * Perform semantic search using vector embeddings
   */
  private async performSemanticSearch(options: {
    query: string;
    filters: any;
    limit: number;
    offset: number;
    sortBy: any;
  }): Promise<{ results: SearchResult[]; total: number }> {
    // Generate embedding for the query
    const queryEmbedding = await this.generateQueryEmbedding(options.query);
    
    const { results: semanticResults, total } = await this.dataService.performSemanticSearch(
      queryEmbedding,
      options
    );

    const results: SearchResult[] = semanticResults.map(result => ({
      ...result.item,
      relevanceScore: result.similarity,
      searchType: 'semantic' as SearchType,
      highlightedDescription: result.item.description,
    }));

    return { results, total };
  }

  /**
   * Perform hybrid search combining text and semantic results
   */
  private async performHybridSearch(options: {
    query: string;
    filters: any;
    limit: number;
    offset: number;
    sortBy: any;
  }): Promise<{ results: SearchResult[]; total: number }> {
    // Run both searches in parallel with larger limits to get more candidates
    const candidateLimit = Math.min(options.limit * 3, 100); // Get more candidates for better hybrid results
    
    const [textSearchPromise, semanticSearchPromise] = await Promise.allSettled([
      this.dataService.performTextSearch({
        ...options,
        limit: candidateLimit,
        offset: 0, // Get candidates from the beginning
      }),
      this.generateQueryEmbedding(options.query).then(embedding =>
        this.dataService.performSemanticSearch(embedding, {
          ...options,
          limit: candidateLimit,
          offset: 0,
        })
      ),
    ]);

    // Extract results, handling potential failures
    const textResults = textSearchPromise.status === 'fulfilled' 
      ? textSearchPromise.value.results 
      : [];
    const semanticResults = semanticSearchPromise.status === 'fulfilled' 
      ? semanticSearchPromise.value.results 
      : [];

    // Combine and deduplicate results
    const combinedResults = this.combineSearchResults(textResults, semanticResults);

    // Sort by hybrid score
    combinedResults.sort((a, b) => b.finalScore - a.finalScore);

    // Apply pagination
    const paginatedResults = combinedResults.slice(options.offset, options.offset + options.limit);

    const results: SearchResult[] = paginatedResults.map(result => ({
      ...result.item,
      relevanceScore: result.finalScore,
      searchType: 'hybrid' as SearchType,
      highlightedDescription: result.item.description,
    }));

    // For hybrid search, total is estimated based on the unique items found
    const total = combinedResults.length;

    return { results, total };
  }

  /**
   * Combine text and semantic search results with hybrid scoring
   */
  private combineSearchResults(
    textResults: Array<{ item: MbsItemSummary; rank: number }>,
    semanticResults: Array<{ item: MbsItemSummary; similarity: number }>
  ): CombinedSearchResult[] {
    const resultMap = new Map<number, CombinedSearchResult>();

    // Add text search results
    textResults.forEach(result => {
      resultMap.set(result.item.id, {
        item: result.item,
        textRank: result.rank,
        finalScore: result.rank * 0.6, // Text search gets 60% weight initially
        searchType: 'text' as SearchType,
      });
    });

    // Add semantic search results and boost items found in both
    semanticResults.forEach(result => {
      const existing = resultMap.get(result.item.id);
      if (existing) {
        // Item found in both searches - boost the score
        existing.semanticSimilarity = result.similarity;
        existing.finalScore = (existing.textRank! * 0.4) + (result.similarity * 0.6) + 0.2; // Bonus for being in both
        existing.searchType = 'hybrid' as SearchType;
      } else {
        // Item only found in semantic search
        resultMap.set(result.item.id, {
          item: result.item,
          semanticSimilarity: result.similarity,
          finalScore: result.similarity * 0.8, // Slightly lower weight for semantic-only
          searchType: 'semantic' as SearchType,
        });
      }
    });

    return Array.from(resultMap.values());
  }

  /**
   * Generate embedding for a search query
   */
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: query,
        encoding_format: 'float',
      });

      return response.data[0]?.embedding ?? [];
    } catch (error) {
      console.error('Failed to generate query embedding:', error);
      throw new Error('Failed to generate query embedding');
    }
  }

  /**
   * Get a single item by item number
   */
  async getItemByNumber(itemNumber: number) {
    return this.dataService.getItemByNumber(itemNumber);
  }

  /**
   * Get health statistics
   */
  async getHealthStats() {
    return this.dataService.getHealthStats();
  }
}
