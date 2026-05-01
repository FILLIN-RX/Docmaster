/**
 * ═════════════════════════════════════════════════════════════════
 * SERVER.TS - Server Start Point
 * Imports the configured app from index.ts and starts the server
 * ═════════════════════════════════════════════════════════════════
 */

import { createApp } from './index.js';

// Get configuration from environment
const PORT = process.env.PORT || 5000;

// Create the app (all middlewares and routes are set up in index.ts)
const app = createApp();

// Start listening on the port
const server = app.listen(PORT, () => {
  console.log(`\n🚀 DocMaster Server (TypeScript) started on http://localhost:${PORT}`);
  console.log(`📚 API Base: http://localhost:${PORT}/api`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log(`🗄️  DB Test: http://localhost:${PORT}/api/db-test\n`);
});

// Handle server errors
server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Error: Port ${PORT} is already in use.`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

// Keep process alive
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
