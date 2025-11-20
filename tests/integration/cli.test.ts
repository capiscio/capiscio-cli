import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { execSync, spawn } from 'child_process';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import type { ChildProcess } from 'child_process';

const CLI_PATH = join(process.cwd(), 'dist', 'cli.js');
const TEST_DIR = join(process.cwd(), 'test-temp');

describe('CLI Integration Tests', () => {
  beforeEach(() => {
    // Create test directory
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('CLI Basic Functionality', () => {
    it('should show help when no arguments provided', () => {
      const result = execSync(`node "${CLI_PATH}" --help`, { 
        encoding: 'utf8',
        cwd: TEST_DIR 
      });

      expect(result).toContain('Usage: capiscio');
      expect(result).toContain('The definitive CLI tool for validating A2A');
      expect(result).toContain('Commands:');
      expect(result).toContain('validate');
    });

    it('should show version', () => {
      const result = execSync(`node "${CLI_PATH}" --version`, { 
        encoding: 'utf8',
        cwd: TEST_DIR 
      });

      expect(result.trim()).toMatch(/\d+\.\d+\.\d+/);
    });

    it('should show validate command help', () => {
      const result = execSync(`node "${CLI_PATH}" validate --help`, { 
        encoding: 'utf8',
        cwd: TEST_DIR 
      });

      expect(result).toContain('Usage: capiscio validate');
      expect(result).toContain('--strict');
      expect(result).toContain('--progressive');
      // expect(result).toContain('--conservative');
      expect(result).toContain('--json');
      expect(result).toContain('--schema-only');
    });
  });

  describe('File Validation', () => {
    it('should validate a valid agent card file', () => {
      const validAgent = {
        protocolVersion: '0.3.0',
        name: 'Test Agent',
        description: 'A test agent for CLI testing',
        url: 'https://example.com/agent',
        preferredTransport: 'HTTP+JSON',
        provider: {
          organization: 'Test Corp'
        },
        version: '1.0.0'
      };

      const agentFile = join(TEST_DIR, 'valid-agent.json');
      writeFileSync(agentFile, JSON.stringify(validAgent, null, 2));

      const result = execSync(`node "${CLI_PATH}" validate "${agentFile}"`, { 
        encoding: 'utf8',
        cwd: TEST_DIR 
      });

      expect(result).toContain('✅ A2A AGENT VALIDATION PASSED');
      // Score is 85 because of missing skills/signatures warnings
      expect(result).toContain('Score: 85/100');
    });

    it('should fail validation for invalid agent card', () => {
      const invalidAgent = {
        name: 'Invalid Agent',
        description: 'Missing required fields'
      };

      const agentFile = join(TEST_DIR, 'invalid-agent.json');
      writeFileSync(agentFile, JSON.stringify(invalidAgent, null, 2));

      try {
        execSync(`node "${CLI_PATH}" validate "${agentFile}"`, { 
          encoding: 'utf8',
          cwd: TEST_DIR 
        });
        expect.fail('Should have failed validation');
      } catch (error: any) {
        expect(error.status).toBe(1);
        expect(error.stdout).toContain('❌ A2A AGENT VALIDATION FAILED');
        // Go output format
        expect(error.stdout).toContain('protocolVersion is required');
        expect(error.stdout).toContain('Agent URL is required');
      }
    });

    it('should output JSON format when requested', () => {
      const validAgent = {
        protocolVersion: '0.3.0',
        name: 'JSON Test Agent',
        description: 'Testing JSON output',
        url: 'https://example.com/agent',
        preferredTransport: 'HTTP+JSON',
        provider: {
          organization: 'Test Corp'
        },
        version: '1.0.0'
      };

      const agentFile = join(TEST_DIR, 'json-agent.json');
      writeFileSync(agentFile, JSON.stringify(validAgent, null, 2));

      const result = execSync(`node "${CLI_PATH}" validate "${agentFile}" --json`, { 
        encoding: 'utf8',
        cwd: TEST_DIR 
      });

      const jsonResult = JSON.parse(result);
      expect(jsonResult.success).toBe(true);
      expect(jsonResult.score).toBe(85);
      expect(jsonResult.errors || []).toHaveLength(0);
      // We added Version to Go output, so we can check for it
      expect(jsonResult.version).toBeDefined();
    });

    it('should handle malformed JSON files', () => {
      const agentFile = join(TEST_DIR, 'malformed.json');
      writeFileSync(agentFile, '{ invalid json }');

      try {
        execSync(`node "${CLI_PATH}" validate "${agentFile}"`, { 
          encoding: 'utf8',
          cwd: TEST_DIR 
        });
        expect.fail('Should have failed for malformed JSON');
      } catch (error: any) {
        expect(error.status).toBe(1);
        // Go JSON parser error
        expect(error.stderr).toMatch(/invalid character|failed to parse/);
      }
    });

    it('should handle non-existent files', () => {
      try {
        execSync(`node "${CLI_PATH}" validate "${join(TEST_DIR, 'nonexistent.json')}"`, { 
          encoding: 'utf8',
          cwd: TEST_DIR 
        });
        expect.fail('Should have failed for non-existent file');
      } catch (error: any) {
        expect(error.status).toBe(1);
        expect(error.stderr).toMatch(/failed to read file|no such file/);
      }
    });
  });

  describe('Validation Modes', () => {
    const testAgent = {
      protocolVersion: '0.3.0',
      name: 'Mode Test Agent',
      description: 'Testing validation modes',
      url: 'https://example.com/agent',
      preferredTransport: 'GRPC',
      provider: {
        organization: 'Test Corp'
      },
      version: '1.0.0',
      additionalInterfaces: [{
        url: 'https://grpc.example.com',
        transport: 'GRPC'
      }],
      capabilities: {
        streaming: false // This should trigger warnings
      }
    };

    beforeEach(() => {
      const agentFile = join(TEST_DIR, 'mode-test-agent.json');
      writeFileSync(agentFile, JSON.stringify(testAgent, null, 2));
    });

    it('should use progressive mode by default', () => {
      const result = execSync(`node "${CLI_PATH}" validate "${join(TEST_DIR, 'mode-test-agent.json')}"`, { 
        encoding: 'utf8',
        cwd: TEST_DIR 
      });

      // Progressive mode allows warnings, so it should pass
      expect(result).toContain('✅ A2A AGENT VALIDATION PASSED');
    });

    it('should use strict mode when specified', () => {
      try {
        execSync(`node "${CLI_PATH}" validate "${join(TEST_DIR, 'mode-test-agent.json')}" --strict`, { 
          encoding: 'utf8',
          cwd: TEST_DIR 
        });
        expect.fail('Should have failed in strict mode due to warnings');
      } catch (error: any) {
        expect(error.status).toBe(1);
        expect(error.stdout).toContain('❌ A2A AGENT VALIDATION FAILED');
      }
    });

    // Conservative mode is temporarily disabled
    it.skip('should use conservative mode when specified', () => {
      // Conservative mode is not currently supported.
    });
  });

  describe('Auto-detection', () => {
    it('should auto-detect agent-card.json in current directory', () => {
      const validAgent = {
        protocolVersion: '0.3.0',
        name: 'Auto-detect Test',
        description: 'Testing auto-detection',
        url: 'https://example.com/agent',
        preferredTransport: 'HTTP+JSON',
        provider: {
          organization: 'Test Corp'
        },
        version: '1.0.0'
      };

      writeFileSync(join(TEST_DIR, 'agent-card.json'), JSON.stringify(validAgent, null, 2));

      const result = execSync(`node "${CLI_PATH}" validate`, { 
        encoding: 'utf8',
        cwd: TEST_DIR 
      });

      expect(result).toContain('✅ A2A AGENT VALIDATION PASSED');
    });

    it('should fail gracefully when no agent card found', () => {
      try {
        execSync(`node "${CLI_PATH}" validate`, { 
          encoding: 'utf8',
          cwd: TEST_DIR 
        });
        expect.fail('Should have failed when no agent card found');
      } catch (error: any) {
        expect(error.status).toBe(1);
        // Go binary error message when file is missing
        expect(error.stderr).toMatch(/failed to read file|no such file/);
      }
    });
  });

  describe('Schema-only Mode', () => {
    it('should skip network calls in schema-only mode', () => {
      const validAgent = {
        protocolVersion: '0.3.0',
        name: 'Schema Only Test',
        description: 'Testing schema-only mode',
        url: 'https://example.com/agent',
        preferredTransport: 'HTTP+JSON',
        provider: {
          organization: 'Test Corp'
        },
        version: '1.0.0'
      };

      const agentFile = join(TEST_DIR, 'schema-only.json');
      writeFileSync(agentFile, JSON.stringify(validAgent, null, 2));

      const result = execSync(`node "${CLI_PATH}" validate "${agentFile}" --schema-only`, { 
        encoding: 'utf8',
        cwd: TEST_DIR 
      });

      expect(result).toContain('✅ A2A AGENT VALIDATION PASSED');
      // Should complete quickly since no network calls
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown options gracefully', () => {
      try {
        execSync(`node "${CLI_PATH}" validate --unknown-option`, { 
          encoding: 'utf8',
          cwd: TEST_DIR 
        });
        expect.fail('Should have failed for unknown option');
      } catch (error: any) {
        expect(error.status).not.toBe(0);
        expect(error.stderr).toContain('unknown option');
      }
    });

    it('should handle invalid timeout values', () => {
      const validAgent = {
        protocolVersion: '0.3.0',
        name: 'Timeout Test',
        description: 'Testing timeout handling',
        url: 'https://example.com/agent',
        preferredTransport: 'HTTP+JSON',
        provider: {
          organization: 'Test Corp'
        },
        version: '1.0.0'
      };

      const agentFile = join(TEST_DIR, 'timeout-test.json');
      writeFileSync(agentFile, JSON.stringify(validAgent, null, 2));

      // Should handle non-numeric timeout gracefully
      const result = execSync(`node "${CLI_PATH}" validate "${agentFile}" --timeout abc --schema-only`, { 
        encoding: 'utf8',
        cwd: TEST_DIR 
      });

      // Should still validate successfully with default timeout
      expect(result).toContain('✅ A2A AGENT VALIDATION PASSED');
    });
  });

  describe('Output Filtering', () => {
    it('should show only errors when errors-only flag is used', () => {
      const invalidAgent = {
        name: 'Errors Only Test',
        description: 'Testing errors-only output'
        // Missing required fields
      };

      const agentFile = join(TEST_DIR, 'errors-only.json');
      writeFileSync(agentFile, JSON.stringify(invalidAgent, null, 2));

      try {
        execSync(`node "${CLI_PATH}" validate "${agentFile}" --errors-only`, { 
          encoding: 'utf8',
          cwd: TEST_DIR 
        });
        expect.fail('Should have failed validation');
      } catch (error: any) {
        expect(error.status).toBe(1);
        // In errors-only mode, the header might be suppressed, but errors should be present
        expect(error.stdout).toMatch(/error:|warning:/);
        expect(error.stdout).not.toContain('VALIDATIONS PERFORMED');
      }
    });
  });
});