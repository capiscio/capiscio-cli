/**
 * Multi-dimensional scoring system types
 * 
 * Three independent scores that measure different aspects of agent quality:
 * 1. Compliance Score - A2A protocol adherence
 * 2. Trust Score - Security and authenticity signals
 * 3. Availability Score - Operational readiness
 */

// ============================================================================
// Core Score Interfaces
// ============================================================================

/**
 * Compliance Score (0-100): Measures A2A v0.3.0 specification adherence
 * Always calculated consistently regardless of CLI flags
 */
export interface ComplianceScore {
  /** Total score (0-100) */
  total: number;
  /** Rating level based on score range */
  rating: ComplianceRating;
  /** Detailed breakdown by category */
  breakdown: ComplianceBreakdown;
  /** Issues found during validation */
  issues: string[];
}

/**
 * Trust Score (0-100): Measures security and authenticity signals
 * Includes Trust Confidence Multiplier based on signature presence
 */
export interface TrustScore {
  /** Total score (0-100) after applying confidence multiplier */
  total: number;
  /** Raw score before confidence multiplier */
  rawScore: number;
  /** Confidence multiplier applied (1.0x, 0.6x, or 0.4x) */
  confidenceMultiplier: number;
  /** Rating level based on final score */
  rating: TrustRating;
  /** Detailed breakdown by category */
  breakdown: TrustBreakdown;
  /** Issues found during validation */
  issues: string[];
  /** Whether any validation was skipped */
  partialValidation: boolean;
}

/**
 * Availability Score (0-100): Measures operational readiness
 * Only calculated when network tests are enabled (not --schema-only)
 */
export interface AvailabilityScore {
  /** Total score (0-100), or null if not tested */
  total: number | null;
  /** Rating level, or null if not tested */
  rating: AvailabilityRating | null;
  /** Detailed breakdown by category, or null if not tested */
  breakdown: AvailabilityBreakdown | null;
  /** Issues found during validation */
  issues: string[];
  /** Whether availability was tested */
  tested: boolean;
  /** Reason if not tested */
  notTestedReason?: string;
}

// ============================================================================
// Breakdown Structures
// ============================================================================

/**
 * Compliance Score Breakdown (total: 100 points)
 */
export interface ComplianceBreakdown {
  /** Core required fields (60 points - 9 fields @ 6.67 each) */
  coreFields: {
    score: number;
    maxScore: 60;
    details: {
      present: string[];
      missing: string[];
    };
  };
  /** Skills quality (20 points) */
  skillsQuality: {
    score: number;
    maxScore: 20;
    details: {
      skillsPresent: boolean;
      allSkillsHaveRequiredFields: boolean;
      allSkillsHaveTags: boolean;
      issueCount: number;
    };
  };
  /** Format and protocol compliance (15 points) */
  formatCompliance: {
    score: number;
    maxScore: 15;
    details: {
      validSemver: boolean;
      validProtocolVersion: boolean;
      validUrl: boolean;
      validTransports: boolean;
      validMimeTypes: boolean;
    };
  };
  /** Data quality (5 points) */
  dataQuality: {
    score: number;
    maxScore: 5;
    details: {
      noDuplicateSkillIds: boolean;
      fieldLengthsValid: boolean;
      noSsrfRisks: boolean;
    };
  };
}

/**
 * Trust Score Breakdown (total: 100 points before multiplier)
 */
export interface TrustBreakdown {
  /** Cryptographic signatures (40 points + confidence multiplier) */
  signatures: {
    score: number;
    maxScore: 40;
    tested: boolean;
    details: {
      hasValidSignature: boolean;
      multipleSignatures: boolean;
      coversAllFields: boolean;
      isRecent: boolean;
      hasInvalidSignature?: boolean;
      hasExpiredSignature?: boolean;
    };
  };
  /** Provider information (25 points) */
  provider: {
    score: number;
    maxScore: 25;
    tested: boolean;
    details: {
      hasOrganization: boolean;
      hasUrl: boolean;
      urlReachable?: boolean;
    };
  };
  /** Security configuration (20 points) */
  security: {
    score: number;
    maxScore: 20;
    details: {
      httpsOnly: boolean;
      hasSecuritySchemes: boolean;
      hasStrongAuth: boolean;
      hasHttpUrls?: boolean;
    };
  };
  /** Documentation and transparency (15 points) */
  documentation: {
    score: number;
    maxScore: 15;
    details: {
      hasDocumentationUrl: boolean;
      hasTermsOfService: boolean;
      hasPrivacyPolicy: boolean;
    };
  };
}

