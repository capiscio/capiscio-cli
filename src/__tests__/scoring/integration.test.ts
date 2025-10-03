/**
 * Integration tests for the scoring system
 */

import { describe, it, expect } from 'vitest';
import { calculateScores, createScoringContext } from '../../scoring/index.js';
import type { AgentCard } from '../../types/index.js';

describe('Scoring System Integration', () => {
  const perfectAgentCard: AgentCard = {
    protocolVersion: '0.3.0',
    name: 'Perfect Agent',
    description: 'A fully compliant agent',
    url: 'https://example.com/agent',
    version: '1.0.0',
    capabilities: {
      streaming: true,
      pushNotifications: false,
    },
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain', 'application/json'],
    skills: [
      {
        id: 'skill-1',
        name: 'Test Skill',
        description: 'A test skill',
        tags: ['test', 'demo'],
      },
    ],
    provider: {
      organization: 'Test Org',
      url: 'https://test.org',
    },
    securitySchemes: {
      oauth2: {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://auth.example.com/authorize',
            tokenUrl: 'https://auth.example.com/token',
            scopes: { read: 'Read access' },
          },
        },
      },
    },
    documentationUrl: 'https://docs.example.com',
  };

  it('should calculate perfect compliance score (100/100)', () => {
    const context = createScoringContext({ schemaOnly: true });
    const result = calculateScores(
      {
        agentCard: perfectAgentCard,
        validationErrors: [],
      },
      context
    );

    expect(result.compliance.total).toBe(100);
    expect(result.compliance.rating).toBe('Perfect');
    expect(result.compliance.issues).toHaveLength(0);
  });

  it('should apply trust confidence multiplier without signatures', () => {
    const context = createScoringContext({ schemaOnly: true });
    const result = calculateScores(
      {
        agentCard: perfectAgentCard,
        validationErrors: [],
      },
      context
    );

    // Without signatures, confidence multiplier should be 0.6
    expect(result.trust.confidenceMultiplier).toBe(0.6);
    // Raw score should be decent (provider + security + docs)
    expect(result.trust.rawScore).toBeGreaterThanOrEqual(40);
    // But final score should be reduced by multiplier
    expect(result.trust.total).toBeLessThan(result.trust.rawScore);
    expect(result.trust.issues).toContain(
      'Trust confidence reduced (0.6x) - no cryptographic verification'
    );
  });

  it('should handle missing required fields', () => {
    const incompleteCard: any = {
      name: 'Incomplete Agent',
      version: '1.0.0',
      // Missing many required fields
    };

    const context = createScoringContext({ schemaOnly: true });
    const result = calculateScores(
      {
        agentCard: incompleteCard,
        validationErrors: [],
      },
      context
    );

    expect(result.compliance.total).toBeLessThan(50);
    expect(result.compliance.issues.length).toBeGreaterThan(0);
    expect(result.compliance.issues[0]).toContain('Missing required fields');
  });

  it('should not test availability in schema-only mode', () => {
    const context = createScoringContext({ schemaOnly: true });
    const result = calculateScores(
      {
        agentCard: perfectAgentCard,
        validationErrors: [],
      },
      context
    );

    expect(result.availability.tested).toBe(false);
    expect(result.availability.total).toBeNull();
    expect(result.availability.rating).toBeNull();
    expect(result.availability.notTestedReason).toContain('Schema-only validation');
  });

  it('should calculate legacy score for backward compatibility', () => {
    const context = createScoringContext({ schemaOnly: true });
    const result = calculateScores(
      {
        agentCard: perfectAgentCard,
        validationErrors: [],
      },
      context
    );

    // Verify all three scores are present
    expect(result.compliance).toBeDefined();
    expect(result.trust).toBeDefined();
    expect(result.availability).toBeDefined();
    expect(result.recommendation).toBeDefined();
  });

  it('should generate appropriate recommendations', () => {
    const context = createScoringContext({ schemaOnly: true });
    const result = calculateScores(
      {
        agentCard: perfectAgentCard,
        validationErrors: [],
      },
      context
    );

    // Should mention compliance (either "Fully compliant" or "Excellent")
    expect(
      result.recommendation.includes('Fully A2A v0.3.0 compliant') ||
        result.recommendation.includes('Excellent A2A compliance')
    ).toBe(true);
    expect(result.recommendation).toContain('signatures');
  });

  it('should penalize invalid MIME types', () => {
    const badCard: AgentCard = {
      ...perfectAgentCard,
      defaultInputModes: ['invalid-mime-type'],
    };

    const context = createScoringContext({ schemaOnly: true });
    const result = calculateScores(
      {
        agentCard: badCard,
        validationErrors: [],
      },
      context
    );

    expect(result.compliance.total).toBeLessThan(100);
    expect(result.compliance.breakdown.formatCompliance.details.validMimeTypes).toBe(
      false
    );
  });

  it('should penalize missing skill tags', () => {
    const noTagsCard: AgentCard = {
      ...perfectAgentCard,
      skills: [
        {
          id: 'skill-1',
          name: 'Test Skill',
          description: 'A test skill',
          tags: [], // Empty tags
        },
      ],
    };

    const context = createScoringContext({ schemaOnly: true });
    const result = calculateScores(
      {
        agentCard: noTagsCard,
        validationErrors: [],
      },
      context
    );

    expect(result.compliance.breakdown.skillsQuality.details.allSkillsHaveTags).toBe(
      false
    );
    expect(result.compliance.total).toBeLessThan(100);
  });

  it('should penalize HTTP URLs in security score', () => {
    const httpCard: AgentCard = {
      ...perfectAgentCard,
      url: 'http://insecure.example.com',
    };

    const context = createScoringContext({ schemaOnly: true });
    const result = calculateScores(
      {
        agentCard: httpCard,
        validationErrors: [],
      },
      context
    );

    expect(result.trust.breakdown.security.details.httpsOnly).toBe(false);
    expect(result.trust.breakdown.security.details.hasHttpUrls).toBe(true);
  });
});
