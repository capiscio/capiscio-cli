/**
 * Agent Card JWS Signature Verification
 * Implements A2A Protocol §5.5.6 - AgentCardSignature verification
 */

import { jwtVerify, createRemoteJWKSet } from 'jose';
import type { AgentCard, AgentCardSignature } from './types';

/**
 * Result of signature verification
 */
export interface SignatureVerificationResult {
  valid: boolean;
  signatures: SignatureResult[];
  summary: {
    total: number;
    valid: number;
    failed: number;
    errors: string[];
  };
}

/**
 * Result for individual signature
 */
export interface SignatureResult {
  index: number;
  valid: boolean;
  algorithm?: string;
  keyId?: string;
  issuer?: string;
  jwksUri?: string;
  error?: string;
  details?: string;
}

/**
 * JWS Protected Header structure
 */
interface JWSHeader {
  alg: string;
  typ?: string;
  kid?: string;
  jku?: string;
  jwks_uri?: string;
}

/**
 * Verify all signatures in an Agent Card
 */
export async function verifyAgentCardSignatures(
  agentCard: AgentCard,
  options: { timeout?: number; allowInsecure?: boolean } = {}
): Promise<SignatureVerificationResult> {
  const { timeout = 10000, allowInsecure = false } = options;
  
  if (!agentCard.signatures || agentCard.signatures.length === 0) {
    return {
      valid: false,
      signatures: [],
      summary: {
        total: 0,
        valid: 0,
        failed: 0,
        errors: ['No signatures present in Agent Card']
      }
    };
  }

  const results: SignatureResult[] = [];
  const errors: string[] = [];

  // Verify each signature
  for (let i = 0; i < agentCard.signatures.length; i++) {
    const signature = agentCard.signatures[i];
    if (!signature) {
      results.push({
        index: i,
        valid: false,
        error: 'Signature is undefined'
      });
      continue;
    }
    
    try {
      const result = await verifySingleSignature(agentCard, signature, i, {
        timeout,
        allowInsecure
      });
      results.push(result);
      
      if (!result.valid && result.error) {
        errors.push(`Signature ${i + 1}: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({
        index: i,
        valid: false,
        error: errorMessage
      });
      errors.push(`Signature ${i + 1}: ${errorMessage}`);
    }
  }

  const validCount = results.filter(r => r.valid).length;
  const totalCount = results.length;

  return {
    valid: validCount > 0 && validCount === totalCount,
    signatures: results,
    summary: {
      total: totalCount,
      valid: validCount,
      failed: totalCount - validCount,
      errors
    }
  };
}

/**
 * Verify a single signature
 */
async function verifySingleSignature(
  agentCard: AgentCard,
  signature: AgentCardSignature,
  index: number,
  options: { timeout?: number; allowInsecure?: boolean }
): Promise<SignatureResult> {
  try {
    // Parse the protected header
    const header = parseProtectedHeader(signature.protected);
    
    // Validate header
    const headerValidation = validateJWSHeader(header, options.allowInsecure || false);
    if (headerValidation.error) {
      return {
        index,
        valid: false,
        algorithm: header.alg,
        ...(header.kid && { keyId: header.kid }),
        error: headerValidation.error
      };
    }

    // Get JWKS URI
    const jwksUri = header.jku || header.jwks_uri;
    if (!jwksUri) {
      return {
        index,
        valid: false,
        algorithm: header.alg,
        ...(header.kid && { keyId: header.kid }),
        error: 'No JWKS URI found in signature header (jku or jwks_uri required)'
      };
    }

    // Verify the signature
    const isValid = await verifyDetachedJWS(
      agentCard,
      signature,
      header,
      jwksUri,
      options.timeout
    );

    return {
      index,
      valid: isValid,
      algorithm: header.alg,
      ...(header.kid && { keyId: header.kid }),
      jwksUri,
      details: isValid ? 'Signature verified successfully' : 'Signature verification failed'
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown verification error';
    return {
      index,
      valid: false,
      error: errorMessage
    };
  }
}

/**
 * Parse JWS protected header
 */
function parseProtectedHeader(protectedHeader: string): JWSHeader {
  try {
    const decoded = Buffer.from(protectedHeader, 'base64url').toString('utf-8');
    const header: JWSHeader = JSON.parse(decoded);
    return header;
  } catch (error) {
    throw new Error(`Invalid protected header format: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate JWS header for security requirements
 */
function validateJWSHeader(
  header: JWSHeader,
  allowInsecure: boolean
): { valid: boolean; error?: string } {
  // Check required fields
  if (!header.alg) {
    return { valid: false, error: 'Missing algorithm (alg) in signature header' };
  }

  // Reject dangerous algorithms
  if (header.alg === 'none') {
    return { valid: false, error: 'Algorithm "none" is not allowed for security reasons' };
  }

  // Check for supported algorithms
  const supportedAlgorithms = ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512', 'PS256', 'PS384', 'PS512', 'EdDSA'];
  if (!supportedAlgorithms.includes(header.alg)) {
    return { valid: false, error: `Unsupported algorithm: ${header.alg}` };
  }

  // Validate JWKS URI security
  const jwksUri = header.jku || header.jwks_uri;
  if (jwksUri && !allowInsecure) {
    try {
      const url = new URL(jwksUri);
      if (url.protocol !== 'https:') {
        return { valid: false, error: 'JWKS URI must use HTTPS for security' };
      }
    } catch {
      return { valid: false, error: 'Invalid JWKS URI format' };
    }
  }

  return { valid: true };
}

/**
 * Verify a detached JWS signature against an Agent Card
 */
async function verifyDetachedJWS(
  agentCard: AgentCard,
  signature: AgentCardSignature,
  header: JWSHeader,
  jwksUri: string,
  timeout = 10000
): Promise<boolean> {
  try {
    // Create canonical Agent Card payload (exclude signatures)
    const { signatures, ...agentCardWithoutSignatures } = agentCard;
    const canonicalPayload = createCanonicalJSON(agentCardWithoutSignatures);
    
    // Create the detached JWS format for verification
    // For detached JWS: {protected}.{payload}.{signature}
    const payloadEncoded = Buffer.from(canonicalPayload).toString('base64url');
    const detachedJWS = `${signature.protected}.${payloadEncoded}.${signature.signature}`;

    // Create remote JWKS with timeout
    const JWKS = createRemoteJWKSet(new URL(jwksUri), {
      timeoutDuration: timeout,
      cooldownDuration: 30000, // 30 seconds cooldown
      cacheMaxAge: 300000 // 5 minutes cache
    });

    // Verify the JWT
    await jwtVerify(detachedJWS, JWKS, {
      algorithms: [header.alg as any],
      ...(header.kid && { keyid: header.kid })
    });

    return true;
  } catch (error) {
    // Log the specific error for debugging but return false for failed verification
    console.warn(`JWS verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

/**
 * Create canonical JSON representation for consistent signing/verification
 * Removes signatures array and sorts keys for deterministic output
 */
function createCanonicalJSON(obj: Record<string, any>): string {
  // Recursive function to sort all object keys
  function sortObjectKeys(item: any): any {
    if (Array.isArray(item)) {
      return item.map(sortObjectKeys);
    } else if (item !== null && typeof item === 'object') {
      const sorted: Record<string, any> = {};
      const keys = Object.keys(item).sort();
      for (const key of keys) {
        sorted[key] = sortObjectKeys(item[key]);
      }
      return sorted;
    }
    return item;
  }

  const sortedObj = sortObjectKeys(obj);
  return JSON.stringify(sortedObj);
}

/**
 * Format verification results for display
 */
export function formatVerificationResults(result: SignatureVerificationResult): string[] {
  const output: string[] = [];
  
  if (result.summary.total === 0) {
    output.push('⚠️  No signatures present in Agent Card');
    return output;
  }

  // Summary line
  const status = result.valid ? '✅' : '❌';
  output.push(`${status} Signature verification: ${result.summary.valid}/${result.summary.total} signatures valid`);
  
  // Individual signature results
  result.signatures.forEach((sig, idx) => {
    const sigStatus = sig.valid ? '✅' : '❌';
    const sigNum = idx + 1;
    
    let line = `${sigStatus} Signature ${sigNum}/${result.summary.total}`;
    
    if (sig.algorithm) line += `: ${sig.algorithm}`;
    if (sig.keyId) line += ` (key: ${sig.keyId})`;
    if (sig.jwksUri) {
      try {
        const domain = new URL(sig.jwksUri).hostname;
        line += ` from ${domain}`;
      } catch {
        // Ignore URL parsing errors in display
      }
    }
    
    output.push(line);
    
    if (sig.error) {
      output.push(`   Error: ${sig.error}`);
    }
    if (sig.details && sig.valid) {
      output.push(`   ${sig.details}`);
    }
  });

  return output;
}

/**
 * Helper function to decode JWS header for inspection without verification
 */
export function inspectSignatureHeader(signature: AgentCardSignature): JWSHeader | null {
  try {
    return parseProtectedHeader(signature.protected);
  } catch {
    return null;
  }
}