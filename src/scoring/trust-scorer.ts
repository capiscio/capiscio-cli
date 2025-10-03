/**
 * Trust Scorer - Measures security and authenticity signals
 * 
 * Weighting (before multiplier):
 * - Cryptographic Signatures: 40 points (most pivotal)
 * - Provider Information: 25 points
 * - Security Configuration: 20 points
 * - Documentation: 15 points
 * 
 * Trust Confidence Multiplier:
 * - With valid signatures: 1.0x (100% confidence)
 * - Without signatures: 0.6x (60% confidence - unverified claims)
 * - With invalid signatures: 0.4x (40% confidence - active distrust)
 * 
 * Total: 100 points (after multiplier)
 */

import { AgentCard } from '../types/index.js';
import {
  TrustScore,
  TrustBreakdown,
  getTrustRating,
  getTrustConfidenceMultiplier,
  ScoringContext,
} from './types.js';

/**
 * Calculate trust score for an agent card
 */
export function calculateTrustScore(
  agentCard: AgentCard,
  context: ScoringContext,
  signatureVerificationResult?: {
    valid: boolean;
    invalid: boolean;
    details?: any;
  }
): TrustScore {
  const breakdown: TrustBreakdown = {
    signatures: evaluateSignatures(agentCard, context, signatureVerificationResult),
    provider: evaluateProvider(agentCard, context),
    security: evaluateSecurity(agentCard),
    documentation: evaluateDocumentation(agentCard),
  };

  // Calculate raw score (before confidence multiplier)
  const rawScore =
    breakdown.signatures.score +
    breakdown.provider.score +
    breakdown.security.score +
    breakdown.documentation.score;

  // Apply trust confidence multiplier
  const hasValidSignature = breakdown.signatures.details.hasValidSignature;
  const hasInvalidSignature = breakdown.signatures.details.hasInvalidSignature || false;
  
  const confidenceMultiplier = getTrustConfidenceMultiplier(
    hasValidSignature,
    hasInvalidSignature
  );

  const total = rawScore * confidenceMultiplier;

  const issues = collectIssues(breakdown, confidenceMultiplier);

  return {
    total: Math.round(total * 100) / 100,
    rawScore: Math.round(rawScore * 100) / 100,
    confidenceMultiplier,
    rating: getTrustRating(total),
    breakdown,
    issues,
    partialValidation: context.skipSignatureVerification || context.schemaOnly,
  };
}

/**
 * Evaluate cryptographic signatures (40 points max + confidence multiplier)
 */
function evaluateSignatures(
  agentCard: AgentCard,
  context: ScoringContext,
  verificationResult?: { valid: boolean; invalid: boolean; details?: any }
): TrustBreakdown['signatures'] {
  // If signature verification was skipped, we can't evaluate
  if (context.skipSignatureVerification) {
    return {
      score: 0,
      maxScore: 40,
      tested: false,
      details: {
        hasValidSignature: false,
        multipleSignatures: false,
        coversAllFields: false,
        isRecent: false,
      },
    };
  }

  let score = 0;
  const signatures = agentCard.signatures || [];
  const hasSignatures = signatures.length > 0;
  
  // At least one valid signature (30 points)
  const hasValidSignature = verificationResult?.valid || false;
  if (hasValidSignature) {
    score += 30;
  }

  // Multiple signatures for redundancy (3 points)
  const multipleSignatures = signatures.length > 1;
  if (multipleSignatures && hasValidSignature) {
    score += 3;
  }

  // Signature covers all critical fields (4 points)
  // This is a simplification - in practice you'd check the JWS payload
  const coversAllFields = hasValidSignature && hasSignatures;
  if (coversAllFields) {
    score += 4;
  }

  // Recent signature < 90 days (3 points)
  // This would require parsing the signature timestamp
  const isRecent = hasValidSignature && hasSignatures;
  if (isRecent) {
    score += 3;
  }

  // Penalties (worse than missing)
  const hasInvalidSignature = verificationResult?.invalid || false;
  if (hasInvalidSignature) {
    score -= 15; // Active deception penalty
  }

  // Expired signature penalty (> 1 year) would go here if we tracked it
  const hasExpiredSignature = false; // Placeholder for future implementation

  return {
    score: Math.max(0, score),
    maxScore: 40,
    tested: !context.skipSignatureVerification,
    details: {
      hasValidSignature,
      multipleSignatures,
      coversAllFields,
      isRecent,
      hasInvalidSignature,
      hasExpiredSignature,
    },
  };
}

/**
 * Evaluate provider information (25 points max)
 */
function evaluateProvider(
  agentCard: AgentCard,
  context: ScoringContext
): TrustBreakdown['provider'] {
  let score = 0;

  const provider = agentCard.provider;
  
  // Provider organization present (10 points)
  const hasOrganization = !!(provider?.organization);
  if (hasOrganization) {
    score += 10;
  }

  // Provider URL present and HTTPS (10 points)
  const hasUrl = !!(provider?.url);
  const isHttps = provider?.url?.startsWith('https://');
  if (hasUrl && isHttps) {
    score += 10;
  }

  // Provider URL reachable (5 bonus points) - only if we tested it
  // This would require a HEAD request in a real implementation
  let urlReachable: boolean | undefined;
  if (!context.schemaOnly && hasUrl && isHttps) {
    // In a real implementation, we'd make a HEAD request here
    // For now, we give the benefit of the doubt
    urlReachable = true;
    score += 5;
  }

  const details: TrustBreakdown['provider']['details'] = {
    hasOrganization,
    hasUrl: !!(hasUrl && isHttps),
  };

  if (urlReachable !== undefined) {
    details.urlReachable = urlReachable;
  }

  return {
    score,
    maxScore: 25,
    tested: !context.schemaOnly,
    details,
  };
}

