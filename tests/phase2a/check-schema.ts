/**
 * Check actual database schema
 */

import { PrismaClient } from '../../src/generated/prisma/index.js';

const db = new PrismaClient();

async function checkSchema() {
  console.log('🔍 Checking database schema...');

  try {
    await db.$connect();

    // Check tenants table structure
    const tenantColumns = await db.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'tenants'
      ORDER BY ordinal_position;
    `;
    
    console.log('📋 Tenants table columns:');
    console.table(tenantColumns);

    // Check all tables
    const tables = await db.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    console.log('📊 All tables:');
    console.table(tables);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.$disconnect();
  }
}

checkSchema().catch(console.error);