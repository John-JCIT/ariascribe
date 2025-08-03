/**
 * Simple Phase 2A Test
 */

import { PrismaClient } from './src/generated/prisma/index.js';

const db = new PrismaClient();

async function simpleTest() {
  console.log('🧪 Simple database test...');

  try {
    // Test database connection
    await db.$connect();
    console.log('✅ Database connected');

    // Check if tenants table exists
    const tableExists = await db.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants'
      );
    `;
    console.log('✅ Tenants table check:', tableExists);

    // Try to create a simple tenant
    const tenant = await db.tenant.create({
      data: {
        name: 'Simple Test Tenant',
        operatingMode: 'STANDALONE',
      },
    });
    console.log('✅ Created tenant:', tenant.id);

    // Clean up
    await db.tenant.delete({ where: { id: tenant.id } });
    console.log('✅ Cleaned up test data');

    console.log('🎉 Simple test passed!');

  } catch (error) {
    console.error('❌ Simple test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await db.$disconnect();
  }
}

simpleTest().catch(console.error);