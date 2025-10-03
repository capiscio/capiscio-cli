/**
 * Compliance Scorer - Measures A2A v0.3.0 specification adherence
 * 
 * Weighting:
 * - Core Required Fields: 60 points (9 fields @ 6.67 each)
 * - Skills Quality: 20 points
 * - Format Compliance: 15 points
 * - Data Quality: 5 points
 * 
 * Total: 100 points
 */

import { AgentCard } from '../types/index.js';
import {
  ComplianceScore,
  ComplianceBreakdown,
  getComplianceRating,
} from './types.js';

const REQUIRED_FIELDS = [
  'protocolVersion',
  'name',
  'description',
  'url',
  'version',
  'capabilities',
  'defaultInputModes',
  'defaultOutputModes',
  'skills',
];

/**
 * Calculate compliance score for an agent card
 */
export function calculateComplianceScore(
  agentCard: AgentCard,
  validationErrors: string[]
): ComplianceScore {
  const breakdown: ComplianceBreakdown = {
    coreFields: evaluateCoreFields(agentCard),
    skillsQuality: evaluateSkillsQuality(agentCard),
    formatCompliance: evaluateFormatCompliance(agentCard, validationErrors),
    dataQuality: evaluateDataQuality(agentCard),
  };

  const total =
    breakdown.coreFields.score +
    breakdown.skillsQuality.score +
    breakdown.formatCompliance.score +
    breakdown.dataQuality.score;

  // Ensure total doesn't exceed 100 due to rounding
  const finalTotal = Math.min(100, Math.round(total * 100) / 100);

  const issues = collectIssues(breakdown);

  return {
    total: finalTotal,
    rating: getComplianceRating(finalTotal),
    breakdown,
    issues,
  };
}

/**
 * Evaluate core required fields (60 points max)
 */
function evaluateCoreFields(agentCard: any): ComplianceBreakdown['coreFields'] {
  const present: string[] = [];
  const missing: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (agentCard[field] !== undefined && agentCard[field] !== null) {
      // Additional check for arrays - must not be empty
      if (Array.isArray(agentCard[field])) {
        if (agentCard[field].length > 0) {
          present.push(field);
        } else {
          missing.push(field);
        }
      } else {
        present.push(field);
      }
    } else {
      missing.push(field);
    }
  }

  // Calculate score: 60 points distributed evenly across fields
  // Use exact division to avoid rounding issues
  const score = (present.length / REQUIRED_FIELDS.length) * 60;

  return {
    score: Math.round(score * 100) / 100,
    maxScore: 60,
    details: {
      present,
      missing,
    },
  };
}

/**
 * Evaluate skills quality (20 points max)
 */
function evaluateSkillsQuality(agentCard: AgentCard): ComplianceBreakdown['skillsQuality'] {
  let score = 0;
  let issueCount = 0;

  const skills = agentCard.skills || [];
  
  // Base requirement: at least one skill present (5 points)
  const skillsPresent = skills.length > 0;
  if (skillsPresent) {
    score += 5;
  } else {
    issueCount++;
  }

  // All skills have required fields (10 points)
  let allSkillsHaveRequiredFields = true;
  if (skills.length > 0) {
    for (const skill of skills) {
      if (!skill.id || !skill.name || !skill.description) {
        allSkillsHaveRequiredFields = false;
        issueCount++;
        score -= 2; // Deduct 2 points per skill (max -10)
      }
    }
    if (allSkillsHaveRequiredFields) {
      score += 10;
    } else {
      // Ensure we don't go negative
      score = Math.max(5, score);
    }
  } else {
    allSkillsHaveRequiredFields = false;
  }

  // All skills have tags (5 points)
  let allSkillsHaveTags = true;
  if (skills.length > 0) {
    for (const skill of skills) {
      if (!skill.tags || skill.tags.length === 0) {
        allSkillsHaveTags = false;
        issueCount++;
        score -= 1; // Deduct 1 point per skill (max -5)
      }
    }
    if (allSkillsHaveTags) {
      score += 5;
    } else {
      // Ensure we don't go below 5 (base requirement)
      score = Math.max(skillsPresent ? 5 : 0, score);
    }
  } else {
    allSkillsHaveTags = false;
  }

  return {
    score: Math.max(0, Math.round(score * 100) / 100),
    maxScore: 20,
    details: {
      skillsPresent,
      allSkillsHaveRequiredFields,
      allSkillsHaveTags,
      issueCount,
    },
  };
}

/**
 * Evaluate format compliance (15 points max)
 */
function evaluateFormatCompliance(
  agentCard: AgentCard,
  _validationErrors: string[]
): ComplianceBreakdown['formatCompliance'] {
  let score = 15; // Start with max, deduct for violations

  // Valid semver version format (3 points)
  const validSemver = /^\d+\.\d+\.\d+/.test(agentCard.version || '');
  if (!validSemver) {
    score -= 3;
  }

  // Valid protocolVersion (3 points)
  const validProtocolVersion = ['0.1.0', '0.2.0', '0.3.0'].includes(
    agentCard.protocolVersion || ''
  );
  if (!validProtocolVersion) {
    score -= 3;
  }

  // Valid URL format (3 points)
  const validUrl = isValidUrl(agentCard.url);
  if (!validUrl) {
    score -= 3;
  }

  // Valid transport protocols (3 points)
  const validTransports = validateTransports(agentCard);
  if (!validTransports) {
    score -= 3;
  }

  // Valid MIME types (3 points)
  const validMimeTypes = validateMimeTypes(agentCard);
  if (!validMimeTypes) {
    score -= 3;
  }

  return {
    score: Math.max(0, score),
    maxScore: 15,
    details: {
      validSemver,
      validProtocolVersion,
      validUrl,
      validTransports,
      validMimeTypes,
    },
  };
}

