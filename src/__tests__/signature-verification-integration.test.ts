import { describe, it, expect, beforeEach, vi } from 'vitest';
import { A2AValidator } from '../validator/a2a-validator';
import type { AgentCard, HttpClient } from '../types';

describe('Signature Verification Integration', () => {
  let validator: A2AValidator;
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    // Create mock HTTP client
    mockHttpClient = {
      get: vi.fn()
    };
    
    validator = new A2AValidator(mockHttpClient);
  });

  const createTestAgentCard = (signatures?: any[]): AgentCard => ({
    protocolVersion: '0.3.0',
    name: 'Test Agent',
    description: 'A test agent for signature verification',
    url: 'https://example.com/agent',
    preferredTransport: 'HTTP+JSON',
    provider: {
      organization: 'Test Corp',
      url: 'https://testcorp.com'
    },
    version: '1.0.0',
    capabilities: {
      streaming: false,
      pushNotifications: false
    },
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain'],
    skills: [
      {
        id: 'test-skill',
        name: 'Test Skill',
        description: 'A test skill',
        tags: ['test']
      }
    ],
    ...(signatures && { signatures })
  });

  describe('Signature Verification in Validation Pipeline', () => {
    it('should include signature verification check by default', async () => {
      const agentCard = createTestAgentCard();
      
      const result = await validator.validate(agentCard, { skipDynamic: true });

      // Should always include signature verification check
      expect(result.validations).toBeDefined();
      const sigCheck = result.validations.find(v => v.id === 'signature_verification');
      expect(sigCheck).toBeDefined();
      expect(sigCheck?.name).toBe('JWS Signature Verification');
    });

    it('should skip signature verification when no signatures present', async () => {
      const agentCard = createTestAgentCard();
      
      const result = await validator.validate(agentCard, { skipDynamic: true });

      const sigCheck = result.validations.find(v => v.id === 'signature_verification');
      expect(sigCheck?.status).toBe('skipped');
      expect(sigCheck?.message).toBe('No signatures found to verify');
      
      // Should include warning about missing signatures
      expect(result.warnings.some(w => w.code === 'NO_SIGNATURES_FOUND')).toBe(true);
    });

    it('should skip signature verification when explicitly disabled', async () => {
      const agentCard = createTestAgentCard([{ signature: 'test.signature' }]);
      
      const result = await validator.validate(agentCard, { 
        skipDynamic: true, 
        skipSignatureVerification: true 
      });

      const sigCheck = result.validations.find(v => v.id === 'signature_verification');
      expect(sigCheck?.status).toBe('skipped');
      expect(sigCheck?.message).toBe('Signature verification was explicitly skipped');
      
      // Should include warning about skipped verification
      expect(result.warnings.some(w => w.code === 'SIGNATURE_VERIFICATION_SKIPPED')).toBe(true);
    });

    it('should attempt verification when signatures are present', async () => {
      const agentCard = createTestAgentCard([
        { signature: 'invalid.test.signature' }
      ]);
      
      const result = await validator.validate(agentCard, { skipDynamic: true });

      const sigCheck = result.validations.find(v => v.id === 'signature_verification');
      expect(sigCheck?.status).toBe('failed'); // Should fail due to invalid signature
      expect(sigCheck?.message).toContain('0 of 1 signatures verified');
      
      // Should include specific signature verification errors
      expect(result.errors.some(e => e.code === 'SIGNATURE_VERIFICATION_FAILED')).toBe(true);
    });

    it('should not affect other validations when signature verification fails', async () => {
      const agentCard = createTestAgentCard([
        { signature: 'invalid.signature' }
      ]);
      
      const result = await validator.validate(agentCard, { skipDynamic: true });

      // Schema validation should still pass
      const schemaCheck = result.validations.find(v => v.id === 'schema_validation');
      expect(schemaCheck?.status).toBe('passed');
      
      // Version features should still pass
      const versionCheck = result.validations.find(v => v.id === 'v030_features');
      expect(versionCheck?.status).toBe('passed');
      
      // Only signature verification should fail
      const sigCheck = result.validations.find(v => v.id === 'signature_verification');
      expect(sigCheck?.status).toBe('failed');
    });

    it('should include signature verification timing information', async () => {
      const agentCard = createTestAgentCard();
      
      const result = await validator.validate(agentCard, { skipDynamic: true });

      const sigCheck = result.validations.find(v => v.id === 'signature_verification');
      expect(sigCheck?.duration).toBeDefined();
      expect(typeof sigCheck?.duration).toBe('number');
      expect(sigCheck?.duration).toBeGreaterThanOrEqual(0);
    });

    it('should affect validation score when signatures missing', async () => {
      const agentCardWithoutSigs = createTestAgentCard();
      const agentCardSkippingAllChecks = createTestAgentCard();
      
      const resultWithoutSigs = await validator.validate(agentCardWithoutSigs, { 
        skipDynamic: true 
      });
      
      const resultSkippingAllChecks = await validator.validate(agentCardSkippingAllChecks, { 
        skipDynamic: true, 
        skipSignatureVerification: true 
      });

      // Missing signatures should result in warnings that affect the score
      expect(resultWithoutSigs.score).toBeLessThan(100);
      expect(resultWithoutSigs.warnings.some(w => w.code === 'NO_SIGNATURES_FOUND')).toBe(true);
      
      // Skipping verification should have no signature-related warnings
      expect(resultSkippingAllChecks.warnings.some(w => w.code === 'NO_SIGNATURES_FOUND')).toBe(false);
      expect(resultSkippingAllChecks.warnings.some(w => w.code === 'SIGNATURE_VERIFICATION_SKIPPED')).toBe(false);
    });
  });

  describe('Security Warnings and Messages', () => {
    it('should provide helpful warning when no signatures present', async () => {
      const agentCard = createTestAgentCard();
      
      const result = await validator.validate(agentCard, { skipDynamic: true });

      const warning = result.warnings.find(w => w.code === 'NO_SIGNATURES_FOUND');
      expect(warning).toBeDefined();
      expect(warning?.message).toContain('Consider adding signatures to improve trust');
      expect(warning?.severity).toBe('warning');
      expect(warning?.fixable).toBe(true);
    });

    it('should warn when signature verification is skipped', async () => {
      const agentCard = createTestAgentCard([{ signature: 'test.sig' }]);
      
      const result = await validator.validate(agentCard, { 
        skipDynamic: true, 
        skipSignatureVerification: true 
      });

      const warning = result.warnings.find(w => w.code === 'SIGNATURE_VERIFICATION_SKIPPED');
      expect(warning).toBeDefined();
      expect(warning?.message).toContain('reduces trust verification');
      expect(warning?.severity).toBe('warning');
    });

    it('should provide specific error details for failed signatures', async () => {
      const agentCard = createTestAgentCard([
        { signature: 'malformed.signature.here' }
      ]);
      
      const result = await validator.validate(agentCard, { skipDynamic: true });

      const error = result.errors.find(e => e.code === 'SIGNATURE_VERIFICATION_FAILED');
      expect(error).toBeDefined();
      expect(error?.message).toContain('Signature 1 verification failed');
      expect(error?.field).toBe('signatures[0]');
      expect(error?.severity).toBe('error');
    });
  });
});