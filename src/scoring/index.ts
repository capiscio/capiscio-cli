/**
 * Scoring Orchestrator - Coordinates all three scoring dimensions
 * 
 * Calculates:
 * 1. Compliance Score - A2A protocol adherence (always calculated)
 * 2. Trust Score - Security and authenticity (with confidence multiplier)
 * 3. Availability Score - Operational readiness (when --test-live used)
 */

import { AgentCard } from '../types/index.js';
import { ScoringResult, ScoringContext } from './types.js';
import { calculateComplianceScore } from './compliance-scorer.js';
import { calculateTrustScore } from './trust-scorer.js';
import {
  calculateAvailabilityScore,
  type LiveTestResult,
} from './availability-scorer.js';

// Re-export types for convenience
export * from './types.js';
export type { LiveTestResult } from './availability-scorer.js';

/**
 * Input data for scoring calculation
 */
export interface ScoringInput {
  agentCard: AgentCard;
  validationErrors: string[];
  signatureVerificationResult?: {
    valid: boolean;
    invalid: boolean;
    details?: any;
  };
  liveTestResult?: LiveTestResult;
}

/**
 * Calculate all three scoring dimensions
 */
export function calculateScores(
  input: ScoringInput,
  context: ScoringContext
): ScoringResult {
  // Calculate compliance score (always calculated)
  const compliance = calculateComplianceScore(
    input.agentCard,
    input.validationErrors
  );

  // Calculate trust score (always calculated, but may have partial validation)
  const trust = calculateTrustScore(
    input.agentCard,
    context,
    input.signatureVerificationResult
  );

  // Calculate availability score (only if live testing was performed)
  const availability = calculateAvailabilityScore(
    input.agentCard,
    context,
    input.liveTestResult
  );

  // Generate overall recommendation
  const recommendation = generateRecommendation(compliance, trust, availability);

  // Calculate legacy score for backward compatibility
  const legacyScore = calculateLegacyScore(compliance, trust, availability);

  return {
    compliance,
    trust,
    availability,
    recommendation,
    legacyScore,
  };
}

/**
 * Generate overall recommendation based on all scores
 */
function generateRecommendation(
  compliance: ScoringResult['compliance'],
  trust: ScoringResult['trust'],
  availability: ScoringResult['availability']
): string {
  const recommendations: string[] = [];

  // Compliance recommendations
  if (compliance.total === 100) {
    recommendations.push('✅ Fully A2A v0.3.0 compliant');
  } else if (compliance.total >= 90) {
    recommendations.push('✅ Excellent A2A compliance');
  } else if (compliance.total >= 75) {
    recommendations.push('⚠️ Good compliance with minor issues');
  } else if (compliance.total >= 60) {
    recommendations.push('⚠️ Fair compliance - improvements recommended');
  } else {
    recommendations.push('❌ Poor compliance - significant improvements needed');
  }

  // Trust recommendations (considering confidence multiplier)
  if (trust.confidenceMultiplier < 1.0) {
    if (trust.confidenceMultiplier === 0.4) {
      recommendations.push(
        '🚨 Invalid signatures detected - do not use in production'
      );
    } else if (trust.confidenceMultiplier === 0.6) {
      recommendations.push(
        '⚠️ No cryptographic signatures - consider adding JWS signatures to improve trust'
      );
    }
  } else if (trust.total >= 80) {
    recommendations.push('✅ Highly trusted with strong security signals');
  } else if (trust.total >= 60) {
    recommendations.push('✅ Trusted with good security configuration');
  } else if (trust.total >= 40) {
    recommendations.push('⚠️ Moderate trust - consider improving security');
  } else {
    recommendations.push('⚠️ Low trust - security improvements strongly recommended');
  }

  // Availability recommendations
  if (availability.tested && availability.total !== null) {
    if (availability.total >= 95) {
      recommendations.push('✅ Fully operational and performant');
    } else if (availability.total >= 80) {
      recommendations.push('✅ Operational with minor issues');
    } else if (availability.total >= 60) {
      recommendations.push('⚠️ Degraded performance or reliability issues');
    } else if (availability.total >= 40) {
      recommendations.push('⚠️ Unstable - significant operational issues');
    } else {
      recommendations.push('❌ Unavailable or severely degraded');
    }
  }

  // Overall production readiness
  const isProductionReady =
    compliance.total >= 95 &&
    trust.total >= 60 &&
    trust.confidenceMultiplier >= 0.6 &&
    (!availability.tested || (availability.total !== null && availability.total >= 80));

  if (isProductionReady) {
    recommendations.push('🎉 Production ready!');
  } else {
    const blockers: string[] = [];
    if (compliance.total < 95) blockers.push('compliance');
    if (trust.total < 60 || trust.confidenceMultiplier < 0.6) blockers.push('trust');
    if (availability.tested && availability.total !== null && availability.total < 80) {
      blockers.push('availability');
    }
    recommendations.push(
      `⚠️ Not yet production ready - improve: ${blockers.join(', ')}`
    );
  }

  return recommendations.join('\n');
}

/**
 * Calculate legacy single score for backward compatibility
 * 
 * This uses a weighted average:
 * - Compliance: 50% weight (most important for interoperability)
 * - Trust: 30% weight
 * - Availability: 20% weight (if tested, otherwise redistribute)
 */
function calculateLegacyScore(
  compliance: ScoringResult['compliance'],
  trust: ScoringResult['trust'],
  availability: ScoringResult['availability']
): number {
  let totalWeight = 0;
  let weightedSum = 0;

  // Compliance (50% weight)
  weightedSum += compliance.total * 0.5;
  totalWeight += 0.5;

  // Trust (30% weight)
  weightedSum += trust.total * 0.3;
  totalWeight += 0.3;

  // Availability (20% weight if tested, otherwise redistribute to compliance)
  if (availability.tested && availability.total !== null) {
    weightedSum += availability.total * 0.2;
    totalWeight += 0.2;
  } else {
    // Redistribute availability weight to compliance
    weightedSum += compliance.total * 0.2;
    totalWeight += 0.2;
  }

  const legacyScore = weightedSum / totalWeight;
  return Math.round(legacyScore * 100) / 100;
}

/**
 * Helper: Create scoring context from CLI options
 */
export function createScoringContext(options: {
  schemaOnly?: boolean;
  skipSignatureVerification?: boolean;
  testLive?: boolean;
  strictMode?: boolean;
}): ScoringContext {
  return {
    schemaOnly: options.schemaOnly || false,
    skipSignatureVerification: options.skipSignatureVerification || false,
    testLive: options.testLive || false,
    strictMode: options.strictMode || false,
  };
}

/**
 * Helper: Get production readiness threshold
 */
export function getProductionReadinessThreshold() {
  return {
    compliance: 95,
    trust: 60,
    trustConfidence: 0.6,
    availability: 80,
  };
}

/**
 * Helper: Check if agent meets production readiness criteria
 */
export function isProductionReady(result: ScoringResult): boolean {
  const threshold = getProductionReadinessThreshold();

  const complianceReady = result.compliance.total >= threshold.compliance;
  const trustReady =
    result.trust.total >= threshold.trust &&
    result.trust.confidenceMultiplier >= threshold.trustConfidence;
  const availabilityReady =
    !result.availability.tested ||
    (result.availability.total !== null &&
      result.availability.total >= threshold.availability);

  return complianceReady && trustReady && availabilityReady;
}
