import type { PrismaClient } from "@/generated/prisma";
import OpenAI from "openai";
import { MbsDataService } from "./MbsDataService";
import type { 
  SearchRequest, 
  SearchResponse, 
  SearchResult, 
  SearchType,
  MbsItemSummary,
  SearchFilters,
  SortOrder,
  EnhancedSearchRequest,
  SectionedSearchResponse,
  EnhancedSearchType,
  SearchIntent
} from "./types";

interface CombinedSearchResult {
  item: MbsItemSummary;
  textRank?: number;
  semanticSimilarity?: number;
  finalScore: number;
  searchType: EnhancedSearchType;
}

/**
 * Service for handling all MBS search operations
 * Supports text, semantic, and hybrid search modes
 */
export class MbsSearchService {
  private dataService: MbsDataService;
  private openai: OpenAI | null;

  constructor(db: PrismaClient, openaiApiKey?: string) {
    this.dataService = new MbsDataService(db);
    this.openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;
  }

  /**
   * Main search method that routes to appropriate search type
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    const startTime = Date.now();
    const {
      query,
      searchType = 'hybrid',
      filters = {} as SearchFilters,
      limit = 20,
      offset = 0,
      sortBy = 'relevance' as SortOrder
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

    if (limit < 1) {
      throw new Error('Limit must be at least 1');
    }

    if (offset < 0) {
      throw new Error('Offset cannot be negative');
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
          if (!this.openai) {
            console.log('OpenAI API key not configured, falling back to text search');
            ({ results, total } = await this.performTextSearch(searchOptions));
          } else {
            ({ results, total } = await this.performSemanticSearch(searchOptions));
          }
          break;
        case 'hybrid':
          if (!this.openai) {
            console.log('OpenAI API key not configured, falling back to text search');
            ({ results, total } = await this.performTextSearch(searchOptions));
          } else {
            ({ results, total } = await this.performHybridSearch(searchOptions));
          }
          break;
        default:
          throw new Error(`Unsupported search type: ${searchType as string}`);
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
    filters: SearchFilters;
    limit: number;
    offset: number;
    sortBy: SortOrder;
  }): Promise<{ results: SearchResult[]; total: number }> {
    const { results: textResults, total } = await this.dataService.performTextSearch(options);

    const results: SearchResult[] = textResults.map(result => ({
      ...result.item,
      relevanceScore: result.rank,
      searchType: 'text' as EnhancedSearchType,
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
    filters: SearchFilters;
    limit: number;
    offset: number;
    sortBy: SortOrder;
  }): Promise<{ results: SearchResult[]; total: number }> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured - semantic search unavailable');
    }
    
    // Generate embedding for the query
    const queryEmbedding = await this.generateQueryEmbedding(options.query);
    
    const { results: semanticResults, total } = await this.dataService.performSemanticSearch(
      queryEmbedding,
      options
    );

    const results: SearchResult[] = semanticResults.map(result => ({
      ...result.item,
      relevanceScore: result.similarity,
      searchType: 'semantic' as EnhancedSearchType,
      highlightedDescription: result.item.description,
    }));

    return { results, total };
  }

  /**
   * Perform hybrid search combining text and semantic results
   */
  private async performHybridSearch(options: {
    query: string;
    filters: SearchFilters;
    limit: number;
    offset: number;
    sortBy: SortOrder;
  }): Promise<{ results: SearchResult[]; total: number }> {
    // Run both searches in parallel with larger limits to get more candidates
    const candidateLimit = Math.min(Math.max(options.limit, 1) * 3, 100); // Get more candidates for better hybrid results
    
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
      searchType: 'hybrid' as EnhancedSearchType,
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
        searchType: 'text' as EnhancedSearchType,
      });
    });

    // Add semantic search results and boost items found in both
    semanticResults.forEach(result => {
      const existing = resultMap.get(result.item.id);
      if (existing) {
        // Item found in both searches - boost the score
        existing.semanticSimilarity = result.similarity;
        existing.finalScore = (existing.textRank! * 0.4) + (result.similarity * 0.6) + 0.2; // Bonus for being in both
        existing.searchType = 'hybrid' as EnhancedSearchType;
      } else {
        // Item only found in semantic search
        resultMap.set(result.item.id, {
          item: result.item,
          semanticSimilarity: result.similarity,
          finalScore: result.similarity * 0.8, // Slightly lower weight for semantic-only
          searchType: 'semantic' as EnhancedSearchType,
        });
      }
    });

    return Array.from(resultMap.values());
  }

  /**
   * Generate embedding for a search query
   */
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured - semantic search unavailable');
    }

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

  /**
   * Enhanced smart search with sectioned results
   * Handles different search intents and provides structured responses
   */
  async smartSearch(request: EnhancedSearchRequest): Promise<SectionedSearchResponse> {
    const startTime = Date.now();
    const { query, searchType = 'weighted_hybrid', intent, itemNumber, textQuery, filters = {}, limit = 15, offset = 0 } = request;

    // Validate and clamp inputs for robustness
    const safeLimit = Math.max(1, Math.min(limit ?? 15, 100));
    const safeOffset = Math.max(0, offset ?? 0);

    let exactMatches: SearchResult[] = [];
    let relatedMatches: SearchResult[] = [];
    let total = 0;

    try {
      // Handle exact item number search
      if (intent === 'exact_item_number' && itemNumber) {
        const exactResult = await this.searchExactItemNumber(itemNumber, filters);
        if (exactResult) {
          exactMatches = [exactResult];
          total = 1;
        }
        
        // Also get related items (items with similar numbers)
        const relatedResults = await this.searchRelatedItemNumbers(itemNumber, filters, safeLimit - 1);
        relatedMatches = relatedResults.results;
        total += relatedResults.total;
      }
      
      // Handle item number + text search
      else if (intent === 'item_number_text' && itemNumber) {
        // First, try to get the exact item and see if it matches the text query
        const exactResult = await this.searchExactItemNumber(itemNumber, filters);
        if (exactResult && textQuery) {
          const textRelevance = this.calculateTextRelevance(exactResult.description, textQuery);
          if (textRelevance > 0.3) { // Threshold for text relevance
            exactResult.relevanceScore = 1.0; // Boost exact item match
            exactResult.matchType = 'exact';
            exactMatches = [exactResult];
          }
        }
        
        // Get related items based on text query
        const textResults = await this.search({
          query: textQuery ?? query,
          searchType: 'text',
          filters,
          limit: safeLimit - exactMatches.length,
          offset: safeOffset
        });
        
        relatedMatches = textResults.results.map(result => ({
          ...result,
          matchType: 'text' as const
        }));
        
        total = exactMatches.length + textResults.total;
      }
      
      // Handle pure text search (fallback to existing behavior)
      else {
        const searchRequest: SearchRequest = {
          query,
          searchType: searchType === 'exact_item' || searchType === 'weighted_hybrid' ? 'text' : searchType,
          filters,
          limit: safeLimit,
          offset: safeOffset
        };
        const textResults = await this.search(searchRequest);
        relatedMatches = textResults.results.map(result => ({
          ...result,
          matchType: 'text' as const
        }));
        total = textResults.total;
      }

      const processingTimeMs = Date.now() - startTime;

      return {
        exactMatches,
        relatedMatches,
        total,
        hasMore: total > (safeOffset + safeLimit),
        searchType,
        query,
        intent,
        processingTimeMs
      };

    } catch (error) {
      console.error('Smart search error:', error);
      // Fallback to regular search
      const fallbackRequest: SearchRequest = {
        query,
        searchType: searchType === 'exact_item' || searchType === 'weighted_hybrid' ? 'text' : searchType,
        filters,
        limit: safeLimit,
        offset: safeOffset
      };
      const fallbackResults = await this.search(fallbackRequest);
      return {
        exactMatches: [],
        relatedMatches: fallbackResults.results,
        total: fallbackResults.total,
        hasMore: fallbackResults.hasMore,
        searchType: 'text',
        query,
        intent,
        processingTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * Search for exact item number match
   */
  private async searchExactItemNumber(itemNumber: number, filters: SearchFilters): Promise<SearchResult | null> {
    const item = await this.dataService.getItemByNumber(itemNumber);
    
    if (!item) return null;
    
    // Apply filters
    if (filters.providerType && filters.providerType !== 'ALL' && item.providerType !== filters.providerType) {
      return null;
    }
    
    if (filters.category && item.category !== filters.category) {
      return null;
    }
    
    if (!filters.includeInactive && !item.isActive) {
      return null;
    }
    
    if (filters.minFee !== undefined && (!item.scheduleFee || Number(item.scheduleFee) < filters.minFee)) {
      return null;
    }
    
    if (filters.maxFee !== undefined && (!item.scheduleFee || Number(item.scheduleFee) > filters.maxFee)) {
      return null;
    }

    return {
      ...item,
      relevanceScore: 1.0, // Perfect match
      searchType: 'exact_item' as EnhancedSearchType,
      highlightedDescription: item.description,
      matchType: 'exact'
    };
  }

  /**
   * Search for related item numbers (partial matches)
   */
  private async searchRelatedItemNumbers(itemNumber: number, filters: SearchFilters, limit: number): Promise<{ results: SearchResult[]; total: number }> {
    const itemNumberStr = itemNumber.toString();
    
    // Search for items that start with the same digits or contain the number
    const { results, total } = await this.dataService.performTextSearch({
      query: itemNumberStr,
      filters,
      limit,
      offset: 0,
      sortBy: 'item_number'
    });

    // Filter out the exact match and score based on similarity
    const relatedResults: SearchResult[] = results
      .filter(result => result.item.itemNumber !== itemNumber)
      .map(result => {
        const similarity = this.calculateItemNumberSimilarity(itemNumber, result.item.itemNumber);
        return {
          ...result.item,
          relevanceScore: similarity,
          searchType: 'text' as EnhancedSearchType,
          highlightedDescription: result.item.description,
          matchType: similarity > 0.7 ? 'partial' as const : 'text' as const
        };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    return {
      results: relatedResults,
      total: Math.max(0, total - 1) // Subtract 1 for the exact match we filtered out
    };
  }

  /**
   * Calculate similarity between item numbers
   */
  private calculateItemNumberSimilarity(target: number, candidate: number): number {
    const targetStr = target.toString();
    const candidateStr = candidate.toString();
    
    // Exact prefix match gets highest score
    if (candidateStr.startsWith(targetStr)) {
      return 0.9;
    }
    
    // Contains the number gets medium score
    if (candidateStr.includes(targetStr)) {
      return 0.6;
    }
    
    // Suffix match gets lower score
    if (candidateStr.endsWith(targetStr)) {
      return 0.4;
    }
    
    return 0.1; // Very low relevance
  }

  /**
   * Calculate text relevance score between description and query
   */
  private calculateTextRelevance(description: string, query: string): number {
    if (!description || !query) return 0;
    
    const descLower = description.toLowerCase();
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);
    
    let matches = 0;
    const totalWords = queryWords.length;
    
    for (const word of queryWords) {
      if (word.length > 2 && descLower.includes(word)) {
        matches++;
      }
    }
    
    return totalWords > 0 ? matches / totalWords : 0;
  }
}
