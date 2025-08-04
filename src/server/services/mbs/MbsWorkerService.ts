import { PrismaClient } from "@/generated/prisma";
import { createHash } from "crypto";
import { readFile, stat } from "fs/promises";
import { parseStringPromise } from "xml2js";
import OpenAI from "openai";

export interface MbsXmlItem {
  ItemNum: string[];
  Descriptor: string[];
  Category: string[];
  SubCategory?: string[];
  Group?: string[];
  SubGroup?: string[];
  ProviderType?: string[];
  ServiceType?: string[];
  ScheduleFee?: string[];
  Benefit75?: string[];
  Benefit85?: string[];
  Benefit100?: string[];
  HasAnaesthetic?: string[];
  AnaestheticBasicUnits?: string[];
  DerivedFee?: string[];
  ItemStartDate?: string[];
  ItemEndDate?: string[];
  LastUpdated?: string[];
}

export interface MbsProcessingResult {
  success: boolean;
  itemsProcessed: number;
  itemsInserted: number;
  itemsUpdated: number;
  itemsFailed: number;
  processingTimeMs: number;
  embeddingTimeMs?: number;
  errorMessage?: string;
  errorDetails?: any;
}

export class MbsWorkerService {
  private db: PrismaClient;
  private openai: OpenAI;

  constructor(db: PrismaClient, openaiApiKey: string) {
    this.db = db;
    this.openai = new OpenAI({ apiKey: openaiApiKey });
  }

