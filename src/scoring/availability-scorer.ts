/**
 * Availability Scorer - Measures operational readiness
 * 
 * Weighting:
 * - Primary Endpoint: 50 points (response, timing, TLS, CORS)
 * - Transport Support: 30 points (declared protocols work)
 * - Response Quality: 20 points (valid structure, headers, error handling)
 * 
 * Only calculated when --test-live is used (not --schema-only)
 * 
 * Total: 100 points
 */

import { AgentCard } from '../types/index.js';
import {
  AvailabilityScore,
  AvailabilityBreakdown,
  getAvailabilityRating,
  ScoringContext,
} from './types.js';

/**
 * Live testing result from LiveTester
 */
export interface LiveTestResult {
  success: boolean;
  responseTime?: number;
  errors: string[];
  response?: any;
  hasCors?: boolean;
  validTls?: boolean;
  transportTested?: string;
  protocolValid?: boolean;
}

/**
 * Calculate availability score for an agent card
 */
export function calculateAvailabilityScore(
  agentCard: AgentCard,
  context: ScoringContext,
  liveTestResult?: LiveTestResult
): AvailabilityScore {
  // If live testing wasn't performed, return null score
  if (!context.testLive || !liveTestResult) {
    return {
      total: null,
      rating: null,
      breakdown: null,
      issues: [],
      tested: false,
      notTestedReason: context.schemaOnly
        ? 'Schema-only validation (use --test-live to test availability)'
        : 'Live testing not performed',
    };
  }

  const breakdown: AvailabilityBreakdown = {
    primaryEndpoint: evaluatePrimaryEndpoint(liveTestResult),
    transportSupport: evaluateTransportSupport(agentCard, liveTestResult),
    responseQuality: evaluateResponseQuality(liveTestResult),
  };

  const total =
    breakdown.primaryEndpoint.score +
    breakdown.transportSupport.score +
    breakdown.responseQuality.score;

  const issues = collectIssues(breakdown, liveTestResult);

  return {
    total: Math.round(total * 100) / 100,
    rating: getAvailabilityRating(total),
    breakdown,
    issues,
    tested: true,
  };
}

/**
 * Evaluate primary endpoint (50 points max)
 */
function evaluatePrimaryEndpoint(
  liveTestResult: LiveTestResult
): AvailabilityBreakdown['primaryEndpoint'] {
  let score = 0;
  const errors: string[] = [];

  // Endpoint responds (30 points)
  const responds = liveTestResult.success;
  if (responds) {
    score += 30;
  } else {
    errors.push(...liveTestResult.errors);
  }

  // Response time < 3 seconds (10 points)
  const responseTime = liveTestResult.responseTime;
  if (responseTime !== undefined && responseTime < 3000) {
    score += 10;
  } else if (responseTime !== undefined && responseTime >= 3000 && responseTime < 10000) {
    // Partial credit for slow but working responses
    score += 5;
  }

  // Proper CORS headers (5 points)
  const hasCors = liveTestResult.hasCors || false;
  if (hasCors) {
    score += 5;
  }

  // Valid TLS certificate (5 points)
  const validTls = liveTestResult.validTls !== false; // Assume valid if not explicitly false
  if (validTls) {
    score += 5;
  }

  const details: AvailabilityBreakdown['primaryEndpoint']['details'] = {
    responds,
    validTls,
  };

  if (responseTime !== undefined) {
    details.responseTime = responseTime;
  }

  if (hasCors) {
    details.hasCors = hasCors;
  }

  if (errors.length > 0) {
    details.errors = errors;
  }

  return {
    score,
    maxScore: 50,
    details,
  };
}

/**
 * Evaluate transport protocol support (30 points max)
 */
