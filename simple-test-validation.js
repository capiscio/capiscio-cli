#!/usr/bin/env node

/**
 * Simple validation test script to ensure the CLI works correctly
 * This validates core functionality without complex mocking
 */

const { execSync } = require('child_process');
const { writeFileSync, mkdirSync } = require('fs');
const { join } = require('path');

const CLI_PATH = join(__dirname, 'dist', 'cli.js');
const TEST_DIR = join(__dirname, 'test-validation');

// Create test directory
try {
  mkdirSync(TEST_DIR, { recursive: true });
} catch (e) {
  // Directory exists
}

const validAgent = {
  "protocolVersion": "0.3.0",
  "name": "Test Agent",
  "description": "A test agent",
  "url": "https://example.com/agent",
  "preferredTransport": "HTTP+JSON",
  "provider": {
    "organization": "Test Corp"
  },
  "version": "1.0.0"
};

const invalidAgent = {
  "name": "Invalid Agent",
  "description": "Missing required fields"
};

function runTest(name, testFn) {
  try {
    console.log(`\n🧪 Running: ${name}`);
    testFn();
    console.log(`✅ PASSED: ${name}`);
    return true;
  } catch (error) {
    console.log(`❌ FAILED: ${name}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

function testValidAgentSchemaOnly() {
  const agentFile = join(TEST_DIR, 'valid.json');
  writeFileSync(agentFile, JSON.stringify(validAgent, null, 2));
  
  const result = execSync(`node "${CLI_PATH}" validate "${agentFile}" --schema-only`, { 
    encoding: 'utf8' 
  });
  
  if (!result.includes('✅ A2A AGENT VALIDATION PASSED')) {
    throw new Error('Expected validation to pass');
  }
  
  if (!result.includes('Score: 100/100')) {
    throw new Error('Expected perfect score');
  }
}

function testInvalidAgentSchemaOnly() {
  const agentFile = join(TEST_DIR, 'invalid.json');
  writeFileSync(agentFile, JSON.stringify(invalidAgent, null, 2));
  
  try {
    execSync(`node "${CLI_PATH}" validate "${agentFile}" --schema-only`, { 
      encoding: 'utf8' 
    });
    throw new Error('Expected validation to fail');
  } catch (error) {
    if (error.status !== 1) {
      throw new Error('Expected exit code 1');
    }
    
    if (!error.stdout.includes('❌ A2A AGENT VALIDATION FAILED')) {
      throw new Error('Expected validation failure message');
    }
    
    if (!error.stdout.includes('protocolVersion: Required')) {
      throw new Error('Expected missing protocolVersion error');
    }
  }
}

function testJsonOutput() {
  const agentFile = join(TEST_DIR, 'json-test.json');
  writeFileSync(agentFile, JSON.stringify(validAgent, null, 2));
  
  const result = execSync(`node "${CLI_PATH}" validate "${agentFile}" --schema-only --json`, { 
    encoding: 'utf8' 
  });
  
  const jsonResult = JSON.parse(result);
  
  if (jsonResult.success !== true) {
    throw new Error('Expected success: true in JSON output');
  }
  
  if (jsonResult.score !== 100) {
    throw new Error('Expected score: 100 in JSON output');
  }
  
  if (!Array.isArray(jsonResult.validations)) {
    throw new Error('Expected validations array in JSON output');
  }
}

function testCLIHelp() {
  const result = execSync(`node "${CLI_PATH}" --help`, { encoding: 'utf8' });
  
  if (!result.includes('A2A (Agent-to-Agent) protocol')) {
    throw new Error('Expected A2A help text');
  }
  
  if (!result.includes('validate')) {
    throw new Error('Expected validate command in help');
  }
}

function testValidationModes() {
  const agentFile = join(TEST_DIR, 'mode-test.json');
  writeFileSync(agentFile, JSON.stringify(validAgent, null, 2));
  
  // Test progressive mode (default)
  const progressive = execSync(`node "${CLI_PATH}" validate "${agentFile}" --schema-only --json`, { 
    encoding: 'utf8' 
  });
  const progressiveResult = JSON.parse(progressive);
  
  if (progressiveResult.versionInfo.strictness !== 'progressive') {
    throw new Error('Expected progressive strictness');
  }
  
  // Test strict mode
  const strict = execSync(`node "${CLI_PATH}" validate "${agentFile}" --strict --schema-only --json`, { 
    encoding: 'utf8' 
  });
  const strictResult = JSON.parse(strict);
  
  if (strictResult.versionInfo.strictness !== 'strict') {
    throw new Error('Expected strict strictness');
  }
  
  // Test conservative mode
  const conservative = execSync(`node "${CLI_PATH}" validate "${agentFile}" --conservative --schema-only --json`, { 
    encoding: 'utf8' 
  });
  const conservativeResult = JSON.parse(conservative);
  
  if (conservativeResult.versionInfo.strictness !== 'conservative') {
    throw new Error('Expected conservative strictness');
  }
}

function testMalformedJson() {
  const agentFile = join(TEST_DIR, 'malformed.json');
  writeFileSync(agentFile, '{ invalid json }');
  
  try {
    execSync(`node "${CLI_PATH}" validate "${agentFile}" --schema-only`, { 
      encoding: 'utf8' 
    });
    throw new Error('Expected validation to fail for malformed JSON');
  } catch (error) {
    if (error.status !== 1) {
      throw new Error('Expected exit code 1 for malformed JSON');
    }
  }
}

// Run all tests
console.log('🚀 Running CLI Validation Tests\n');

const tests = [
  ['CLI Help Command', testCLIHelp],
  ['Valid Agent (Schema Only)', testValidAgentSchemaOnly],
  ['Invalid Agent (Schema Only)', testInvalidAgentSchemaOnly],
  ['JSON Output Format', testJsonOutput],
  ['Validation Modes', testValidationModes],
  ['Malformed JSON Handling', testMalformedJson],
];

let passed = 0;
let failed = 0;

tests.forEach(([name, testFn]) => {
  if (runTest(name, testFn)) {
    passed++;
  } else {
    failed++;
  }
});

console.log(`\n📊 Test Results:`);
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);
console.log(`   📈 Total:  ${passed + failed}`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! CLI is working correctly.');
  process.exit(0);
} else {
  console.log('\n💥 Some tests failed. Check the output above.');
  process.exit(1);
}