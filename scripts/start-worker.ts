#!/usr/bin/env bun

/**
 * Script to start the Bull queue worker for MBS processing
 * Usage: bun scripts/start-worker.ts
 */

import { startWorker } from '../src/server/instrumentation/bull/worker';

console.log('🚀 Starting MBS Queue Worker...\n');

// Start the worker
const worker = startWorker();

console.log('✅ Worker started and ready to process jobs!');
console.log('   Press Ctrl+C to stop the worker\n');

// Keep the process alive
process.on('SIGINT', async () => {
  console.log('\n⏹️  Shutting down worker...');
  await worker.close();
  console.log('✅ Worker shut down complete');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️  Worker terminated');
  await worker.close();
  process.exit(0);
});
