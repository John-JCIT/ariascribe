#!/usr/bin/env bun

/**
 * Script to directly import MBS XML data without using the queue system
 * Usage: bun scripts/direct-import.ts
 */

import { PrismaClient } from '../src/generated/prisma';
import { MbsWorkerService } from '../src/server/services/mbs/MbsWorkerService';
import path from 'path';

const db = new PrismaClient();

async function directImport() {
  console.log('🚀 Starting Direct MBS XML Import...\n');

  try {
    // Check for OpenAI API key (optional for XML import)
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.log('⚠️  OPENAI_API_KEY not found - will skip embedding generation');
      console.log('   XML import will proceed without embeddings\n');
    }

    // Path to the MBS XML file
    const xmlFilePath = path.join(process.cwd(), 'documentation/mbs/MBS-XML-20250701.XML');
    const fileName = 'MBS-XML-20250701.XML';

    console.log(`📋 XML File: ${xmlFilePath}`);
    console.log(`📝 File Name: ${fileName}\n`);

    // Check if file exists
    const fs = await import('fs/promises');
    try {
      const stats = await fs.stat(xmlFilePath);
      console.log(`✅ XML file found (${(stats.size / 1024 / 1024).toFixed(2)} MB)\n`);
    } catch (error) {
      console.error('❌ XML file not found:', xmlFilePath);
      process.exit(1);
    }

    // Initialize MBS Worker Service
    console.log('🔧 Initializing MBS Worker Service...');
    const mbsService = new MbsWorkerService(db, openaiApiKey || 'dummy-key');
    console.log('✅ MBS Worker Service initialized\n');

    // Step 1: XML Ingestion
    console.log('📋 Step 1: Starting XML ingestion...');
    const ingestionResult = await mbsService.ingestXmlFile(xmlFilePath, fileName, true);
    
    if (!ingestionResult.success) {
      console.error('❌ XML ingestion failed:', ingestionResult.errorMessage);
      process.exit(1);
    }

    console.log('✅ XML ingestion completed!');
    console.log(`   📊 Items processed: ${ingestionResult.itemsProcessed.toLocaleString()}`);
    console.log(`   ➕ Items inserted: ${ingestionResult.itemsInserted.toLocaleString()}`);
    console.log(`   🔄 Items updated: ${ingestionResult.itemsUpdated.toLocaleString()}`);
    console.log(`   ❌ Items failed: ${ingestionResult.itemsFailed.toLocaleString()}`);
    console.log(`   ⏱️  Processing time: ${(ingestionResult.processingTimeMs / 1000).toFixed(2)}s\n`);

    // Step 2: Generate Embeddings (only if OpenAI key is available)
    if (openaiApiKey) {
      console.log('🧠 Step 2: Generating embeddings...');
      const embeddingResult = await mbsService.generateEmbeddings(undefined, 50);
      
      if (!embeddingResult.success) {
        console.error('❌ Embedding generation failed:', embeddingResult.errorMessage);
        console.log('   Continuing without embeddings...\n');
      } else {
        console.log('✅ Embedding generation completed!');
        console.log(`   🧠 Embeddings processed: ${embeddingResult.embeddingsProcessed.toLocaleString()}`);
        console.log(`   ➕ Embeddings generated: ${embeddingResult.embeddingsGenerated.toLocaleString()}`);
        console.log(`   ❌ Embeddings failed: ${embeddingResult.embeddingsFailed.toLocaleString()}`);
        console.log(`   ⏱️  Processing time: ${(embeddingResult.processingTimeMs / 1000).toFixed(2)}s\n`);

        // Step 3: Update Search Vectors
        console.log('🔍 Step 3: Updating search vectors...');
        const vectorResult = await mbsService.updateSearchVectors();
        
        if (!vectorResult.success) {
          console.error('❌ Search vector update failed:', vectorResult.errorMessage);
          console.log('   Continuing without vector updates...\n');
        } else {
          console.log('✅ Search vector update completed!');
          console.log(`   🔍 Vectors processed: ${vectorResult.vectorsProcessed.toLocaleString()}`);
          console.log(`   ➕ Vectors updated: ${vectorResult.vectorsUpdated.toLocaleString()}`);
          console.log(`   ❌ Vectors failed: ${vectorResult.vectorsFailed.toLocaleString()}`);
          console.log(`   ⏱️  Processing time: ${(vectorResult.processingTimeMs / 1000).toFixed(2)}s\n`);
        }
      }
    } else {
      console.log('⏭️  Skipping embeddings and vector updates (no OpenAI API key)\n');
    }

    // Show final statistics
    await showFinalStats();

    console.log('🎉 MBS XML import completed successfully!');
    console.log('   The search API is now ready to use with real Medicare data.\n');

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

async function showFinalStats() {
  try {
    console.log('📊 Final Statistics:');
    
    // Get item count
    const itemCount = await db.mbsItem.count();
    console.log(`   📋 Total MBS Items: ${itemCount.toLocaleString()}`);
    
    // Get items with embeddings
    const embeddingCount = await db.mbsItem.count({
      where: {
        embedding: { not: null }
      }
    });
    console.log(`   🧠 Items with Embeddings: ${embeddingCount.toLocaleString()}`);
    
    // Get active items
    const activeCount = await db.mbsItem.count({
      where: { isActive: true }
    });
    console.log(`   ✅ Active Items: ${activeCount.toLocaleString()}`);
    
    // Get categories
    const categories = await db.mbsItem.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { _all: true }
    });
    console.log(`   📂 Categories: ${categories.length}`);
    
    // Get provider types
    const providerTypes = await db.mbsItem.groupBy({
      by: ['providerType'],
      where: { 
        isActive: true,
        providerType: { not: null }
      },
      _count: { _all: true }
    });
    console.log(`   👨‍⚕️ Provider Types: ${providerTypes.length}`);
    
    // Sample some items
    const sampleItems = await db.mbsItem.findMany({
      where: { isActive: true },
      take: 3,
      select: {
        itemNumber: true,
        description: true,
        scheduleFee: true,
        category: true,
        providerType: true
      }
    });
    
    console.log('\n📋 Sample Items:');
    sampleItems.forEach((item, index) => {
      console.log(`   ${index + 1}. Item ${item.itemNumber}: ${item.description?.substring(0, 80)}...`);
      console.log(`      Fee: $${item.scheduleFee}, Category: ${item.category}, Provider: ${item.providerType || 'Any'}`);
    });
    
  } catch (error) {
    console.error('Error getting final stats:', error);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Import interrupted by user');
  await db.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️  Import terminated');
  await db.$disconnect();
  process.exit(0);
});

// Run the import
directImport().catch(async (error) => {
  console.error('❌ Unhandled error:', error);
  await db.$disconnect();
  process.exit(1);
});
