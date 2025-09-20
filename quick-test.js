#!/usr/bin/env node

/**
 * Simple test script for CLI validation
 */

const { execSync } = require('child_process');
const { writeFileSync } = require('fs');

// Create test agents
const validAgent = {
  "protocolVersion": "0.3.0",
  "name": "Test Agent",
  "description": "A test agent",
  "url": "https://example.com/agent",
  "preferredTransport": "HTTP+JSON",
  "provider": { "organization": "Test Corp" },
  "version": "1.0.0"
};

const invalidAgent = { "name": "Invalid Agent" };

writeFileSync('test-valid.json', JSON.stringify(validAgent, null, 2));
writeFileSync('test-invalid.json', JSON.stringify(invalidAgent, null, 2));

console.log('🧪 Testing CLI functionality...\n');

// Test 1: Valid agent with schema-only
console.log('1. Testing valid agent (schema-only)...');
try {
  const result = execSync('node dist/cli.js validate test-valid.json --schema-only', { encoding: 'utf8' });
  if (result.includes('✅ A2A AGENT VALIDATION PASSED') && result.includes('Score: 100/100')) {
    console.log('   ✅ PASSED\n');
  } else {
    console.log('   ❌ FAILED - Unexpected output\n');
  }
} catch (error) {
  console.log('   ❌ FAILED - Command failed\n');
}

// Test 2: Invalid agent with schema-only  
console.log('2. Testing invalid agent (schema-only)...');
try {
  execSync('node dist/cli.js validate test-invalid.json --schema-only', { encoding: 'utf8' });
  console.log('   ❌ FAILED - Should have failed validation\n');
} catch (error) {
  if (error.stdout && error.stdout.includes('❌ A2A AGENT VALIDATION FAILED') && 
      error.stdout.includes('protocolVersion: Required')) {
    console.log('   ✅ PASSED\n');
  } else {
    console.log('   ❌ FAILED - Wrong error output\n');
  }
}

// Test 3: JSON output
console.log('3. Testing JSON output...');
try {
  const result = execSync('node dist/cli.js validate test-valid.json --schema-only --json', { encoding: 'utf8' });
  const parsed = JSON.parse(result);
  if (parsed.success === true && parsed.score === 100) {
    console.log('   ✅ PASSED\n');
  } else {
    console.log('   ❌ FAILED - Wrong JSON structure\n');
  }
} catch (error) {
  console.log('   ❌ FAILED - JSON parsing failed\n');
}

// Test 4: Help command
console.log('4. Testing help command...');
try {
  const result = execSync('node dist/cli.js --help', { encoding: 'utf8' });
  if (result.includes('A2A (Agent-to-Agent)') && result.includes('validate')) {
    console.log('   ✅ PASSED\n');
  } else {
    console.log('   ❌ FAILED - Wrong help output\n');
  }
} catch (error) {
  console.log('   ❌ FAILED - Help command failed\n');
}

console.log('🎯 Core functionality tests complete!');