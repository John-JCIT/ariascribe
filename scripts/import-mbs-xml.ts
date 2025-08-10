#!/usr/bin/env bun

/**
 * Script to import MBS XML data using the queue service
 * Usage: bun scripts/import-mbs-xml.ts
 */

import { PrismaClient } from '../src/generated/prisma';
import { MbsQueueService } from '../src/server/services/mbs/MbsQueueService';
import path from 'path';

const db = new PrismaClient();
const mbsQueueService = new MbsQueueService();

async function importMbsXml() {
  console.log('🚀 Starting MBS XML Import...\n');

  try {
    // Path to the MBS XML file
    const xmlFilePath = path.join(process.cwd(), 'documentation/mbs/MBS-XML-20250701.XML');
    const fileName = 'MBS-XML-20250701.XML';

    console.log(`📋 XML File: ${xmlFilePath}`);
    console.log(`📝 File Name: ${fileName}\n`);

    // Check if file exists
    const fs = await import('fs/promises');
    try {
      await fs.access(xmlFilePath);
      console.log('✅ XML file found\n');
    } catch (error) {
      console.error('❌ XML file not found:', xmlFilePath);
      process.exit(1);
    }

    // Queue the full ingestion pipeline
    console.log('🔄 Queuing full ingestion pipeline...');
    const result = await mbsQueueService.queueFullIngestionPipeline(
      xmlFilePath,
      fileName,
      true // Force reprocess
    );

    console.log('✅ Pipeline queued successfully!');
    console.log(`   📋 XML Job ID: ${result.xmlJobId}`);
    console.log(`   🧠 Embedding Job ID: ${result.embeddingJobId}`);
    console.log(`   🔍 Vector Job ID: ${result.vectorJobId}\n`);

    // Monitor job progress
    console.log('📊 Monitoring job progress...\n');
    
    let xmlCompleted = false;
    let embeddingCompleted = false;
    let vectorCompleted = false;

    const checkInterval = setInterval(async () => {
      try {
        // Check XML job status
        if (!xmlCompleted) {
          const xmlStatus = await mbsQueueService.getJobStatus(result.xmlJobId);
          console.log(`📋 XML Job: ${xmlStatus.status} (${xmlStatus.progress}%)`);
          
          if (xmlStatus.status === 'completed') {
            xmlCompleted = true;
            console.log('✅ XML ingestion completed!\n');
          } else if (xmlStatus.status === 'failed') {
            console.error('❌ XML ingestion failed:', xmlStatus.error);
            clearInterval(checkInterval);
            process.exit(1);
          }
        }

        // Check embedding job status
        if (xmlCompleted && !embeddingCompleted) {
          const embeddingStatus = await mbsQueueService.getJobStatus(result.embeddingJobId);
          console.log(`🧠 Embedding Job: ${embeddingStatus.status} (${embeddingStatus.progress}%)`);
          
          if (embeddingStatus.status === 'completed') {
            embeddingCompleted = true;
            console.log('✅ Embedding generation completed!\n');
          } else if (embeddingStatus.status === 'failed') {
            console.error('❌ Embedding generation failed:', embeddingStatus.error);
            clearInterval(checkInterval);
            process.exit(1);
          }
        }

        // Check vector job status
        if (embeddingCompleted && !vectorCompleted) {
          const vectorStatus = await mbsQueueService.getJobStatus(result.vectorJobId);
          console.log(`🔍 Vector Job: ${vectorStatus.status} (${vectorStatus.progress}%)`);
          
          if (vectorStatus.status === 'completed') {
            vectorCompleted = true;
            console.log('✅ Vector update completed!\n');
            clearInterval(checkInterval);
            
            // Show final statistics
            await showFinalStats();
            process.exit(0);
          } else if (vectorStatus.status === 'failed') {
            console.error('❌ Vector update failed:', vectorStatus.error);
            clearInterval(checkInterval);
            process.exit(1);
          }
        }
      } catch (error) {
        console.error('Error checking job status:', error);
      }
    }, 5000); // Check every 5 seconds

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
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
    
    console.log('\n🎉 MBS XML import completed successfully!');
    console.log('   The search API is now ready to use with real Medicare data.');
    
  } catch (error) {
    console.error('Error getting final stats:', error);
  } finally {
    await db.$disconnect();
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
importMbsXml().catch(async (error) => {
  console.error('❌ Unhandled error:', error);
  await db.$disconnect();
  process.exit(1);
});
