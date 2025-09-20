import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConsoleOutput } from '../output/console';
import { JsonOutput } from '../output/json';
import type { ValidationResult, CLIOptions } from '../types';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('Output Formatters', () => {
  let consoleOutput: ConsoleOutput;
  let jsonOutput: JsonOutput;
  let consoleLogs: string[];
  let consoleErrors: string[];

  beforeEach(() => {
    consoleOutput = new ConsoleOutput();
    jsonOutput = new JsonOutput();
    consoleLogs = [];
    consoleErrors = [];

    // Mock console methods
    console.log = vi.fn((...args) => {
      consoleLogs.push(args.join(' '));
    });
    console.error = vi.fn((...args) => {
      consoleErrors.push(args.join(' '));
    });
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    vi.clearAllMocks();
  });

  const successResult: ValidationResult = {
    success: true,
    score: 100,
    errors: [],
    warnings: [],
    suggestions: [],
    validations: [
      {
        id: 'schema_validation',
        name: 'Schema Validation',
        status: 'passed',
        message: 'Agent card conforms to A2A v0.3.0 schema',
        duration: 12,
        details: 'Agent card structure is valid'
      },
      {
        id: 'v030_features',
        name: 'A2A v0.3.0 Features',
        status: 'passed',
        message: 'All v0.3.0 features are properly configured',
        duration: 5,
        details: 'Validation of v0.3.0 specific features and capabilities'
      }
    ],
    versionInfo: {
      detectedVersion: '0.3.0',
      validatorVersion: '0.3.0',
      strictness: 'progressive',
      compatibility: {
        detectedVersion: '0.3.0',
        targetVersion: '0.3.0',
        compatible: true,
        mismatches: [],
        suggestions: []
      },
      migrationPath: []
    }
  };

  const failureResult: ValidationResult = {
    success: false,
    score: 65,
    errors: [
      {
        code: 'SCHEMA_VALIDATION_ERROR',
        message: 'url: Invalid URL format',
        field: 'url',
        severity: 'error',
        fixable: true
      },
      {
        code: 'VERSION_MISMATCH_ERROR',
        message: 'Version format is invalid',
        field: 'version',
        severity: 'error',
        fixable: true
      }
    ],
    warnings: [
      {
        code: 'LEGACY_DISCOVERY_ENDPOINT',
        message: 'Using legacy discovery endpoint',
        field: 'discovery',
        severity: 'warning',
        fixable: true
      }
    ],
    suggestions: [
      {
        id: 'migrate_legacy_endpoint',
        message: 'Consider migrating to new endpoint format',
        severity: 'info',
        impact: 'Future compatibility',
        fixable: true
      }
    ],
    validations: [
      {
        id: 'schema_validation',
        name: 'Schema Validation',
        status: 'failed',
        message: 'Schema validation failed with 2 errors',
        duration: 8,
        details: 'Agent card does not conform to A2A v0.3.0 schema'
      },
      {
        id: 'v030_features',
        name: 'A2A v0.3.0 Features',
        status: 'passed',
        message: 'All v0.3.0 features are properly configured',
        duration: 3,
        details: 'Validation of v0.3.0 specific features and capabilities'
      }
    ],
    versionInfo: {
      detectedVersion: '0.3.0',
      validatorVersion: '0.3.0',
      strictness: 'progressive',
      compatibility: {
        detectedVersion: '0.3.0',
        targetVersion: '0.3.0',
        compatible: false,
        mismatches: [],
        suggestions: []
      },
      migrationPath: []
    }
  };

  describe('ConsoleOutput', () => {
    describe('Successful validation', () => {
      it('should display success header', () => {
        const options: CLIOptions = {};
        consoleOutput.display(successResult, 'test-agent.json', options);

        const output = consoleLogs.join('\n');
        expect(output).toContain('✅ A2A AGENT VALIDATION PASSED');
        expect(output).toContain('Agent: test-agent.json');
        expect(output).toContain('Score: 100/100');
        expect(output).toContain('Version: 0.3.0 (Strictness: progressive)');
      });

      it('should display validation summary', () => {
        const options: CLIOptions = {};
        consoleOutput.display(successResult, 'test-agent.json', options);

        const output = consoleLogs.join('\n');
        expect(output).toContain('VALIDATION SUMMARY:');
        expect(output).toContain('2 checks performed');
        expect(output).toContain('passed');
        expect(output).toContain('failed');
        expect(output).toContain('warnings');
        expect(output).toContain('Completed in 17ms');
      });

      it('should display validation details', () => {
        const options: CLIOptions = {};
        consoleOutput.display(successResult, 'test-agent.json', options);

        const output = consoleLogs.join('\n');
        expect(output).toContain('VALIDATIONS PERFORMED:');
        expect(output).toContain('✅ Schema Validation');
        expect(output).toContain('Agent card structure is valid');
        expect(output).toContain('Duration: 12ms');
        expect(output).toContain('✅ A2A v0.3.0 Features');
      });

      it('should display success message', () => {
        const options: CLIOptions = {};
        consoleOutput.display(successResult, 'test-agent.json', options);

        const output = consoleLogs.join('\n');
        expect(output).toContain('🏆 Perfect! Your agent passes all validations.');
        expect(output).toContain('🚀 Your agent is ready for deployment!');
      });
    });

    describe('Failed validation', () => {
      it('should display failure header', () => {
        const options: CLIOptions = {};
        consoleOutput.display(failureResult, 'test-agent.json', options);

        const output = consoleLogs.join('\n');
        expect(output).toContain('❌ A2A AGENT VALIDATION FAILED');
        expect(output).toContain('Score: 65/100');
      });

      it('should display errors', () => {
        const options: CLIOptions = {};
        consoleOutput.display(failureResult, 'test-agent.json', options);

        const output = consoleLogs.join('\n');
        expect(output).toContain('ERRORS FOUND (2):');
        expect(output).toContain('❌ SCHEMA_VALIDATION_ERROR: url: Invalid URL format');
        expect(output).toContain('Field: url');
        expect(output).toContain('❌ VERSION_MISMATCH_ERROR: Version format is invalid');
        expect(output).toContain('Field: version');
      });

      it('should display warnings', () => {
        const options: CLIOptions = {};
        consoleOutput.display(failureResult, 'test-agent.json', options);

        const output = consoleLogs.join('\n');
        expect(output).toContain('WARNINGS (1):');
        expect(output).toContain('⚠️  LEGACY_DISCOVERY_ENDPOINT: Using legacy discovery endpoint');
      });

      it('should display suggestions', () => {
        const options: CLIOptions = {};
        consoleOutput.display(failureResult, 'test-agent.json', options);

        const output = consoleLogs.join('\n');
        expect(output).toContain('SUGGESTIONS (1):');
        expect(output).toContain('💡 Consider migrating to new endpoint format');
        expect(output).toContain('Impact: Future compatibility');
      });

      it('should display next steps', () => {
        const options: CLIOptions = {};
        consoleOutput.display(failureResult, 'test-agent.json', options);

        const output = consoleLogs.join('\n');
        expect(output).toContain('NEXT STEPS:');
        expect(output).toContain('1. Fix the errors listed above');
        expect(output).toContain('2. Re-run validation to confirm fixes');
      });
    });

    describe('Errors-only mode', () => {
      it('should skip validation details in errors-only mode', () => {
        const options: CLIOptions = { errorsOnly: true };
        consoleOutput.display(failureResult, 'test-agent.json', options);

        const output = consoleLogs.join('\n');
        expect(output).not.toContain('VALIDATIONS PERFORMED:');
        expect(output).toContain('ERRORS FOUND (2):');
        expect(output).toContain('WARNINGS (1):');
      });

      it('should skip suggestions in errors-only mode', () => {
        const options: CLIOptions = { errorsOnly: true };
        consoleOutput.display(failureResult, 'test-agent.json', options);

        const output = consoleLogs.join('\n');
        expect(output).not.toContain('SUGGESTIONS (1):');
      });
    });

    describe('Version compatibility display', () => {
      it('should show version compatibility issues', () => {
        const incompatibleResult = {
          ...failureResult,
          versionInfo: {
            ...failureResult.versionInfo!,
            compatibility: {
              detectedVersion: '0.2.0',
              targetVersion: '0.3.0',
              compatible: false,
              mismatches: [{
                feature: 'capabilities.streaming',
                requiredVersion: '0.3.0',
                detectedVersion: '0.2.0',
                severity: 'warning' as const,
                description: 'Streaming requires v0.3.0+'
              }],
              suggestions: []
            }
          }
        };

        const options: CLIOptions = {};
        consoleOutput.display(incompatibleResult, 'test-agent.json', options);

        const output = consoleLogs.join('\n');
        expect(output).toContain('Version Compatibility Issues: 1 detected');
      });
    });
  });

  describe('JsonOutput', () => {
    it('should output valid JSON for successful validation', () => {
      const options: CLIOptions = {};
      jsonOutput.display(successResult, 'test-agent.json', options);

      expect(consoleLogs).toHaveLength(1);
      const output = consoleLogs[0];
      expect(output).toBeDefined();
      
      expect(() => JSON.parse(output!)).not.toThrow();
      const parsed = JSON.parse(output!);
      
      expect(parsed.success).toBe(true);
      expect(parsed.score).toBe(100);
      expect(parsed.errors).toHaveLength(0);
      expect(parsed.warnings).toHaveLength(0);
      expect(parsed.validations).toHaveLength(2);
      expect(parsed.versionInfo).toBeDefined();
    });

    it('should output valid JSON for failed validation', () => {
      const options: CLIOptions = {};
      jsonOutput.display(failureResult, 'test-agent.json', options);

      expect(consoleLogs).toHaveLength(1);
      const output = consoleLogs[0];
      expect(output).toBeDefined();
      
      expect(() => JSON.parse(output!)).not.toThrow();
      const parsed = JSON.parse(output!);
      
      expect(parsed.success).toBe(false);
      expect(parsed.score).toBe(65);
      expect(parsed.errors).toHaveLength(2);
      expect(parsed.warnings).toHaveLength(1);
      expect(parsed.suggestions).toHaveLength(1);
      expect(parsed.validations).toHaveLength(2);
    });

    it('should preserve all error details in JSON', () => {
      const options: CLIOptions = {};
      jsonOutput.display(failureResult, 'test-agent.json', options);

      const output = consoleLogs[0];
      expect(output).toBeDefined();
      const parsed = JSON.parse(output!);
      
      expect(parsed.errors[0]).toEqual({
        code: 'SCHEMA_VALIDATION_ERROR',
        message: 'url: Invalid URL format',
        field: 'url',
        severity: 'error',
        fixable: true
      });
      
      expect(parsed.warnings[0]).toEqual({
        code: 'LEGACY_DISCOVERY_ENDPOINT',
        message: 'Using legacy discovery endpoint',
        field: 'discovery',
        severity: 'warning',
        fixable: true
      });
    });

    it('should include complete validation details', () => {
      const options: CLIOptions = {};
      jsonOutput.display(successResult, 'test-agent.json', options);

      const output = consoleLogs[0];
      expect(output).toBeDefined();
      const parsed = JSON.parse(output!);
      
      expect(parsed.validations[0]).toEqual({
        id: 'schema_validation',
        name: 'Schema Validation',
        status: 'passed',
        message: 'Agent card conforms to A2A v0.3.0 schema',
        duration: 12,
        details: 'Agent card structure is valid'
      });
    });

    it('should format JSON with proper indentation', () => {
      const options: CLIOptions = {};
      jsonOutput.display(successResult, 'test-agent.json', options);

      const output = consoleLogs[0];
      expect(output).toContain('\n  "success": true');
      expect(output).toContain('\n  "score": 100');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty validation results', () => {
      const emptyResult: ValidationResult = {
        success: false,
        score: 0,
        errors: [],
        warnings: [],
        suggestions: [],
        validations: []
      };

      const options: CLIOptions = {};
      
      expect(() => {
        consoleOutput.display(emptyResult, 'empty.json', options);
      }).not.toThrow();
      
      expect(() => {
        jsonOutput.display(emptyResult, 'empty.json', options);
      }).not.toThrow();
    });

    it('should handle missing version info', () => {
      const noVersionResult: ValidationResult = {
        success: true,
        score: 90,
        errors: [],
        warnings: [],
        suggestions: [],
        validations: []
      };

      const options: CLIOptions = {};
      
      expect(() => {
        consoleOutput.display(noVersionResult, 'no-version.json', options);
      }).not.toThrow();
      
      const output = consoleLogs.join('\n');
      expect(output).toContain('Score: 90/100');
    });

    it('should handle long agent paths', () => {
      const longPath = 'very/long/path/to/agent/card/file/that/might/be/truncated/agent-card.json';
      const options: CLIOptions = {};
      
      consoleOutput.display(successResult, longPath, options);
      
      const output = consoleLogs.join('\n');
      expect(output).toContain(`Agent: ${longPath}`);
    });
  });
});