/**
 * Evaluate data quality (5 points max)
 */
function evaluateDataQuality(agentCard: AgentCard): ComplianceBreakdown['dataQuality'] {
  let score = 5; // Start with max, deduct for violations

  // No duplicate skill IDs (2 points)
  const noDuplicateSkillIds = checkNoDuplicateSkillIds(agentCard.skills || []);
  if (!noDuplicateSkillIds) {
    score -= 2;
  }

  // Field lengths valid (2 points)
  const fieldLengthsValid = checkFieldLengths(agentCard);
  if (!fieldLengthsValid) {
    score -= 2;
  }

  // No SSRF risks (1 point)
  const noSsrfRisks = checkNoSsrfRisks(agentCard);
  if (!noSsrfRisks) {
    score -= 1;
  }

  return {
    score: Math.max(0, score),
    maxScore: 5,
    details: {
      noDuplicateSkillIds,
      fieldLengthsValid,
      noSsrfRisks,
    },
  };
}

/**
 * Helper: Check if URL is valid
 */
function isValidUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Helper: Validate transport protocols
 */
function validateTransports(agentCard: AgentCard): boolean {
  const validTransports = ['JSONRPC', 'HTTP+JSON', 'GRPC'];
  
  if (agentCard.preferredTransport) {
    if (!validTransports.includes(agentCard.preferredTransport)) {
      return false;
    }
  }

  if (agentCard.additionalInterfaces) {
    for (const iface of agentCard.additionalInterfaces) {
      if (iface.transport && !validTransports.includes(iface.transport)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Helper: Validate MIME types
 */
function validateMimeTypes(agentCard: AgentCard): boolean {
  const mimeTypeRegex = /^[a-z]+\/[a-z0-9+\-.]+$/i;

  const inputModes = agentCard.defaultInputModes || [];
  const outputModes = agentCard.defaultOutputModes || [];

  for (const mode of [...inputModes, ...outputModes]) {
    if (!mimeTypeRegex.test(mode)) {
      return false;
    }
  }

  return true;
}

/**
 * Helper: Check for duplicate skill IDs
 */
function checkNoDuplicateSkillIds(skills: any[]): boolean {
  const ids = skills.map((s) => s.id).filter(Boolean);
  const uniqueIds = new Set(ids);
  return ids.length === uniqueIds.size;
}

/**
 * Helper: Check field lengths are reasonable
 */
function checkFieldLengths(agentCard: AgentCard): boolean {
  // Name should be reasonable length
  if (agentCard.name && agentCard.name.length > 100) return false;
  
  // Description should not be excessively long
  if (agentCard.description && agentCard.description.length > 1000) return false;
  
  // URLs should be reasonable
  if (agentCard.url && agentCard.url.length > 500) return false;

  return true;
}

/**
 * Helper: Check for SSRF risks (localhost, private IPs)
 */
function checkNoSsrfRisks(agentCard: AgentCard): boolean {
  const dangerousPatterns = [
    /localhost/i,
    /127\.0\.0\.1/,
    /0\.0\.0\.0/,
    /192\.168\./,
    /10\./,
    /172\.(1[6-9]|2[0-9]|3[01])\./,
  ];

  const urls = [
    agentCard.url,
    agentCard.documentationUrl,
    agentCard.provider?.url,
  ].filter(Boolean);

  for (const url of urls) {
    for (const pattern of dangerousPatterns) {
      if (pattern.test(url as string)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Collect all issues from breakdown
 */
function collectIssues(breakdown: ComplianceBreakdown): string[] {
  const issues: string[] = [];

  // Core fields issues
  if (breakdown.coreFields.details.missing.length > 0) {
    issues.push(
      `Missing required fields: ${breakdown.coreFields.details.missing.join(', ')}`
    );
  }

  // Skills quality issues
  if (!breakdown.skillsQuality.details.skillsPresent) {
    issues.push('No skills defined');
  }
  if (!breakdown.skillsQuality.details.allSkillsHaveRequiredFields) {
    issues.push('Some skills missing required fields (id, name, description)');
  }
  if (!breakdown.skillsQuality.details.allSkillsHaveTags) {
    issues.push('Some skills missing tags');
  }

  // Format compliance issues
  if (!breakdown.formatCompliance.details.validSemver) {
    issues.push('Invalid semver version format');
  }
  if (!breakdown.formatCompliance.details.validProtocolVersion) {
    issues.push('Invalid or unsupported protocolVersion');
  }
  if (!breakdown.formatCompliance.details.validUrl) {
    issues.push('Invalid URL format');
  }
  if (!breakdown.formatCompliance.details.validTransports) {
    issues.push('Invalid transport protocol specified');
  }
  if (!breakdown.formatCompliance.details.validMimeTypes) {
    issues.push('Invalid MIME types in input/output modes');
  }

  // Data quality issues
  if (!breakdown.dataQuality.details.noDuplicateSkillIds) {
    issues.push('Duplicate skill IDs detected');
  }
  if (!breakdown.dataQuality.details.fieldLengthsValid) {
    issues.push('Some fields exceed reasonable length limits');
  }
  if (!breakdown.dataQuality.details.noSsrfRisks) {
    issues.push('URLs contain localhost or private IP addresses');
  }

  return issues;
}
