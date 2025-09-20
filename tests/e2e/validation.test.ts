import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { join } from 'path';
import { readFileSync } from 'fs';

const CLI_PATH = join(process.cwd(), 'dist', 'cli.js');
const FIXTURES_PATH = join(process.cwd(), 'tests', 'fixtures');

describe('End-to-End Validation Tests', () => {
  beforeAll(() => {
    // Ensure CLI is built
    try {
      execSync('npm run build', { stdio: 'inherit' });
    } catch (error) {
      console.warn('Build failed, assuming CLI is already built');
    }
  });

  describe('Valid Agent Cards', () => {
    it('should validate basic valid agent', () => {
      const agentPath = join(FIXTURES_PATH, 'valid-agents', 'basic-agent.json');
      
      const result = execSync(`node "${CLI_PATH}" validate "${agentPath}"`, { 
        encoding: 'utf8' 
      });

      expect(result).toContain('✅ A2A AGENT VALIDATION PASSED');
      expect(result).toContain('Score: 100/100');
      expect(result).toContain('Version: 0.3.0');
      expect(result).toContain('Perfect! Your agent passes all validations');
    });

    it('should validate complex agent with all features', () => {
      const agentPath = join(FIXTURES_PATH, 'valid-agents', 'complex-agent.json');
      
      const result = execSync(`node "${CLI_PATH}" validate "${agentPath}"`, { 
        encoding: 'utf8' 
      });

      expect(result).toContain('✅ A2A AGENT VALIDATION PASSED');
      expect(result).toContain('Score: 100/100');
      expect(result).toContain('Complex Test Agent');
    });

    it('should validate legacy agent with warnings', () => {
      const agentPath = join(FIXTURES_PATH, 'valid-agents', 'legacy-agent.json');
      
      const result = execSync(`node "${CLI_PATH}" validate "${agentPath}"`, { 
        encoding: 'utf8' 
      });

      expect(result).toContain('✅ A2A AGENT VALIDATION PASSED');
      expect(result).toContain('Version: 0.2.0');
      // May contain warnings about legacy features
    });
  });

  describe('Invalid Agent Cards', () => {
    it('should fail validation for missing required fields', () => {
      const agentPath = join(FIXTURES_PATH, 'invalid-agents', 'missing-required.json');
      
      try {
        execSync(`node "${CLI_PATH}" validate "${agentPath}"`, { 
          encoding: 'utf8' 
        });
        expect.fail('Should have failed validation');
      } catch (error: any) {
        expect(error.status).toBe(1);
        expect(error.stdout).toContain('❌ A2A AGENT VALIDATION FAILED');
        expect(error.stdout).toContain('ERRORS FOUND');
        expect(error.stdout).toContain('protocolVersion: Required');
        expect(error.stdout).toContain('url: Required');
        expect(error.stdout).toContain('preferredTransport: Required');
      }
    });

    it('should fail validation for invalid URL format', () => {
      const agentPath = join(FIXTURES_PATH, 'invalid-agents', 'invalid-url.json');
      
      try {
        execSync(`node "${CLI_PATH}" validate "${agentPath}"`, { 
          encoding: 'utf8' 
        });
        expect.fail('Should have failed validation');
      } catch (error: any) {
        expect(error.status).toBe(1);
        expect(error.stdout).toContain('❌ A2A AGENT VALIDATION FAILED');
        expect(error.stdout).toContain('url');
      }
    });

    it('should fail validation for invalid version format', () => {
      const agentPath = join(FIXTURES_PATH, 'invalid-agents', 'invalid-version.json');
      
      try {
        execSync(`node "${CLI_PATH}" validate "${agentPath}"`, { 
          encoding: 'utf8' 
        });
        expect.fail('Should have failed validation');
      } catch (error: any) {
        expect(error.status).toBe(1);
        expect(error.stdout).toContain('❌ A2A AGENT VALIDATION FAILED');
        expect(error.stdout).toContain('version');
        expect(error.stdout).toContain('semver');
      }
    });

    it('should handle multiple validation issues', () => {
      const agentPath = join(FIXTURES_PATH, 'invalid-agents', 'mixed-issues.json');
      
      try {
        execSync(`node "${CLI_PATH}" validate "${agentPath}"`, { 
          encoding: 'utf8' 
        });
        expect.fail('Should have failed validation');
      } catch (error: any) {
        expect(error.status).toBe(1);
        expect(error.stdout).toContain('❌ A2A AGENT VALIDATION FAILED');
        expect(error.stdout).toContain('ERRORS FOUND');
        
        // Should contain multiple error types
        const errorCount = (error.stdout.match(/❌/g) || []).length;
        expect(errorCount).toBeGreaterThan(3); // Multiple errors expected
      }
    });
  });

  describe('JSON Output Mode', () => {
    it('should output valid JSON for successful validation', () => {
      const agentPath = join(FIXTURES_PATH, 'valid-agents', 'basic-agent.json');
      
      const result = execSync(`node "${CLI_PATH}" validate "${agentPath}" --json`, { 
        encoding: 'utf8' 
      });

      const jsonResult = JSON.parse(result);
      expect(jsonResult.success).toBe(true);
      expect(jsonResult.score).toBe(100);
      expect(jsonResult.errors).toHaveLength(0);
      expect(jsonResult.validations).toBeDefined();
      expect(jsonResult.validations.length).toBeGreaterThan(0);
      expect(jsonResult.versionInfo).toBeDefined();
      expect(jsonResult.versionInfo.detectedVersion).toBe('0.3.0');
    });

    it('should output valid JSON for failed validation', () => {
      const agentPath = join(FIXTURES_PATH, 'invalid-agents', 'missing-required.json');
      
      try {
        execSync(`node "${CLI_PATH}" validate "${agentPath}" --json`, { 
          encoding: 'utf8' 
        });
        expect.fail('Should have failed validation');
      } catch (error: any) {
        expect(error.status).toBe(1);
        
        const jsonResult = JSON.parse(error.stdout);
        expect(jsonResult.success).toBe(false);
        expect(jsonResult.score).toBeLessThan(100);
        expect(jsonResult.errors.length).toBeGreaterThan(0);
        expect(jsonResult.validations).toBeDefined();
        
        // Verify error structure
        expect(jsonResult.errors[0]).toHaveProperty('code');
        expect(jsonResult.errors[0]).toHaveProperty('message');
        expect(jsonResult.errors[0]).toHaveProperty('severity');
      }
    });

    it('should include timing information in JSON output', () => {
      const agentPath = join(FIXTURES_PATH, 'valid-agents', 'basic-agent.json');
      
      const result = execSync(`node "${CLI_PATH}" validate "${agentPath}" --json`, { 
        encoding: 'utf8' 
      });

      const jsonResult = JSON.parse(result);
      expect(jsonResult.validations.some((v: any) => 
        typeof v.duration === 'number'
      )).toBe(true);
    });
  });

  describe('Validation Modes', () => {
    const testAgent = join(FIXTURES_PATH, 'valid-agents', 'complex-agent.json');

    it('should run in progressive mode by default', () => {
      const result = execSync(`node "${CLI_PATH}" validate "${testAgent}" --json`, { 
        encoding: 'utf8' 
      });

      const jsonResult = JSON.parse(result);
      expect(jsonResult.versionInfo.strictness).toBe('progressive');
    });

    it('should run in strict mode when specified', () => {
      const result = execSync(`node "${CLI_PATH}" validate "${testAgent}" --strict --json`, { 
        encoding: 'utf8' 
      });

      const jsonResult = JSON.parse(result);
      expect(jsonResult.versionInfo.strictness).toBe('strict');
    });

    it('should run in conservative mode when specified', () => {
      const result = execSync(`node "${CLI_PATH}" validate "${testAgent}" --conservative --json`, { 
        encoding: 'utf8' 
      });

      const jsonResult = JSON.parse(result);
      expect(jsonResult.versionInfo.strictness).toBe('conservative');
    });
  });

  describe('Schema-only Mode', () => {
    it('should validate schema only without network calls', () => {
      const agentPath = join(FIXTURES_PATH, 'valid-agents', 'basic-agent.json');
      
      const start = Date.now();
      const result = execSync(`node "${CLI_PATH}" validate "${agentPath}" --schema-only`, { 
        encoding: 'utf8' 
      });
      const duration = Date.now() - start;

      expect(result).toContain('✅ A2A AGENT VALIDATION PASSED');
      expect(duration).toBeLessThan(1000); // Should be very fast
    });
  });

  describe('Error-only Mode', () => {
    it('should show only errors and warnings', () => {
      const agentPath = join(FIXTURES_PATH, 'invalid-agents', 'mixed-issues.json');
      
      try {
        execSync(`node "${CLI_PATH}" validate "${agentPath}" --errors-only`, { 
          encoding: 'utf8' 
        });
        expect.fail('Should have failed validation');
      } catch (error: any) {
        expect(error.status).toBe(1);
        expect(error.stdout).toContain('ERRORS FOUND');
        expect(error.stdout).not.toContain('VALIDATIONS PERFORMED');
      }
    });
  });

  describe('Fixture Validation', () => {
    it('should have valid fixture files', () => {
      // Verify that all fixture files are valid JSON
      const validAgents = [
        'basic-agent.json',
        'complex-agent.json',
        'legacy-agent.json'
      ];

      const invalidAgents = [
        'missing-required.json',
        'invalid-url.json',
        'invalid-version.json',
        'mixed-issues.json'
      ];

      [...validAgents, ...invalidAgents].forEach(filename => {
        const filePath = join(FIXTURES_PATH, 
          validAgents.includes(filename) ? 'valid-agents' : 'invalid-agents', 
          filename
        );
        
        expect(() => {
          const content = readFileSync(filePath, 'utf8');
          JSON.parse(content);
        }).not.toThrow(`${filename} should be valid JSON`);
      });
    });
  });

  describe('Performance Tests', () => {
    it('should complete validation within reasonable time', () => {
      const agentPath = join(FIXTURES_PATH, 'valid-agents', 'complex-agent.json');
      
      const start = Date.now();
      execSync(`node "${CLI_PATH}" validate "${agentPath}" --schema-only`, { 
        encoding: 'utf8' 
      });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle large agent cards efficiently', () => {
      // Test with complex agent that has many fields
      const agentPath = join(FIXTURES_PATH, 'valid-agents', 'complex-agent.json');
      
      const start = Date.now();
      const result = execSync(`node "${CLI_PATH}" validate "${agentPath}" --schema-only --json`, { 
        encoding: 'utf8' 
      });
      const duration = Date.now() - start;

      const jsonResult = JSON.parse(result);
      expect(jsonResult.success).toBe(true);
      expect(duration).toBeLessThan(2000); // Should be fast even for complex agents
    });
  });
});