function evaluateTransportSupport(
  agentCard: AgentCard,
  liveTestResult: LiveTestResult
): AvailabilityBreakdown['transportSupport'] {
  let score = 0;

  // Preferred transport works (20 points)
  const preferredTransportWorks = liveTestResult.success;
  if (preferredTransportWorks) {
    score += 20;
  }

  // Additional interfaces (up to 10 points)
  const additionalInterfaces = agentCard.additionalInterfaces || [];
  const additionalInterfacesWorking = 0; // Would need to test each interface
  const additionalInterfacesFailed = 0;

  // Give credit if no additional interfaces declared (they're optional)
  if (additionalInterfaces.length === 0) {
    score += 10; // No additional interfaces to fail
  } else {
    // In a real implementation, we'd test each additional interface
    // For now, give partial credit
    score += 5;
  }

  return {
    score,
    maxScore: 30,
    details: {
      preferredTransportWorks,
      additionalInterfacesWorking,
      additionalInterfacesFailed,
    },
  };
}

/**
 * Evaluate response quality (20 points max)
 */
function evaluateResponseQuality(
  liveTestResult: LiveTestResult
): AvailabilityBreakdown['responseQuality'] {
  let score = 0;

  if (!liveTestResult.success) {
    // Can't evaluate quality if endpoint didn't respond
    return {
      score: 0,
      maxScore: 20,
      details: {
        validStructure: false,
        properContentType: false,
        properErrorHandling: false,
      },
    };
  }

  // Valid protocol structure (10 points)
  const validStructure = liveTestResult.protocolValid !== false;
  if (validStructure) {
    score += 10;
  }

  // Proper content-type headers (5 points)
  // In a real implementation, we'd check the actual headers
  const properContentType = true; // Assume true for now
  if (properContentType) {
    score += 5;
  }

  // Proper error handling (5 points)
  // In a real implementation, we'd test error scenarios
  const properErrorHandling = liveTestResult.errors.length === 0;
  if (properErrorHandling) {
    score += 5;
  }

  return {
    score,
    maxScore: 20,
    details: {
      validStructure,
      properContentType,
      properErrorHandling,
    },
  };
}

/**
 * Collect all issues from breakdown
 */
function collectIssues(
  breakdown: AvailabilityBreakdown,
  _liveTestResult: LiveTestResult
): string[] {
  const issues: string[] = [];

  // Primary endpoint issues
  if (!breakdown.primaryEndpoint.details.responds) {
    issues.push('Primary endpoint not responding');
    if (breakdown.primaryEndpoint.details.errors) {
      issues.push(...breakdown.primaryEndpoint.details.errors);
    }
  } else {
    // Only check these if endpoint is responding
    const responseTime = breakdown.primaryEndpoint.details.responseTime;
    if (responseTime !== undefined) {
      if (responseTime >= 10000) {
        issues.push(`Slow response time: ${responseTime}ms (timeout)`);
      } else if (responseTime >= 3000) {
        issues.push(`Slow response time: ${responseTime}ms`);
      }
    }

    if (!breakdown.primaryEndpoint.details.hasCors) {
      issues.push('Missing CORS headers - may not work in browsers');
    }

    if (!breakdown.primaryEndpoint.details.validTls) {
      issues.push('Invalid or expired TLS certificate');
    }
  }

  // Transport support issues
  if (!breakdown.transportSupport.details.preferredTransportWorks) {
    issues.push('Preferred transport protocol not working');
  }

  if (breakdown.transportSupport.details.additionalInterfacesFailed > 0) {
    issues.push(
      `${breakdown.transportSupport.details.additionalInterfacesFailed} additional interface(s) not working`
    );
  }

  // Response quality issues
  if (!breakdown.responseQuality.details.validStructure) {
    issues.push('Response does not follow A2A protocol structure');
  }

  if (!breakdown.responseQuality.details.properContentType) {
    issues.push('Incorrect content-type headers');
  }

  if (!breakdown.responseQuality.details.properErrorHandling) {
    issues.push('Protocol errors detected in response');
  }

  return issues;
}