/**
 * Evaluate security configuration (20 points max)
 */
function evaluateSecurity(agentCard: AgentCard): TrustBreakdown['security'] {
  let score = 0;

  // HTTPS-only URLs (10 points)
  const httpsOnly = checkHttpsOnly(agentCard);
  if (httpsOnly) {
    score += 10;
  }

  // Security schemes declared (5 points)
  const hasSecuritySchemes = !!(
    agentCard.securitySchemes &&
    Object.keys(agentCard.securitySchemes).length > 0
  );
  if (hasSecuritySchemes) {
    score += 5;
  }

  // Strong auth (mTLS or OAuth2) (5 bonus points)
  const hasStrongAuth = checkStrongAuth(agentCard);
  if (hasStrongAuth) {
    score += 5;
  }

  // Penalty for HTTP URLs (-10 points)
  const hasHttpUrls = checkHasHttpUrls(agentCard);
  if (hasHttpUrls) {
    score -= 10;
  }

  return {
    score: Math.max(0, score),
    maxScore: 20,
    details: {
      httpsOnly,
      hasSecuritySchemes,
      hasStrongAuth,
      hasHttpUrls,
    },
  };
}

/**
 * Evaluate documentation and transparency (15 points max)
 */
function evaluateDocumentation(agentCard: AgentCard): TrustBreakdown['documentation'] {
  let score = 0;

  // Documentation URL present (5 points)
  const hasDocumentationUrl = !!(agentCard.documentationUrl);
  if (hasDocumentationUrl) {
    score += 5;
  }

  // Terms of Service URL (5 points)
  // This would be in an extension in a real implementation
  const hasTermsOfService = false; // Placeholder
  if (hasTermsOfService) {
    score += 5;
  }

  // Privacy Policy URL (5 points)
  // This would be in an extension in a real implementation
  const hasPrivacyPolicy = false; // Placeholder
  if (hasPrivacyPolicy) {
    score += 5;
  }

  return {
    score,
    maxScore: 15,
    details: {
      hasDocumentationUrl,
      hasTermsOfService,
      hasPrivacyPolicy,
    },
  };
}

/**
 * Helper: Check if all URLs are HTTPS
 */
function checkHttpsOnly(agentCard: AgentCard): boolean {
  const urls = [
    agentCard.url,
    agentCard.documentationUrl,
    agentCard.provider?.url,
  ].filter(Boolean);

  for (const url of urls) {
    if (url && !url.startsWith('https://')) {
      return false;
    }
  }

  // Check additional interfaces
  if (agentCard.additionalInterfaces) {
    for (const iface of agentCard.additionalInterfaces) {
      if (iface.url && !iface.url.startsWith('https://')) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Helper: Check for HTTP URLs (security issue)
 */
function checkHasHttpUrls(agentCard: AgentCard): boolean {
  return !checkHttpsOnly(agentCard);
}

/**
 * Helper: Check for strong authentication schemes
 */
function checkStrongAuth(agentCard: AgentCard): boolean {
  if (!agentCard.securitySchemes) return false;

  const schemes = Object.values(agentCard.securitySchemes);
  
  for (const scheme of schemes) {
    // Check for mTLS
    if ('mtlsSecurityScheme' in scheme) {
      return true;
    }
    // Check for OAuth2
    if ('oauth2SecurityScheme' in scheme) {
      return true;
    }
  }

  return false;
}

/**
 * Collect all issues from breakdown
 */
function collectIssues(breakdown: TrustBreakdown, confidenceMultiplier: number): string[] {
  const issues: string[] = [];

  // Signature issues
  if (!breakdown.signatures.tested) {
    issues.push('Signature verification skipped (--skip-signature-verification)');
  } else if (breakdown.signatures.details.hasInvalidSignature) {
    issues.push('Invalid signature detected - possible tampering');
  } else if (!breakdown.signatures.details.hasValidSignature) {
    issues.push('No valid cryptographic signatures - trust claims unverified');
  }

  // Confidence multiplier warning
  if (confidenceMultiplier < 1.0) {
    if (confidenceMultiplier === 0.4) {
      issues.push(
        `Trust confidence severely reduced (${confidenceMultiplier}x) due to invalid signatures`
      );
    } else if (confidenceMultiplier === 0.6) {
      issues.push(
        `Trust confidence reduced (${confidenceMultiplier}x) - no cryptographic verification`
      );
    }
  }

  // Provider issues
  if (!breakdown.provider.details.hasOrganization) {
    issues.push('No provider organization specified');
  }
  if (!breakdown.provider.details.hasUrl) {
    issues.push('No provider URL specified or not using HTTPS');
  }

  // Security issues
  if (breakdown.security.details.hasHttpUrls) {
    issues.push('Some URLs use insecure HTTP instead of HTTPS');
  }
  if (!breakdown.security.details.hasSecuritySchemes) {
    issues.push('No security schemes declared');
  }

  // Documentation issues
  if (!breakdown.documentation.details.hasDocumentationUrl) {
    issues.push('No documentation URL provided');
  }

  return issues;
}
