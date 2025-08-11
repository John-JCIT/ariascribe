/**
 * Search-related types for MBS API
 */

export type SearchType = 'text' | 'semantic' | 'hybrid';
export type EnhancedSearchType = SearchType | 'exact_item' | 'weighted_hybrid';
export type ProviderType = 'G' | 'S' | 'AD' | 'ALL'; // GP, Specialist, Dental, All
export type SortOrder = 'relevance' | 'fee_asc' | 'fee_desc' | 'item_number';

// Search intent types from frontend query parser
export type SearchIntent = 'exact_item_number' | 'item_number_text' | 'text_search';

export interface SearchFilters {
  providerType?: ProviderType;
  category?: string;
  includeInactive?: boolean;
  minFee?: number;
  maxFee?: number;
}

export interface SearchRequest {
  query: string;
  searchType?: SearchType;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
  sortBy?: SortOrder;
}

export interface EnhancedSearchRequest extends Omit<SearchRequest, 'searchType'> {
  searchType?: EnhancedSearchType;
  intent?: SearchIntent;
  itemNumber?: number;
  textQuery?: string;
}

export interface MbsItemSummary {
  id: number;
  itemNumber: number;
  description: string;
  shortDescription?: string;
  category?: string;
  providerType?: ProviderType;
  serviceType?: string;
  scheduleFee?: number;
  benefit75?: number;
  benefit85?: number;
  benefit100?: number;
  hasAnaesthetic?: boolean;
  isActive: boolean;
  itemStartDate?: Date;
  itemEndDate?: Date;
}

export interface SearchResult extends MbsItemSummary {
  relevanceScore: number;
  searchType: EnhancedSearchType;
  highlightedDescription?: string;
  matchType?: 'exact' | 'partial' | 'text'; // Type of match for result categorization
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  hasMore: boolean;
  searchType: EnhancedSearchType;
  query: string;
  processingTimeMs: number;
}

export interface SectionedSearchResponse {
  exactMatches: SearchResult[];
  relatedMatches: SearchResult[];
  total: number;
  hasMore: boolean;
  searchType: EnhancedSearchType;
  query: string;
  intent?: SearchIntent;
  processingTimeMs: number;
}

export interface ItemDetailResponse extends MbsItemSummary {
  groupName?: string;
  subGroup?: string;
  subCategory?: string;
  hasAnaesthetic: boolean;
  anaestheticBasicUnits?: number;
  derivedFeeDescription?: string;
  lastUpdated: Date;
  createdAt: Date;
}
