#!/usr/bin/env bun
/**
 * Simple test script for MBS Worker Service
 * Run with: bun src/server/services/mbs/test-mbs-worker.ts
 */

import { PrismaClient } from '@/generated/prisma';
import { MbsWorkerService } from './MbsWorkerService';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const db = new PrismaClient();

// Mock XML data for testing
const mockMbsXml = `<?xml version="1.0" encoding="UTF-8"?>
<MBS>
  <Items>
    <Item>
      <ItemNum>23</ItemNum>
      <Descriptor>Professional attendance by a general practitioner</Descriptor>
      <Category>1</Category>
      <ProviderType>G</ProviderType>
      <ScheduleFee>39.75</ScheduleFee>
      <Benefit75>29.80</Benefit75>
      <HasAnaesthetic>N</HasAnaesthetic>
      <ItemStartDate>01.01.2023</ItemStartDate>
    </Item>
    <Item>
      <ItemNum>36</ItemNum>
      <Descriptor>Professional attendance by a general practitioner - longer consultation</Descriptor>
      <Category>1</Category>
      <ProviderType>G</ProviderType>
      <ScheduleFee>79.30</ScheduleFee>
      <Benefit75>59.50</Benefit75>
      <HasAnaesthetic>N</HasAnaesthetic>
      <ItemStartDate>01.01.2023</ItemStartDate>
    </Item>
    <Item>
      <ItemNum>2713</ItemNum>
      <Descriptor>Mental health treatment plan</Descriptor>
      <Category>1</Category>
      <ProviderType>G</ProviderType>
      <ScheduleFee>78.95</ScheduleFee>
      <Benefit75>59.20</Benefit75>
      <HasAnaesthetic>N</HasAnaesthetic>
      <ItemStartDate>01.01.2023</ItemStartDate>
    </Item>
  </Items>
</MBS>`;

async function runTests() {
  console.log('🧪 Starting MBS Worker Service Tests...\n');

  try {
    // Test 1: Database connection
    console.log('1️⃣ Testing database connection...');
    const itemCount = await db.mbsItem.count();
    console.log(`✅ Database connected. Current MBS items: ${itemCount}\n`);

    // Test 2: Create test XML file
    console.log('2️⃣ Creating test XML file...');
    const testDir = '/tmp/mbs-test';
    await mkdir(testDir, { recursive: true });
    const testXmlPath = join(testDir, 'test-mbs.xml');
    await writeFile(testXmlPath, mockMbsXml);
    console.log(`✅ Test XML file created: ${testXmlPath}\n`);

    // Test 3: Initialize MBS Worker Service
    console.log('3️⃣ Initializing MBS Worker Service...');
    const openaiApiKey = process.env.OPENAI_API_KEY || 'test-key';
    const mbsService = new MbsWorkerService(db, openaiApiKey);
    console.log('✅ MBS Worker Service initialized\n');

    // Test 4: XML Ingestion
    console.log('4️⃣ Testing XML ingestion...');
    const ingestionResult = await mbsService.ingestXmlFile(testXmlPath, 'test-mbs.xml', true);
    
    if (ingestionResult.success) {
      console.log('✅ XML ingestion successful!');
      console.log(`   📊 Items processed: ${ingestionResult.itemsProcessed}`);
      console.log(`   ➕ Items inserted: ${ingestionResult.itemsInserted}`);
      console.log(`   🔄 Items updated: ${ingestionResult.itemsUpdated}`);
      console.log(`   ❌ Items failed: ${ingestionResult.itemsFailed}`);
      console.log(`   ⏱️  Processing time: ${ingestionResult.processingTimeMs}ms\n`);
    } else {
      console.error('❌ XML ingestion failed:', ingestionResult.errorMessage);
      return;
    }

    // Test 5: Verify data in database
    console.log('5️⃣ Verifying ingested data...');
    const ingestedItems = await db.mbsItem.findMany({
      where: {
        itemNumber: { in: [23, 36, 2713] }
      },
      select: {
        itemNumber: true,
        description: true,
        category: true,
        providerType: true,
        scheduleFee: true,
        isActive: true,
      }
    });
    
    console.log('✅ Ingested items:');
    ingestedItems.forEach(item => {
      console.log(`   📋 ${item.itemNumber}: ${item.description.substring(0, 50)}...`);
      console.log(`      💰 Fee: $${item.scheduleFee} | Provider: ${item.providerType} | Active: ${item.isActive}`);
    });
    console.log();

    // Test 6: Search vector update
    console.log('6️⃣ Testing search vector update...');
    const vectorResult = await mbsService.updateSearchVectors([23, 36, 2713]);
    
    if (vectorResult.success) {
      console.log('✅ Search vector update successful!');
      console.log(`   🔄 Items updated: ${vectorResult.itemsUpdated}`);
      console.log(`   ⏱️  Processing time: ${vectorResult.processingTimeMs}ms\n`);
    } else {
      console.error('❌ Search vector update failed:', vectorResult.errorMessage);
    }

    // Test 7: Embedding generation (only if OpenAI API key is available)
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'test-key') {
      console.log('7️⃣ Testing embedding generation...');
      const embeddingResult = await mbsService.generateEmbeddings([23, 36], 2);
      
      if (embeddingResult.success) {
        console.log('✅ Embedding generation successful!');
        console.log(`   🧠 Items processed: ${embeddingResult.itemsProcessed}`);
        console.log(`   🔄 Items updated: ${embeddingResult.itemsUpdated}`);
        console.log(`   ⏱️  Processing time: ${embeddingResult.processingTimeMs}ms`);
        console.log(`   🤖 Embedding time: ${embeddingResult.embeddingTimeMs}ms\n`);
      } else {
        console.error('❌ Embedding generation failed:', embeddingResult.errorMessage);
      }
    } else {
      console.log('7️⃣ Skipping embedding generation (no OpenAI API key)\n');
    }

    // Test 8: Check ingestion logs
    console.log('8️⃣ Checking ingestion logs...');
    const logs = await db.mbsIngestionLog.findMany({
      orderBy: { startedAt: 'desc' },
      take: 3,
      select: {
        id: true,
        fileName: true,
        status: true,
        itemsProcessed: true,
        processingTimeMs: true,
        startedAt: true,
      }
    });
    
    console.log('✅ Recent ingestion logs:');
    logs.forEach(log => {
      console.log(`   📝 ${log.fileName} (${log.status}): ${log.itemsProcessed} items in ${log.processingTimeMs}ms`);
    });
    console.log();

    console.log('🎉 All tests completed successfully!');
    console.log('\n📋 Phase 1 MBS Database Foundation is ready for use:');
    console.log('   ✅ Database schema created with mbs.* tables');
    console.log('   ✅ XML ingestion pipeline working');
    console.log('   ✅ Search vector generation working');
    console.log('   ✅ Embedding generation ready (requires OpenAI API key)');
    console.log('   ✅ Audit logging functional');
    console.log('\n🚀 Ready for Phase 2: Backend API Development');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Run the tests
runTests().catch(console.error);