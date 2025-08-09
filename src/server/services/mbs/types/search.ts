/**
 * Search-related types for MBS API
 */

export type SearchType = 'text' | 'semantic' | 'hybrid';
export type ProviderType = 'G' | 'S' | 'AD' | 'ALL'; // GP, Specialist, Dental, All
export type SortOrder = 'relevance' | 'fee_asc' | 'fee_desc' | 'item_number';

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
  isActive: boolean;
  itemStartDate?: Date;
  itemEndDate?: Date;
}

export interface SearchResult extends MbsItemSummary {
  relevanceScore: number;
  searchType: SearchType;
  highlightedDescription?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  hasMore: boolean;
  searchType: SearchType;
  query: string;
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
