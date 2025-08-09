import type { PrismaClient } from "@/generated/prisma";
import type { 
  SearchFilters, 
  MbsItemSummary, 
  ItemDetailResponse,
  SortOrder 
} from "./types";

export interface DatabaseSearchOptions {
  query?: string;
  filters?: SearchFilters;
  limit: number;
  offset: number;
  sortBy: SortOrder;
}

export interface TextSearchResult {
  item: MbsItemSummary;
  rank: number;
}

export interface SemanticSearchResult {
  item: MbsItemSummary;
  similarity: number;
}

/**
 * Data access layer for MBS items
 * Handles all database operations and raw SQL queries
 */
export class MbsDataService {
  constructor(private db: PrismaClient) {}

  /**
   * Get a single MBS item by item number
   */
  async getItemByNumber(itemNumber: number): Promise<ItemDetailResponse | null> {
    const item = await this.db.mbsItem.findUnique({
      where: { itemNumber }
    });

    if (!item) return null;

    return {
      id: item.id,
      itemNumber: item.itemNumber,
      description: item.description,
      shortDescription: item.shortDescription ?? undefined,
      category: item.category ?? undefined,
      subCategory: item.subCategory ?? undefined,
      groupName: item.groupName ?? undefined,
      subGroup: item.subGroup ?? undefined,
      providerType: item.providerType ?? undefined,
      serviceType: item.serviceType ?? undefined,
      scheduleFee: item.scheduleFee ? Number(item.scheduleFee) : undefined,
      benefit75: item.benefit75 ? Number(item.benefit75) : undefined,
      benefit85: item.benefit85 ? Number(item.benefit85) : undefined,
      benefit100: item.benefit100 ? Number(item.benefit100) : undefined,
      hasAnaesthetic: item.hasAnaesthetic,
      anaestheticBasicUnits: item.anaestheticBasicUnits ?? undefined,
      derivedFeeDescription: item.derivedFeeDescription ?? undefined,
      isActive: item.isActive,
      itemStartDate: item.itemStartDate ?? undefined,
      itemEndDate: item.itemEndDate ?? undefined,
      lastUpdated: item.lastUpdated,
      createdAt: item.createdAt,
    };
  }

