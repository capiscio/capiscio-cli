import { describe, it, expect, beforeEach, vi } from 'vitest';
import { A2AValidator } from '../validator/a2a-validator';
import { FetchHttpClient } from '../validator/http-client';
import type { AgentCard, ValidationOptions, HttpClient, HttpResponse } from '../types';

// Mock fetch for HTTP client tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('A2AValidator - Comprehensive Tests', () => {
  let validator: A2AValidator;
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock HTTP client
    mockHttpClient = {
      get: vi.fn()
    };
    
    validator = new A2AValidator(mockHttpClient);
  });

  const validAgentCard: AgentCard = {
    protocolVersion: '0.3.0',
    name: 'Test Agent',
    description: 'A comprehensive test agent for validation',
    url: 'https://example.com/agent',
    preferredTransport: 'HTTP+JSON',
    provider: {
      organization: 'Test Corp'
    },
    version: '1.0.0',
    capabilities: {
      streaming: true,
      pushNotifications: false
    },
    skills: [
      {
        id: 'test-skill',
        name: 'Test Skill',
        description: 'A test skill',
        examples: ['Example 1', 'Example 2']
      }
    ]
  };

  describe('Constructor and Instance Creation', () => {
    it('should create an instance with default HTTP client', () => {
      const defaultValidator = new A2AValidator();
      expect(defaultValidator).toBeDefined();
      expect(defaultValidator).toBeInstanceOf(A2AValidator);
    });

    it('should create an instance with custom HTTP client', () => {
      expect(validator).toBeDefined();
      expect(validator).toBeInstanceOf(A2AValidator);
    });
  });

  describe('Schema Validation', () => {
    it('should validate a complete valid agent card', async () => {
      const result = await validator.validate(validAgentCard, { skipDynamic: true, skipSignatureVerification: true });

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.score).toBe(100);
      expect(result.validations).toBeDefined();
      expect(result.validations.length).toBeGreaterThan(0);
      expect(result.validations.some(v => v.id === 'schema_validation')).toBe(true);
      expect(result.versionInfo?.detectedVersion).toBe('0.3.0');
    });

    it('should fail for missing required fields', async () => {
      const incompleteCard = {
        name: 'Incomplete Agent',
        description: 'Missing required fields'
      };

      const result = await validator.validate(incompleteCard as any, { skipDynamic: true });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(100);
      
      const errorFields = result.errors.map(e => e.field);
      expect(errorFields).toContain('protocolVersion');
      expect(errorFields).toContain('preferredTransport');
      expect(errorFields).toContain('url');
      expect(errorFields).toContain('provider'); // provider object missing entirely
      expect(errorFields).toContain('version');
    });

    it('should validate transport protocols', async () => {
      const invalidTransport = {
        ...validAgentCard,
        preferredTransport: 'INVALID_TRANSPORT' as any
      };

      const result = await validator.validate(invalidTransport, { skipDynamic: true });

      expect(result.success).toBe(false);
      expect(result.errors.some(e => 
        e.field === 'preferredTransport' ||
        e.message.includes('preferredTransport')
      )).toBe(true);
    });

    it('should validate URL formats', async () => {
      const invalidUrlCard = {
        ...validAgentCard,
        url: 'not-a-valid-url'
      };

      const result = await validator.validate(invalidUrlCard, { skipDynamic: true });

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'url')).toBe(true);
    });

    it('should validate version format (semver)', async () => {
      const invalidVersionCard = {
        ...validAgentCard,
        version: 'not-semver'
      };

      const result = await validator.validate(invalidVersionCard, { skipDynamic: true });

      expect(result.success).toBe(false);
      expect(result.errors.some(e => 
        e.field === 'version' && 
        e.message.includes('semver')
      )).toBe(true);
    });

    it('should validate protocol version format', async () => {
      const invalidProtocolVersion = {
        ...validAgentCard,
        protocolVersion: 'invalid-version'
      };

      const result = await validator.validate(invalidProtocolVersion, { skipDynamic: true });

      expect(result.success).toBe(false);
      expect(result.errors.some(e => 
        e.field === 'protocolVersion'
      )).toBe(true);
    });

    it('should validate optional fields when present', async () => {
      const extendedCard = {
        ...validAgentCard,
        iconUrl: 'https://example.com/icon.png',
        documentationUrl: 'https://docs.example.com',
        additionalInterfaces: [
          {
            url: 'https://grpc.example.com',
            transport: 'GRPC' as const
          }
        ]
      };

      const result = await validator.validate(extendedCard, { skipDynamic: true });

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for invalid optional URL fields', async () => {
      const invalidOptionalUrls = {
        ...validAgentCard,
        iconUrl: 'not-a-url',
        documentationUrl: 'also-not-a-url'
      };

      const result = await validator.validate(invalidOptionalUrls, { skipDynamic: true });

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'iconUrl')).toBe(true);
      expect(result.errors.some(e => e.field === 'documentationUrl')).toBe(true);
    });
  });

  describe('Version Compatibility Analysis', () => {
    it('should detect version compatibility issues', async () => {
      const versionMismatchCard = {
        ...validAgentCard,
        protocolVersion: '0.2.0',
        capabilities: {
          streaming: true, // Requires 0.3.0+
          pushNotifications: true // Requires 0.3.0+
        }
      };

      const result = await validator.validate(versionMismatchCard, { skipDynamic: true });

      expect(result.versionInfo?.compatibility?.compatible).toBe(false);
      expect(result.versionInfo?.compatibility?.mismatches?.length).toBeGreaterThan(0);
    });

    it('should suggest migration path for incompatible versions', async () => {
      const oldVersionCard = {
        ...validAgentCard,
        protocolVersion: '0.1.0'
      };

      const result = await validator.validate(oldVersionCard, { skipDynamic: true });

      expect(result.versionInfo?.migrationPath?.length).toBeGreaterThan(0);
    });

    it('should handle missing protocol version', async () => {
      const noVersionCard = {
        ...validAgentCard
      };
      delete (noVersionCard as any).protocolVersion;

      const result = await validator.validate(noVersionCard, { skipDynamic: true });

      expect(result.versionInfo?.detectedVersion).toBe('undefined');
      expect(result.errors.some(e => e.field === 'protocolVersion')).toBe(true);
    });
  });

  describe('Network Validation', () => {
    it('should fetch agent card from URL', async () => {
      const mockResponse: HttpResponse = {
        status: 200,
        data: validAgentCard,
        headers: { 'content-type': 'application/json' }
      };

      (mockHttpClient.get as any).mockResolvedValueOnce(mockResponse);

      const result = await validator.validate('https://example.com/agent.json');

      expect(result.success).toBe(true);
      expect(mockHttpClient.get).toHaveBeenCalledWith('https://example.com/agent.json');
    });

    it('should try well-known endpoint when direct URL fails', async () => {
      const mockError = new Error('Not found');
      const mockResponse: HttpResponse = {
        status: 200,
        data: validAgentCard,
        headers: { 'content-type': 'application/json' }
      };

      (mockHttpClient.get as any)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(mockResponse);

      const result = await validator.validate('https://example.com');

      expect(result.success).toBe(true);
      expect(mockHttpClient.get).toHaveBeenCalledWith('https://example.com/.well-known/agent-card.json');
    });

    it('should try legacy well-known endpoint as fallback', async () => {
      const mockError = new Error('Not found');
      const mockResponse: HttpResponse = {
        status: 200,
        data: validAgentCard,
        headers: { 'content-type': 'application/json' }
      };

      (mockHttpClient.get as any)
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(mockResponse);

      const result = await validator.validate('https://example.com');

      expect(result.success).toBe(true);
      expect(result.warnings.some(w => w.code === 'LEGACY_DISCOVERY_ENDPOINT')).toBe(true);
      expect(mockHttpClient.get).toHaveBeenCalledWith('https://example.com/.well-known/agent.json');
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network Error');
      (mockHttpClient.get as any).mockRejectedValue(networkError);

      const result = await validator.validate('https://invalid.com');

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.message).toContain('Network Error');
    });
  });

  describe('Validation Modes', () => {
    it('should use progressive mode by default', async () => {
      const result = await validator.validateProgressive(validAgentCard);

      expect(result.versionInfo?.strictness).toBe('progressive');
      expect(result.success).toBe(true);
    });

    it('should use strict mode', async () => {
      const result = await validator.validateStrict(validAgentCard);

      expect(result.versionInfo?.strictness).toBe('strict');
    });

    it('should use conservative mode', async () => {
      const result = await validator.validateConservative(validAgentCard);

      expect(result.versionInfo?.strictness).toBe('conservative');
    });

    it('should apply stricter validation in strict mode', async () => {
      const cardWithWarnings = {
        ...validAgentCard,
        additionalInterfaces: [{
          url: 'https://grpc.example.com',
          transport: 'GRPC' as const
        }],
        capabilities: {
          streaming: false // GRPC without streaming should be error in strict mode
        }
      };

      const progressiveResult = await validator.validateProgressive(cardWithWarnings, { skipDynamic: true });
      const strictResult = await validator.validateStrict(cardWithWarnings, { skipDynamic: true });

      expect(progressiveResult.warnings.some(w => w.code === 'GRPC_WITHOUT_STREAMING')).toBe(true);
      expect(strictResult.errors.length).toBeGreaterThan(progressiveResult.errors.length);
    });
  });

  describe('Schema-Only Validation', () => {
    it('should skip network calls in schema-only mode', async () => {
      const result = await validator.validateSchemaOnly(validAgentCard);

      expect(result.success).toBe(true);
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null input', async () => {
      const result = await validator.validate(null as any);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle undefined input', async () => {
      const result = await validator.validate(undefined as any);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty object', async () => {
      const result = await validator.validate({} as any, { skipDynamic: true });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle malformed JSON from URL', async () => {
      const mockResponse: HttpResponse = {
        status: 200,
        data: 'not-json',
        headers: { 'content-type': 'text/plain' }
      };

      (mockHttpClient.get as any).mockResolvedValueOnce(mockResponse);

      const result = await validator.validate('https://example.com/agent.json');

      expect(result.success).toBe(false);
    });

    it('should handle circular references in agent card', async () => {
      const circularCard: any = { ...validAgentCard };
      circularCard.self = circularCard;

      const result = await validator.validate(circularCard, { skipDynamic: true });

      // Should not crash, might succeed or fail gracefully
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Score Calculation', () => {
    it('should calculate score based on errors and warnings', async () => {
      const cardWithIssues = {
        ...validAgentCard,
        url: 'not-a-valid-url',
        version: 'not-semver'
      };

      const result = await validator.validate(cardWithIssues, { skipDynamic: true });

      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(100);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should return perfect score for valid agent card', async () => {
      const result = await validator.validate(validAgentCard, { skipDynamic: true, skipSignatureVerification: true });

      expect(result.score).toBe(100);
    });

    it('should return 0 score for completely invalid card', async () => {
      const result = await validator.validate(null as any);

      expect(result.score).toBe(0);
    });
  });

  describe('Validation Timing', () => {
    it('should include timing information in results', async () => {
      const result = await validator.validate(validAgentCard, { skipDynamic: true });

      expect(result.validations.some(v => v.duration !== undefined)).toBe(true);
    });

    it('should complete validation within reasonable time', async () => {
      const start = Date.now();
      await validator.validate(validAgentCard, { skipDynamic: true });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});