  async ingestXmlFile(filePath: string, fileName: string, forceReprocess = false): Promise<MbsProcessingResult> {
    const startTime = Date.now();
    let logId: number | null = null;

    try {
      // Check file existence and get stats
      const fileStats = await stat(filePath);
      const fileContent = await readFile(filePath, 'utf-8');
      const fileHash = createHash('sha256').update(fileContent).digest('hex');

      // Check if we've already processed this file
      if (!forceReprocess) {
        const existingLog = await this.db.mbsIngestionLog.findFirst({
          where: {
            fileHash,
            status: 'completed'
          }
        });

        if (existingLog) {
          console.log(`📋 File ${fileName} already processed (hash: ${fileHash.substring(0, 8)}...)`);
          return {
            success: true,
            itemsProcessed: existingLog.itemsProcessed,
            itemsInserted: existingLog.itemsInserted,
            itemsUpdated: existingLog.itemsUpdated,
            itemsFailed: existingLog.itemsFailed,
            processingTimeMs: existingLog.processingTimeMs || 0,
          };
        }
      }

      // Create ingestion log entry
      const ingestionLog = await this.db.mbsIngestionLog.create({
        data: {
          fileName,
          fileHash,
          fileSizeBytes: BigInt(fileStats.size),
          status: 'processing',
          processorVersion: '1.0.0',
        }
      });
      logId = ingestionLog.id;

      console.log(`📋 Starting MBS XML ingestion: ${fileName} (${fileStats.size} bytes)`);

      // Parse XML
      const xmlData = await parseStringPromise(fileContent, {
        explicitArray: true,
        trim: true,
        normalize: true,
      });

      // Extract items from XML structure
      const items = this.extractItemsFromXml(xmlData);
      console.log(`📋 Extracted ${items.length} items from XML`);

      // Process items in batches
      const batchSize = 100;
      let itemsProcessed = 0;
      let itemsInserted = 0;
      let itemsUpdated = 0;
      let itemsFailed = 0;

      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResult = await this.processBatch(batch);
        
        itemsProcessed += batchResult.processed;
        itemsInserted += batchResult.inserted;
        itemsUpdated += batchResult.updated;
        itemsFailed += batchResult.failed;

        console.log(`📋 Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)}: ${batchResult.processed} items`);
      }

      const processingTimeMs = Date.now() - startTime;

      // Update ingestion log
      await this.db.mbsIngestionLog.update({
        where: { id: logId },
        data: {
          completedAt: new Date(),
          status: 'completed',
          itemsProcessed,
          itemsInserted,
          itemsUpdated,
          itemsFailed,
          processingTimeMs,
        }
      });

      console.log(`✅ MBS XML ingestion completed: ${itemsProcessed} processed, ${itemsInserted} inserted, ${itemsUpdated} updated, ${itemsFailed} failed`);

      return {
        success: true,
        itemsProcessed,
        itemsInserted,
        itemsUpdated,
        itemsFailed,
        processingTimeMs,
      };

    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorDetails = error instanceof Error ? { stack: error.stack } : { error };

      console.error(`❌ MBS XML ingestion failed:`, error);

      // Update ingestion log with error
      if (logId) {
        await this.db.mbsIngestionLog.update({
          where: { id: logId },
          data: {
            completedAt: new Date(),
            status: 'failed',
            processingTimeMs,
            errorMessage,
            errorDetails,
          }
        });
      }

      return {
        success: false,
        itemsProcessed: 0,
        itemsInserted: 0,
        itemsUpdated: 0,
        itemsFailed: 0,
        processingTimeMs,
        errorMessage,
        errorDetails,
      };
    }
  }

  private extractItemsFromXml(xmlData: any): MbsXmlItem[] {
    // Navigate XML structure to find items
    // This will need to be adjusted based on actual MBS XML structure
    const items: MbsXmlItem[] = [];
    
    try {
      // console.log('🔍 Full XML data structure:', JSON.stringify(xmlData, null, 2));
      
      // Common XML structures for MBS data
      const possiblePaths = [
        xmlData?.MBS?.Items?.[0]?.Item, // XML2JS structure - this is the correct path
        xmlData?.MBS?.[0]?.Items?.[0]?.Item, 
        xmlData?.MBS?.Items?.Item,
        xmlData?.Items?.Item,
        xmlData?.Item,
        xmlData?.MBSItems?.Item,
      ];

      for (const path of possiblePaths) {
        if (Array.isArray(path)) {
          items.push(...path);
          break;
        }
      }

      if (items.length === 0) {
        console.warn('⚠️ No items found in XML. XML structure:', JSON.stringify(Object.keys(xmlData), null, 2));
      }

    } catch (error) {
      console.error('❌ Error extracting items from XML:', error);
    }

    return items;
  }

  private async processBatch(items: MbsXmlItem[]): Promise<{
    processed: number;
    inserted: number;
    updated: number;
    failed: number;
  }> {
    let processed = 0;
    let inserted = 0;
    let updated = 0;
    let failed = 0;

    for (const xmlItem of items) {
      try {
        const itemData = this.transformXmlItem(xmlItem);
        
        if (!itemData.itemNumber) {
          console.warn('⚠️ Skipping item without item number:', xmlItem);
          failed++;
          continue;
        }

        // Upsert item
        const result = await this.db.mbsItem.upsert({
          where: { itemNumber: itemData.itemNumber },
          create: itemData,
          update: {
            ...itemData,
            lastUpdated: new Date(),
          }
        });

        if (result.createdAt.getTime() === result.lastUpdated.getTime()) {
          inserted++;
        } else {
          updated++;
        }
        processed++;

      } catch (error) {
        console.error(`❌ Failed to process item:`, xmlItem, error);
        failed++;
      }
    }

    return { processed, inserted, updated, failed };
  }

  private transformXmlItem(xmlItem: MbsXmlItem): any {
    // Helper function to safely extract first array element
    const getFirst = (arr: string[] | undefined): string | undefined => arr?.[0];
    const getFirstAsNumber = (arr: string[] | undefined): number | undefined => {
      const val = getFirst(arr);
      return val ? parseFloat(val) : undefined;
    };
    const getFirstAsInt = (arr: string[] | undefined): number | undefined => {
      const val = getFirst(arr);
      return val ? parseInt(val, 10) : undefined;
    };
    const getFirstAsDate = (arr: string[] | undefined): Date | undefined => {
      const val = getFirst(arr);
      if (!val) return undefined;
      
      // Handle common date formats: DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD
      const cleaned = val.replace(/\./g, '/');
      const date = new Date(cleaned);
      return isNaN(date.getTime()) ? undefined : date;
    };
    const getFirstAsBoolean = (arr: string[] | undefined): boolean => {
      const val = getFirst(arr);
      return val === 'Y' || val === 'true' || val === '1';
    };

    return {
      itemNumber: getFirstAsInt(xmlItem.ItemNum),
      description: getFirst(xmlItem.Descriptor) || '',
      shortDescription: getFirst(xmlItem.Descriptor)?.substring(0, 255), // Truncate for short description
      category: getFirst(xmlItem.Category),
      subCategory: getFirst(xmlItem.SubCategory),
      groupName: getFirst(xmlItem.Group),
      subGroup: getFirst(xmlItem.SubGroup),
      providerType: getFirst(xmlItem.ProviderType),
      serviceType: getFirst(xmlItem.ServiceType),
      scheduleFee: getFirstAsNumber(xmlItem.ScheduleFee),
      benefit75: getFirstAsNumber(xmlItem.Benefit75),
      benefit85: getFirstAsNumber(xmlItem.Benefit85),
      benefit100: getFirstAsNumber(xmlItem.Benefit100),
      hasAnaesthetic: getFirstAsBoolean(xmlItem.HasAnaesthetic),
      anaestheticBasicUnits: getFirstAsInt(xmlItem.AnaestheticBasicUnits),
      derivedFeeDescription: getFirst(xmlItem.DerivedFee),
      itemStartDate: getFirstAsDate(xmlItem.ItemStartDate),
      itemEndDate: getFirstAsDate(xmlItem.ItemEndDate),
      isActive: !xmlItem.ItemEndDate || getFirstAsDate(xmlItem.ItemEndDate)! > new Date(),
      rawXmlData: xmlItem, // Store original XML for debugging
    };
  }

  async generateEmbeddings(itemIds?: number[], batchSize = 50): Promise<MbsProcessingResult> {
    const startTime = Date.now();

    try {
      // Get items that need embeddings
      const whereClause = itemIds ? 
        { id: { in: itemIds } } : 
        { 
          // Use raw SQL to check for null embeddings since Prisma doesn't support vector types
          id: { not: undefined } // We'll filter with raw SQL below
        };

      // For now, get all items and filter in memory (will optimize with raw SQL later)
      const items = await this.db.mbsItem.findMany({
        where: itemIds ? { id: { in: itemIds } } : {},
        select: {
          id: true,
          itemNumber: true,
          description: true,
          shortDescription: true,
          category: true,
          groupName: true,
          serviceType: true,
        }
      });

      console.log(`🧠 Generating embeddings for ${items.length} items`);

      let processed = 0;
      let failed = 0;
      const embeddingStartTime = Date.now();

      // Process in batches to respect OpenAI rate limits
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        try {
          // Prepare texts for embedding
          const texts = batch.map(item => 
            `MBS Item ${item.itemNumber}: ${item.description} ${item.category || ''} ${item.groupName || ''} ${item.serviceType || ''}`
          );

          // Generate embeddings
          const response = await this.openai.embeddings.create({
            model: 'text-embedding-3-large',
            input: texts,
            encoding_format: 'float',
          });

          // Update items with embeddings using raw SQL
          for (let j = 0; j < batch.length; j++) {
            const item = batch[j];
            const embedding = response.data[j]?.embedding;

            if (embedding) {
              await this.db.$executeRaw`
                UPDATE mbs.items 
                SET embedding = ${JSON.stringify(embedding)}::vector 
                WHERE id = ${item.id}
              `;
              processed++;
            } else {
              console.warn(`⚠️ No embedding generated for item ${item.itemNumber}`);
              failed++;
            }
          }

          console.log(`🧠 Processed embedding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)}`);

          // Rate limiting: wait between batches
          if (i + batchSize < items.length) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
          }

        } catch (error) {
          console.error(`❌ Failed to process embedding batch:`, error);
          failed += batch.length;
        }
      }

      const embeddingTimeMs = Date.now() - embeddingStartTime;
      const processingTimeMs = Date.now() - startTime;

      console.log(`✅ Embedding generation completed: ${processed} processed, ${failed} failed`);

      return {
        success: true,
        itemsProcessed: processed + failed,
        itemsInserted: 0,
        itemsUpdated: processed,
        itemsFailed: failed,
        processingTimeMs,
        embeddingTimeMs,
      };

    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error(`❌ Embedding generation failed:`, error);

      return {
        success: false,
        itemsProcessed: 0,
        itemsInserted: 0,
        itemsUpdated: 0,
        itemsFailed: 0,
        processingTimeMs,
        errorMessage,
      };
    }
  }

  async updateSearchVectors(itemIds?: number[]): Promise<MbsProcessingResult> {
    const startTime = Date.now();

    try {
      // Update tsvector for full-text search (handled by database trigger)
      // This method can be used for manual updates if needed
      
      const whereClause = itemIds ? `WHERE id = ANY($1)` : '';
      const params = itemIds ? [itemIds] : [];

      const result = await this.db.$executeRawUnsafe(`
        UPDATE mbs.items 
        SET tsv = to_tsvector('english', 
          COALESCE(item_number::text, '') || ' ' ||
          COALESCE(description, '') || ' ' ||
          COALESCE(short_description, '') || ' ' ||
          COALESCE(category, '') || ' ' ||
          COALESCE(group_name, '') || ' ' ||
          COALESCE(service_type, '')
        )
        ${whereClause}
      `, ...params);

      const processingTimeMs = Date.now() - startTime;

      console.log(`✅ Search vector update completed for ${itemIds?.length || 'all'} items`);

      return {
        success: true,
        itemsProcessed: Array.isArray(result) ? result.length : (itemIds?.length || 0),
        itemsInserted: 0,
        itemsUpdated: Array.isArray(result) ? result.length : (itemIds?.length || 0),
        itemsFailed: 0,
        processingTimeMs,
      };

    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error(`❌ Search vector update failed:`, error);

      return {
        success: false,
        itemsProcessed: 0,
        itemsInserted: 0,
        itemsUpdated: 0,
        itemsFailed: 0,
        processingTimeMs,
        errorMessage,
      };
    }
  }
}