import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Environment setup
    environment: 'node',
    
    // Run tests serially to avoid build race conditions
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    
    // Set timeouts for integration tests
    testTimeout: 30000,
    hookTimeout: 30000,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/__tests__/**',
        'src/cli.ts' // CLI entry point is tested via integration
      ]
    }
  }
});