  /**
   * Get multiple MBS items by their database IDs
   */
  async getItemsByIds(ids: number[]): Promise<MbsItemSummary[]> {
    if (ids.length === 0) return [];

    const items = await this.db.mbsItem.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        itemNumber: true,
        description: true,
        shortDescription: true,
        category: true,
        providerType: true,
        serviceType: true,
        scheduleFee: true,
        benefit75: true,
        benefit85: true,
        benefit100: true,
        isActive: true,
        itemStartDate: true,
        itemEndDate: true,
      }
    });

    return items.map(item => ({
      id: item.id,
      itemNumber: item.itemNumber,
      description: item.description,
      shortDescription: item.shortDescription ?? undefined,
      category: item.category ?? undefined,
      providerType: item.providerType ?? undefined,
      serviceType: item.serviceType ?? undefined,
      scheduleFee: item.scheduleFee ? Number(item.scheduleFee) : undefined,
      benefit75: item.benefit75 ? Number(item.benefit75) : undefined,
      benefit85: item.benefit85 ? Number(item.benefit85) : undefined,
      benefit100: item.benefit100 ? Number(item.benefit100) : undefined,
      isActive: item.isActive,
      itemStartDate: item.itemStartDate ?? undefined,
      itemEndDate: item.itemEndDate ?? undefined,
    }));
  }

  /**
   * Perform full-text search using PostgreSQL tsvector
   */
  async performTextSearch(options: DatabaseSearchOptions): Promise<{
    results: TextSearchResult[];
    total: number;
  }> {
    const { query, filters, limit, offset, sortBy } = options;
    
    if (!query) {
      return { results: [], total: 0 };
    }

    // Build WHERE clause for filters
    const whereConditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Add text search condition
    whereConditions.push(`tsv @@ plainto_tsquery('english', $${paramIndex})`);
    params.push(query);
    paramIndex++;

    // Apply filters
    if (filters?.providerType && filters.providerType !== 'ALL') {
      whereConditions.push(`provider_type = $${paramIndex}`);
      params.push(filters.providerType);
      paramIndex++;
    }

    if (filters?.category) {
      whereConditions.push(`category = $${paramIndex}`);
      params.push(filters.category);
      paramIndex++;
    }

    if (!filters?.includeInactive) {
      whereConditions.push('is_active = true');
    }

    if (filters?.minFee !== undefined) {
      whereConditions.push(`schedule_fee >= $${paramIndex}`);
      params.push(filters.minFee);
      paramIndex++;
    }

    if (filters?.maxFee !== undefined) {
      whereConditions.push(`schedule_fee <= $${paramIndex}`);
      params.push(filters.maxFee);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Build ORDER BY clause
    let orderBy = '';
    switch (sortBy) {
      case 'relevance':
        orderBy = 'ORDER BY ts_rank(tsv, plainto_tsquery($1)) DESC, item_number ASC';
        break;
      case 'fee_asc':
        orderBy = 'ORDER BY schedule_fee ASC NULLS LAST, item_number ASC';
        break;
      case 'fee_desc':
        orderBy = 'ORDER BY schedule_fee DESC NULLS LAST, item_number ASC';
        break;
      case 'item_number':
        orderBy = 'ORDER BY item_number ASC';
        break;
      default:
        orderBy = 'ORDER BY ts_rank(tsv, plainto_tsquery($1)) DESC, item_number ASC';
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as count
      FROM mbs.items 
      ${whereClause}
    `;
    
    const countResult = await this.db.$queryRawUnsafe<[{ count: bigint }]>(
      countQuery, 
      ...params
    );
    const total = Number(countResult[0]?.count ?? 0);

    // Get paginated results
    const searchQuery = `
      SELECT 
        id, item_number, description, short_description, category, 
        provider_type, service_type, schedule_fee, benefit_75, benefit_85, benefit_100,
        is_active, item_start_date, item_end_date,
        ts_rank(tsv, plainto_tsquery($1)) as rank
      FROM mbs.items 
      ${whereClause}
      ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);

    const searchResults = await this.db.$queryRawUnsafe<Array<{
      id: number;
      item_number: number;
      description: string;
      short_description?: string;
      category?: string;
      provider_type?: string;
      service_type?: string;
      schedule_fee?: number;
      benefit_75?: number;
      benefit_85?: number;
      benefit_100?: number;
      is_active: boolean;
      item_start_date?: Date;
      item_end_date?: Date;
      rank: number;
    }>>(searchQuery, ...params);

    const results: TextSearchResult[] = searchResults.map(row => ({
      item: {
        id: row.id,
        itemNumber: row.item_number,
        description: row.description,
        shortDescription: row.short_description ?? undefined,
        category: row.category ?? undefined,
        providerType: row.provider_type ?? undefined,
        serviceType: row.service_type ?? undefined,
        scheduleFee: row.schedule_fee ?? undefined,
        benefit75: row.benefit_75 ?? undefined,
        benefit85: row.benefit_85 ?? undefined,
        benefit100: row.benefit_100 ?? undefined,
        isActive: row.is_active,
        itemStartDate: row.item_start_date ?? undefined,
        itemEndDate: row.item_end_date ?? undefined,
      },
      rank: row.rank,
    }));

    return { results, total };
  }

  /**
   * Perform semantic search using vector similarity
   */
  async performSemanticSearch(
    queryEmbedding: number[],
    options: DatabaseSearchOptions
  ): Promise<{
    results: SemanticSearchResult[];
    total: number;
  }> {
    const { filters, limit, offset } = options;

    // Build WHERE clause for filters (similar to text search)
    const whereConditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Add embedding condition (only search items that have embeddings)
    whereConditions.push('embedding IS NOT NULL');

    // Apply filters
    if (filters?.providerType && filters.providerType !== 'ALL') {
      whereConditions.push(`provider_type = $${paramIndex}`);
      params.push(filters.providerType);
      paramIndex++;
    }

    if (filters?.category) {
      whereConditions.push(`category = $${paramIndex}`);
      params.push(filters.category);
      paramIndex++;
    }

    if (!filters?.includeInactive) {
      whereConditions.push('is_active = true');
    }

    if (filters?.minFee !== undefined) {
      whereConditions.push(`schedule_fee >= $${paramIndex}`);
      params.push(filters.minFee);
      paramIndex++;
    }

    if (filters?.maxFee !== undefined) {
      whereConditions.push(`schedule_fee <= $${paramIndex}`);
      params.push(filters.maxFee);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : 'WHERE embedding IS NOT NULL';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as count
      FROM mbs.items 
      ${whereClause}
    `;
    
    const countResult = await this.db.$queryRawUnsafe<[{ count: bigint }]>(
      countQuery, 
      ...params
    );
    const total = Number(countResult[0]?.count ?? 0);

    // Get paginated results with cosine similarity
    // Note: Using JSONB for now, will upgrade to vector type later
    const searchQuery = `
      SELECT 
        id, item_number, description, short_description, category, 
        provider_type, service_type, schedule_fee, benefit_75, benefit_85, benefit_100,
        is_active, item_start_date, item_end_date,
        (1 - (embedding::jsonb <-> $${paramIndex}::jsonb)) as similarity
      FROM mbs.items 
      ${whereClause}
      ORDER BY similarity DESC, item_number ASC
      LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}
    `;
    
    params.push(JSON.stringify(queryEmbedding), limit, offset);

    const searchResults = await this.db.$queryRawUnsafe<Array<{
      id: number;
      item_number: number;
      description: string;
      short_description?: string;
      category?: string;
      provider_type?: string;
      service_type?: string;
      schedule_fee?: number;
      benefit_75?: number;
      benefit_85?: number;
      benefit_100?: number;
      is_active: boolean;
      item_start_date?: Date;
      item_end_date?: Date;
      similarity: number;
    }>>(searchQuery, ...params);

    const results: SemanticSearchResult[] = searchResults.map(row => ({
      item: {
        id: row.id,
        itemNumber: row.item_number,
        description: row.description,
        shortDescription: row.short_description ?? undefined,
        category: row.category ?? undefined,
        providerType: row.provider_type ?? undefined,
        serviceType: row.service_type ?? undefined,
        scheduleFee: row.schedule_fee ?? undefined,
        benefit75: row.benefit_75 ?? undefined,
        benefit85: row.benefit_85 ?? undefined,
        benefit100: row.benefit_100 ?? undefined,
        isActive: row.is_active,
        itemStartDate: row.item_start_date ?? undefined,
        itemEndDate: row.item_end_date ?? undefined,
      },
      similarity: row.similarity,
    }));

    return { results, total };
  }

  /**
   * Get database health statistics
   */
  async getHealthStats(): Promise<{
    totalItems: number;
    activeItems: number;
    itemsWithEmbeddings: number;
    lastUpdated?: Date;
  }> {
    const [totalItems, activeItems, itemsWithEmbeddings, lastIngestion] = await Promise.all([
      this.db.mbsItem.count(),
      this.db.mbsItem.count({ where: { isActive: true } }),
      this.db.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count 
        FROM mbs.items 
        WHERE embedding IS NOT NULL
      `.then(result => Number(result[0]?.count ?? 0)),
      this.db.mbsIngestionLog.findFirst({
        where: { status: 'completed' },
        orderBy: { completedAt: 'desc' },
        select: { completedAt: true }
      })
    ]);

    return {
      totalItems,
      activeItems,
      itemsWithEmbeddings,
      lastUpdated: lastIngestion?.completedAt ?? undefined,
    };
  }
}
