/**
 * Debug test to understand the column issue
 */

import { PrismaClient } from '../../src/generated/prisma/index.js';

const db = new PrismaClient();

async function debugTest() {
  console.log('🔍 Debug test...');

  try {
    await db.$connect();

    // Try raw SQL insert
    console.log('Testing raw SQL insert...');
    const result = await db.$executeRaw`
      INSERT INTO tenants (id, name, "operatingMode", "isDedicatedDb", "adminCanChangeMode", "requiresApproval", features, "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, 'Raw Test Tenant', 'STANDALONE', false, true, false, '{"manualExport": true, "patientManagement": true, "ehrSync": false}', NOW(), NOW())
      RETURNING id;
    `;
    console.log('✅ Raw SQL insert successful:', result);

    // Check what Prisma is actually trying to do
    console.log('Checking Prisma query...');
    
    // Enable query logging
    const client = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
    
    await client.$connect();
    
    try {
      const tenant = await client.tenant.create({
        data: {
          name: 'Prisma Test Tenant',
          operatingMode: 'STANDALONE',
        },
      });
      console.log('✅ Prisma create successful:', tenant.id);
    } catch (error) {
      console.error('❌ Prisma create failed:', error.message);
    }
    
    await client.$disconnect();

  } catch (error) {
    console.error('❌ Debug test failed:', error);
  } finally {
    await db.$disconnect();
  }
}

debugTest().catch(console.error);