import { config } from 'dotenv';
import path from 'path';

// Load test environment variables
config({ path: path.join(__dirname, '../.env.test') });

// Set default test environment variables
Object.assign(process.env, {
  NODE_ENV: 'test',
  OPENROUTER_API_KEY: 'test-api-key',
  DATABASE_URL: ':memory:' // Use in-memory database for tests
});

// Global test configuration
// Jest globals will be available when tests run