/**
 * Availability Score Breakdown (total: 100 points)
 */
export interface AvailabilityBreakdown {
  /** Primary endpoint (50 points) */
  primaryEndpoint: {
    score: number;
    maxScore: 50;
    details: {
      responds: boolean;
      responseTime?: number;
      hasCors?: boolean;
      validTls?: boolean;
      errors?: string[];
    };
  };
  /** Transport protocol support (30 points) */
  transportSupport: {
    score: number;
    maxScore: 30;
    details: {
      preferredTransportWorks: boolean;
      additionalInterfacesWorking: number;
      additionalInterfacesFailed: number;
    };
  };
  /** Response quality (20 points) */
  responseQuality: {
    score: number;
    maxScore: 20;
    details: {
      validStructure: boolean;
      properContentType: boolean;
      properErrorHandling: boolean;
    };
  };
}

// ============================================================================
// Rating Enums
// ============================================================================

export enum ComplianceRating {
  PERFECT = 'Perfect',
  EXCELLENT = 'Excellent',
  GOOD = 'Good',
  FAIR = 'Fair',
  POOR = 'Poor',
}

export enum TrustRating {
  HIGHLY_TRUSTED = 'Highly Trusted',
  TRUSTED = 'Trusted',
  MODERATE_TRUST = 'Moderate Trust',
  LOW_TRUST = 'Low Trust',
  UNTRUSTED = 'Untrusted',
}

export enum AvailabilityRating {
  FULLY_AVAILABLE = 'Fully Available',
  AVAILABLE = 'Available',
  DEGRADED = 'Degraded',
  UNSTABLE = 'Unstable',
  UNAVAILABLE = 'Unavailable',
}

// ============================================================================
// Combined Scoring Result
// ============================================================================

/**
 * Complete scoring result with all three dimensions
 */
export interface ScoringResult {
  /** Compliance score (always calculated) */
  compliance: ComplianceScore;
  /** Trust score (always calculated, but may have partial validation) */
  trust: TrustScore;
  /** Availability score (null if not tested) */
  availability: AvailabilityScore;
  /** Overall recommendation based on all scores */
  recommendation: string;
  /** Legacy single score for backward compatibility */
  legacyScore?: number;
}

// ============================================================================
// Validation Context
// ============================================================================

/**
 * Context provided to scorers about what validation was performed
 */
export interface ScoringContext {
  /** Whether schema-only validation was performed */
  schemaOnly: boolean;
  /** Whether signature verification was skipped */
  skipSignatureVerification: boolean;
  /** Whether live endpoint testing was performed */
  testLive: boolean;
  /** Whether strict mode is enabled */
  strictMode: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get compliance rating based on score
 */
export function getComplianceRating(score: number): ComplianceRating {
  if (score === 100) return ComplianceRating.PERFECT;
  if (score >= 90) return ComplianceRating.EXCELLENT;
  if (score >= 75) return ComplianceRating.GOOD;
  if (score >= 60) return ComplianceRating.FAIR;
  return ComplianceRating.POOR;
}

/**
 * Get trust rating based on score
 */
export function getTrustRating(score: number): TrustRating {
  if (score >= 80) return TrustRating.HIGHLY_TRUSTED;
  if (score >= 60) return TrustRating.TRUSTED;
  if (score >= 40) return TrustRating.MODERATE_TRUST;
  if (score >= 20) return TrustRating.LOW_TRUST;
  return TrustRating.UNTRUSTED;
}

/**
 * Get availability rating based on score
 */
export function getAvailabilityRating(score: number): AvailabilityRating {
  if (score >= 95) return AvailabilityRating.FULLY_AVAILABLE;
  if (score >= 80) return AvailabilityRating.AVAILABLE;
  if (score >= 60) return AvailabilityRating.DEGRADED;
  if (score >= 40) return AvailabilityRating.UNSTABLE;
  return AvailabilityRating.UNAVAILABLE;
}

/**
 * Get trust confidence multiplier based on signature state
 */
export function getTrustConfidenceMultiplier(
  hasValidSignature: boolean,
  hasInvalidSignature: boolean
): number {
  if (hasInvalidSignature) return 0.4; // Active distrust
  if (hasValidSignature) return 1.0; // Full confidence
  return 0.6; // Unverified claims
}
