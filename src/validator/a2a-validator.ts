import { AgentCard, ValidationResult, ValidationOptions, HttpClient, VersionMismatch, TransportProtocol } from '../types';
import { FetchHttpClient } from './http-client';
import { semverCompare, isValidSemver } from '../utils/semver';
import { Logger } from '../utils/logger';

/**
 * A2A Validator with URL support and embedded validation logic
 * 
 * This validator combines schema validation, version checking, and HTTP endpoint testing
 * into a single self-contained validator optimized for CLI usage.
 */
export class A2AValidator {
  private httpClient: HttpClient;
  private logger: Logger;

  constructor(httpClient?: HttpClient) {
    this.httpClient = httpClient || new FetchHttpClient();
    this.logger = new Logger(false); // Will be enabled per validation
  }

  async validate(
    input: AgentCard | string, 
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    // Initialize logger with verbose setting
    this.logger = new Logger(options.verbose || false);
    
    // Update HTTP client with logger if it's our default client
    if (this.httpClient instanceof FetchHttpClient && options.verbose) {
      this.httpClient = new FetchHttpClient(this.logger);
    }
    
    this.logger.debug('Starting A2A validation', { 
      inputType: typeof input,
      options: { ...options, verbose: undefined } // Don't log verbose flag itself
    });

    try {
      let agentCard: AgentCard;
      let usedLegacyEndpoint = false;
      let discoveryUrl = '';

      // Determine if input is a URL or local file path
      if (typeof input === 'string') {
        const isUrl = this.isValidUrl(input) || (!input.includes('\\') && !input.includes('/') && !input.endsWith('.json'));
        this.logger.debug(`Input type detected: ${isUrl ? 'URL' : 'local file'}`, { input, isUrl });
        
        if (isUrl && !options.skipDynamic) {
          // Remote URL - fetch the agent card
          this.logger.step('Fetching agent card from URL');
          const fetchTimer = this.logger.timer();
          const fetchResult = await this.fetchAgentCard(input);
          const fetchDuration = fetchTimer();
          this.logger.timing('Agent card fetch', fetchDuration);
          
          agentCard = fetchResult.card;
          usedLegacyEndpoint = fetchResult.usedLegacyEndpoint;
          discoveryUrl = fetchResult.discoveryUrl;
          
          this.logger.debug('Agent card fetched successfully', { 
            usedLegacyEndpoint, 
            discoveryUrl,
            cardSize: JSON.stringify(agentCard).length 
          });
        } else if (isUrl && options.skipDynamic) {
          // URL provided but schema-only mode requested
          return {
            success: false,
            score: 0,
            errors: [{
              code: 'SCHEMA_ONLY_NO_URL',
              message: 'Schema-only validation requires a local agent card file, not a URL',
              severity: 'error' as const,
              fixable: true
            }],
            warnings: [],
            suggestions: [{
              id: 'use_local_file',
              message: 'To use schema-only validation, provide a local agent card file instead of a URL',
              severity: 'info' as const,
              impact: 'Schema validation cannot be performed on remote URLs',
              fixable: true
            }],
            validations: []
          };
        } else {
          // Local file path - read and parse the file
          try {
            const fs = await import('fs/promises');
            const fileContent = await fs.readFile(input, 'utf-8');
            agentCard = JSON.parse(fileContent);
          } catch (error) {
            return {
              success: false,
              score: 0,
              errors: [{
                code: 'FILE_READ_ERROR',
                message: `Failed to read agent card file: ${error instanceof Error ? error.message : 'Unknown error'}`,
                severity: 'error' as const,
                fixable: false
              }],
              warnings: [],
              suggestions: [],
              validations: []
            };
          }
        }
      } else {
        agentCard = input;
      }

      // Perform validation based on strictness mode
      const result = await this.performValidation(agentCard, options, input);

      // Add legacy endpoint warning if detected
      if (usedLegacyEndpoint) {
        result.warnings.push({
          code: 'LEGACY_DISCOVERY_ENDPOINT',
          message: `Agent discovered via legacy endpoint (${discoveryUrl}). The A2A v0.3.0 specification recommends using /.well-known/agent-card.json`,
          field: 'discovery',
          severity: 'warning',
          fixable: true
        });

        result.suggestions.push({
          id: 'migrate_legacy_endpoint',
          message: 'Consider migrating from legacy /.well-known/agent.json to /.well-known/agent-card.json for future compatibility',
          severity: 'info',
          impact: 'Future A2A specification versions may not support the legacy agent.json endpoint',
          fixable: true
        });
      }

      return result;

    } catch (error) {
      return {
        success: false,
        score: 0,
        errors: [{
          code: 'VALIDATION_FAILED',
          message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        }],
        warnings: [],
        suggestions: [],
        validations: []
      };
    }
  }

  private async performValidation(card: AgentCard, options: ValidationOptions, originalInput?: string | AgentCard): Promise<ValidationResult> {
    const validations: any[] = [];
    const errors: any[] = [];
    const warnings: any[] = [];
    const suggestions: any[] = [];
    
    // Schema validation timing is handled within validateSchema

    // 1. Schema Validation
    const schemaResult = await this.validateSchema(card);
    validations.push({
      id: 'schema_validation',
      name: 'Schema Validation',
      status: schemaResult.success ? 'passed' : 'failed',
      message: schemaResult.success 
        ? 'Agent card conforms to A2A v0.3.0 schema'
        : `Schema validation failed with ${schemaResult.errors.length} error(s)`,
      duration: schemaResult.duration || 0,
      details: schemaResult.success 
        ? 'Agent card structure is valid'
        : 'Agent card does not conform to A2A v0.3.0 schema'
    });

    errors.push(...schemaResult.errors);
    warnings.push(...schemaResult.warnings);

    // 2. Version Compatibility Check  
    const versionResult = this.validateVersionCompatibility(card, options.strictness || 'progressive');
    validations.push({
      id: 'v030_features',
      name: 'A2A v0.3.0 Features',
      status: versionResult.compatible ? 'passed' : 'failed',
      message: versionResult.compatible 
        ? 'All v0.3.0 features are properly configured'
        : 'Version compatibility issues detected',
      duration: 0,
      details: 'Validation of v0.3.0 specific features and capabilities'
    });

    // Add version-related errors/warnings based on strictness
    if (options.strictness === 'strict') {
      versionResult.mismatches.forEach(mismatch => {
        if (mismatch.severity === 'warning') {
          errors.push({
            code: 'STRICT_VERSION_MISMATCH',
            message: `Strict mode: ${mismatch.description}`,
            field: mismatch.feature,
            severity: 'error'
          });
        } else {
          errors.push({
            code: 'VERSION_MISMATCH_ERROR', 
            message: mismatch.description,
            field: mismatch.feature,
            severity: 'error'
          });
        }
      });
    } else {
      versionResult.mismatches.forEach(mismatch => {
        if (mismatch.severity === 'error') {
          errors.push({
            code: 'VERSION_MISMATCH_ERROR',
            message: mismatch.description,
            field: mismatch.feature,
            severity: 'error'
          });
        } else {
          warnings.push({
            code: 'VERSION_FEATURE_MISMATCH',
            message: `${mismatch.description}: Update protocolVersion to "${mismatch.requiredVersion}" or remove feature`,
            field: mismatch.feature,
            severity: 'warning',
            fixable: true
          });
        }
      });
    }

    // 3. Signature Verification (enabled by default, can be skipped)
    if (!options.skipSignatureVerification && card.signatures && card.signatures.length > 0) {
      const { verifyAgentCardSignatures } = await import('../signature-verification');
      const signatureTimer = this.logger.timer();
      this.logger.step('Verifying JWS signatures');
      
      try {
        const signatureResult = await verifyAgentCardSignatures(card, { timeout: 10000 });
        const signatureDuration = signatureTimer();
        this.logger.timing('Signature verification', signatureDuration);
        
        const verifiedCount = signatureResult.summary.valid;
        const failedCount = signatureResult.summary.failed;
        const totalCount = signatureResult.summary.total;
        
        validations.push({
          id: 'signature_verification',
          name: 'JWS Signature Verification',
          status: failedCount === 0 ? 'passed' : 'failed',
          message: `${verifiedCount} of ${totalCount} signatures verified successfully`,
          duration: signatureDuration,
          details: `Verified ${verifiedCount} valid signatures, ${failedCount} failed signatures`
        });

        // Add errors for failed signatures
        signatureResult.signatures.forEach((result, index) => {
          if (!result.valid) {
            errors.push({
              code: 'SIGNATURE_VERIFICATION_FAILED',
              message: `Signature ${index + 1} verification failed: ${result.error || 'Unknown error'}`,
              field: `signatures[${index}]`,
              severity: 'error'
            });
          }
        });

        // Add warnings for signature issues
        if (verifiedCount > 0 && failedCount > 0) {
          warnings.push({
            code: 'PARTIAL_SIGNATURE_VERIFICATION',
            message: `Only ${verifiedCount} of ${totalCount} signatures could be verified`,
            field: 'signatures',
            severity: 'warning',
            fixable: true
          });
        }

        // Add summary errors if any exist
        if (signatureResult.summary.errors.length > 0) {
          signatureResult.summary.errors.forEach(error => {
            warnings.push({
              code: 'SIGNATURE_VERIFICATION_WARNING',
              message: error,
              field: 'signatures',
              severity: 'warning',
              fixable: true
            });
          });
        }
        
      } catch (error) {
        const signatureDuration = signatureTimer();
        this.logger.timing('Signature verification (failed)', signatureDuration);
        
        validations.push({
          id: 'signature_verification',
          name: 'JWS Signature Verification',
          status: 'failed',
          message: 'Signature verification failed due to system error',
          duration: signatureDuration,
          details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });

        errors.push({
          code: 'SIGNATURE_VERIFICATION_ERROR',
          message: `Signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          field: 'signatures',
          severity: 'error'
        });
      }
    } else if (!options.skipSignatureVerification && (!card.signatures || card.signatures.length === 0)) {
      // Signature verification is enabled by default but no signatures present
      validations.push({
        id: 'signature_verification',
        name: 'JWS Signature Verification',
        status: 'skipped',
        message: 'No signatures found to verify',
        duration: 0,
        details: 'Agent card does not contain any signatures'
      });

      warnings.push({
        code: 'NO_SIGNATURES_FOUND',
        message: 'No signatures are present in the agent card. Consider adding signatures to improve trust.',
        field: 'signatures',
        severity: 'warning',
        fixable: true
      });
    } else if (options.skipSignatureVerification && card.signatures && card.signatures.length > 0) {
      // Signature verification was explicitly skipped but signatures are present
      validations.push({
        id: 'signature_verification',
        name: 'JWS Signature Verification',
        status: 'skipped',
        message: 'Signature verification was explicitly skipped',
        duration: 0,
        details: 'Agent card contains signatures but verification was skipped by user request'
      });

      warnings.push({
        code: 'SIGNATURE_VERIFICATION_SKIPPED',
        message: 'Signature verification was skipped despite signatures being present. This reduces trust verification.',
        field: 'signatures',
        severity: 'warning',
        fixable: true
      });
    }

    // 4. Transport Endpoint Testing (if not skipped)
    if (!options.skipDynamic && typeof originalInput === 'string' && this.isValidUrl(originalInput)) {
      const transportResult = await this.validateTransportEndpoints(card, options);
      validations.push(...transportResult.validations);
      errors.push(...transportResult.errors);
      warnings.push(...transportResult.warnings);
    }

    // 5. Additional validations based on detected issues
    this.addAdditionalWarnings(card, warnings);

    // 6. Strictness-specific validations
    this.applyStrictnessValidations(card, options, errors, warnings);

    // Calculate score
    const totalChecks = validations.length;
    const passedChecks = validations.filter(v => v.status === 'passed').length;
    const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

    const success = errors.length === 0;

    return {
      success,
      score,
      errors,
      warnings,
      suggestions,
      validations,
      versionInfo: {
        detectedVersion: card.protocolVersion || 'undefined',
        validatorVersion: '0.3.0',
        strictness: options.strictness || 'progressive',
        compatibility: versionResult,
        migrationPath: versionResult.suggestions
      }
    };
  }

  private async validateSchema(card: AgentCard): Promise<{ success: boolean; errors: any[]; warnings: any[]; duration: number }> {
    const startTime = Date.now();
    const errors: any[] = [];
    const warnings: any[] = [];

    this.logger.step('Validating schema structure');

    // Required fields validation (per A2A v0.3.0 specification)
    const requiredFields = ['name', 'description', 'url', 'provider', 'version'];
    
    // A2A v0.3.0 specific required fields
    const v030RequiredFields = ['protocolVersion', 'preferredTransport'];
    
    this.logger.debug('Checking required fields', { 
      requiredFields: [...requiredFields, ...v030RequiredFields] 
    });
    
    [...requiredFields, ...v030RequiredFields].forEach(field => {
      if (!this.getNestedValue(card, field)) {
        this.logger.debug(`Missing required field: ${field}`);
        errors.push({
          code: 'SCHEMA_VALIDATION_ERROR',
          message: `${field}: Required`,
          field: field,
          severity: 'error',
          fixable: true
        });
      }
    });

    // Version format validation
    if (card.version && !isValidSemver(card.version)) {
      this.logger.debug(`Invalid version format: ${card.version}`);
      errors.push({
        code: 'SCHEMA_VALIDATION_ERROR',
        message: 'version: Version must follow semver format',
        field: 'version',
        severity: 'error',
        fixable: true
      });
    }

    // Provider organization validation (v0.3.0 requirement)
    if (card.provider && !card.provider.organization) {
      errors.push({
        code: 'SCHEMA_VALIDATION_ERROR',
        message: 'provider.organization: Required',
        field: 'provider.organization',
        severity: 'error',
        fixable: true
      });
    }

    // Transport protocol validation (A2A v0.3.0 Section 3.2)
    if (card.preferredTransport) {
      const validTransports = ['JSONRPC', 'GRPC', 'HTTP+JSON'];
      if (!validTransports.includes(card.preferredTransport)) {
        errors.push({
          code: 'SCHEMA_VALIDATION_ERROR',
          message: `preferredTransport: Must be one of ${validTransports.join(', ')}`,
          field: 'preferredTransport',
          severity: 'error',
          fixable: true
        });
      }
    }

    // URL format and HTTPS enforcement (RFC 0001 R1, A2A §5.3)
    if (card.url && !this.isValidHttpsUrl(card.url)) {
      errors.push({
        code: 'SCHEMA_VALIDATION_ERROR',
        message: 'url: Must be a valid HTTPS URL (HTTP not allowed per A2A specification)',
        field: 'url',
        severity: 'error',
        fixable: true
      });
    }

    // Check for localhost, private IPs (SSRF protection per RFC 0001)
    if (card.url && this.isPrivateOrLocalUrl(card.url)) {
      errors.push({
        code: 'SCHEMA_VALIDATION_ERROR',
        message: 'url: Cannot use localhost, private IP addresses, or non-routable addresses',
        field: 'url',
        severity: 'error',
        fixable: true
      });
    }

    // Protocol version validation
    if (card.protocolVersion) {
      const validVersions = ['0.1.0', '0.2.0', '0.3.0'];
      if (!validVersions.includes(card.protocolVersion)) {
        errors.push({
          code: 'SCHEMA_VALIDATION_ERROR',
          message: `protocolVersion: Must be one of ${validVersions.join(', ')}`,
          field: 'protocolVersion',
          severity: 'error',
          fixable: true
        });
      }
    }

    // Optional URL fields validation (must be HTTPS if present)
    const urlFields = ['iconUrl', 'documentationUrl', 'termsOfServiceUrl', 'privacyPolicyUrl'];
    urlFields.forEach(field => {
      const value = this.getNestedValue(card, field);
      if (value && !this.isValidHttpsUrl(value)) {
        errors.push({
          code: 'SCHEMA_VALIDATION_ERROR',
          message: `${field}: Must be a valid HTTPS URL`,
          field: field,
          severity: 'error',
          fixable: true
        });
      }
    });

    // Skills validation
    if (card.skills) {
      const skillIds = new Set<string>();
      
      card.skills.forEach((skill, index) => {
        if (!skill.id) {
          errors.push({
            code: 'SCHEMA_VALIDATION_ERROR',
            message: `skills.${index}.id: Required`,
            field: `skills.${index}.id`,
            severity: 'error',
            fixable: true
          });
        } else {
          // Check for duplicate skill IDs
          if (skillIds.has(skill.id)) {
            errors.push({
              code: 'SCHEMA_VALIDATION_ERROR',
              message: `skills.${index}.id: Duplicate skill ID '${skill.id}' - skill IDs must be unique within agent card`,
              field: `skills.${index}.id`,
              severity: 'error',
              fixable: true
            });
          } else {
            skillIds.add(skill.id);
          }
          
          // Skill ID length validation
          if (skill.id.length > 200) {
            errors.push({
              code: 'SCHEMA_VALIDATION_ERROR',
              message: `skills.${index}.id: Maximum 200 characters allowed`,
              field: `skills.${index}.id`,
              severity: 'error',
              fixable: true
            });
          }
        }

        if (!skill.name) {
          errors.push({
            code: 'SCHEMA_VALIDATION_ERROR',
            message: `skills.${index}.name: Required`,
            field: `skills.${index}.name`,
            severity: 'error',
            fixable: true
          });
        } else if (skill.name.length > 200) {
          errors.push({
            code: 'SCHEMA_VALIDATION_ERROR',
            message: `skills.${index}.name: Maximum 200 characters allowed`,
            field: `skills.${index}.name`,
            severity: 'error',
            fixable: true
          });
        }

        if (!skill.description) {
          errors.push({
            code: 'SCHEMA_VALIDATION_ERROR',
            message: `skills.${index}.description: Required`,
            field: `skills.${index}.description`,
            severity: 'error',
            fixable: true
          });
        } else if (skill.description.length > 2000) {
          errors.push({
            code: 'SCHEMA_VALIDATION_ERROR',
            message: `skills.${index}.description: Maximum 2000 characters allowed`,
            field: `skills.${index}.description`,
            severity: 'error',
            fixable: true
          });
        }

        if (skill.examples && Array.isArray(skill.examples)) {
          skill.examples.forEach((example, exampleIndex) => {
            if (typeof example !== 'string') {
              errors.push({
                code: 'SCHEMA_VALIDATION_ERROR',
                message: `skills.${index}.examples.${exampleIndex}: Expected string, received ${typeof example}`,
                field: `skills.${index}.examples.${exampleIndex}`,
                severity: 'error',
                fixable: true
              });
            }
          });
        }
      });
    }

    // A2A Transport Consistency Validation (§5.6.4)
    this.validateTransportConsistency(card, errors, warnings);

    const duration = Date.now() - startTime;
    const success = errors.length === 0;

    this.logger.step('Schema validation completed', duration);
    this.logger.debug('Schema validation results', { 
      success, 
      errorCount: errors.length, 
      warningCount: warnings.length 
    });

    return { success, errors, warnings, duration };
  }

  private validateVersionCompatibility(card: AgentCard, _strictness: string) {
    const detectedVersion = card.protocolVersion;
    const targetVersion = '0.3.0';
    const mismatches: VersionMismatch[] = [];

    // If no protocolVersion is specified, check for v0.3.0 features
    if (!detectedVersion) {
      if (card.capabilities?.pushNotifications) {
        mismatches.push({
          feature: 'capabilities.pushNotifications',
          requiredVersion: '0.3.0',
          detectedVersion: 'undefined',
          severity: 'warning',
          description: 'Push notifications capability requires protocolVersion to be specified (minimum 0.3.0)'
        });
      }

      if (card.additionalInterfaces && card.additionalInterfaces.length > 0) {
        mismatches.push({
          feature: 'additionalInterfaces',
          requiredVersion: '0.3.0',
          detectedVersion: 'undefined',
          severity: 'warning',
          description: 'additionalInterfaces field requires protocolVersion to be specified (minimum 0.3.0)'
        });
      }
    } else {
      // Check if detected version is compatible with used features
      if (card.capabilities?.streaming && !this.isVersionCompatible(detectedVersion, '0.3.0')) {
        mismatches.push({
          feature: 'capabilities.streaming',
          requiredVersion: '0.3.0',
          detectedVersion,
          severity: 'warning',
          description: 'Streaming capability was introduced in A2A v0.3.0'
        });
      }
    }

    const compatible = mismatches.length === 0;
    const suggestions = compatible ? [] : ['Update protocolVersion to "0.3.0" to match used features'];

    return {
      detectedVersion: detectedVersion || 'undefined',
      targetVersion,
      compatible,
      mismatches,
      suggestions
    };
  }

  private validateTransportConsistency(card: AgentCard, errors: any[], warnings: any[]): void {
    // A2A §5.6.4 Transport Consistency Requirements
    
    // 1. preferredTransport must be present (already checked in required fields)
    
    // 2. Interface completeness: additionalInterfaces SHOULD include main URL
    if (card.additionalInterfaces && card.additionalInterfaces.length > 0) {
      const mainUrlInterface = card.additionalInterfaces.find(
        iface => iface.url === card.url && iface.transport === card.preferredTransport
      );
      
      if (!mainUrlInterface) {
        warnings.push({
          code: 'TRANSPORT_INTERFACE_COMPLETENESS',
          message: 'additionalInterfaces should include an entry for the main URL and preferredTransport for completeness',
          field: 'additionalInterfaces',
          severity: 'warning',
          fixable: true
        });
      }
      
      // 3. No conflicts: same URL must not declare conflicting transports
      const urlTransportMap = new Map<string, string>();
      urlTransportMap.set(card.url, card.preferredTransport);
      
      card.additionalInterfaces.forEach((iface, index) => {
        const existingTransport = urlTransportMap.get(iface.url);
        if (existingTransport && existingTransport !== iface.transport) {
          errors.push({
            code: 'TRANSPORT_URL_CONFLICT',
            message: `Conflicting transport protocols for URL ${iface.url}: ${existingTransport} vs ${iface.transport}`,
            field: `additionalInterfaces.${index}`,
            severity: 'error',
            fixable: true
          });
        } else {
          urlTransportMap.set(iface.url, iface.transport);
        }
      });
    }
    
    // 4. Minimum transport requirement is satisfied by having preferredTransport (already validated)
  }

  private addAdditionalWarnings(card: AgentCard, warnings: any[]) {
    // Check for gRPC without streaming
    if (card.additionalInterfaces) {
      const hasGrpc = card.additionalInterfaces.some(iface => iface.transport === 'GRPC');
      const hasStreaming = card.capabilities?.streaming;
      
      if (hasGrpc && !hasStreaming) {
        warnings.push({
          code: 'GRPC_WITHOUT_STREAMING',
          message: 'gRPC transport is configured but streaming capability is not enabled',
          severity: 'warning',
          fixable: true
        });
      }
    }
  }

  private applyStrictnessValidations(card: AgentCard, options: ValidationOptions, errors: any[], warnings: any[]): void {
    // In strict mode, promote certain warnings to errors
    if (options.strictness === 'strict') {
      // Find GRPC_WITHOUT_STREAMING warnings and convert to errors
      const grpcWarningIndex = warnings.findIndex(w => w.code === 'GRPC_WITHOUT_STREAMING');
      if (grpcWarningIndex !== -1) {
        const warning = warnings.splice(grpcWarningIndex, 1)[0];
        errors.push({
          ...warning,
          severity: 'error',
          message: `Strict mode: ${warning.message}`
        });
      }
    }
  }

  private async fetchAgentCard(url: string): Promise<{
    card: AgentCard;
    usedLegacyEndpoint: boolean;
    discoveryUrl: string;
  }> {
    // Check if the URL is already a well-known endpoint
    if (url.includes('/.well-known/agent')) {
      const response = await this.httpClient.get(url);
      return {
        card: response.data as AgentCard,
        usedLegacyEndpoint: url.includes('/agent.json'),
        discoveryUrl: url
      };
    }

    // First try direct URL
    try {
      const response = await this.httpClient.get(url);
      if (response.data && typeof response.data === 'object' && 
          (response.data.name || response.data.protocolVersion || response.data.provider)) {
        return {
          card: response.data as AgentCard,
          usedLegacyEndpoint: false,
          discoveryUrl: url
        };
      }
    } catch {
      // Continue to well-known endpoint fallback
    }

    // Try new agent-card.json endpoint
    try {
      const wellKnownUrl = this.constructWellKnownUrl(url);
      const response = await this.httpClient.get(wellKnownUrl);
      return {
        card: response.data as AgentCard,
        usedLegacyEndpoint: false,
        discoveryUrl: wellKnownUrl
      };
    } catch {
      // Try legacy agent.json endpoint
      const legacyWellKnownUrl = this.constructLegacyWellKnownUrl(url);
      const response = await this.httpClient.get(legacyWellKnownUrl);
      return {
        card: response.data as AgentCard,
        usedLegacyEndpoint: true,
        discoveryUrl: legacyWellKnownUrl
      };
    }
  }

  private constructWellKnownUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}/.well-known/agent-card.json`;
    } catch {
      return `https://${url}/.well-known/agent-card.json`;
    }
  }

  private constructLegacyWellKnownUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}/.well-known/agent.json`;
    } catch {
      return `https://${url}/.well-known/agent.json`;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      // Additional check for URLs without protocol
      if (url.includes('://') || url.startsWith('www.') || url.includes('.') && !url.includes('\\') && !url.includes('/') && !url.endsWith('.json')) {
        try {
          new URL('https://' + url);
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  }

  private isValidHttpsUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private isPrivateOrLocalUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;
      
      // Check for localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
        return true;
      }
      
      // Check for private IP ranges
      if (this.isPrivateIPAddress(hostname)) {
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  }

  private isPrivateIPAddress(hostname: string): boolean {
    // IPv4 private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
    // IPv4 link-local: 169.254.0.0/16
    const ipv4PrivateRegex = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|169\.254\.)/;
    
    // IPv6 private ranges: fc00::/7, fe80::/10
    const ipv6PrivateRegex = /^(fc|fd|fe[89ab])/i;
    
    if (ipv4PrivateRegex.test(hostname)) {
      return true;
    }
    
    if (ipv6PrivateRegex.test(hostname)) {
      return true;
    }
    
    return false;
  }

  private isVersionCompatible(version: string, required: string): boolean {
    try {
      return semverCompare(version, required) >= 0;
    } catch {
      return false;
    }
  }

  /**
   * Validate transport endpoints by testing connectivity and basic functionality
   */
  private async validateTransportEndpoints(card: AgentCard, options: ValidationOptions): Promise<{
    validations: any[];
    errors: any[];
    warnings: any[];
  }> {
    const validations: any[] = [];
    const errors: any[] = [];
    const warnings: any[] = [];

    this.logger.step('Testing transport endpoints');

    // 1. Test primary endpoint (main URL) - this is REQUIRED so failures are errors
    await this.testEndpointConnectivity(card.url, 'Primary Endpoint', validations, errors, warnings, options, true);

    // 2. Test preferred transport endpoint - this is REQUIRED so failures are errors
    await this.testTransportProtocol(card.url, card.preferredTransport, 'Preferred Transport', validations, errors, warnings, options, true);

    // 3. Test additional interfaces if present - these are OPTIONAL so failures are warnings
    if (card.additionalInterfaces && card.additionalInterfaces.length > 0) {
      for (const iface of card.additionalInterfaces) {
        await this.testEndpointConnectivity(iface.url, `${iface.transport} Interface`, validations, errors, warnings, options, false);
        await this.testTransportProtocol(iface.url, iface.transport, `${iface.transport} Protocol`, validations, errors, warnings, options, false);
      }
    }

    return { validations, errors, warnings };
  }

  /**
   * Test basic HTTP connectivity to an endpoint
   */
  private async testEndpointConnectivity(
    url: string, 
    testName: string, 
    validations: any[], 
    errors: any[], 
    warnings: any[], 
    options: ValidationOptions,
    isPrimary: boolean = false
  ): Promise<void> {
    const timer = this.logger.timer();
    this.logger.debug(`Testing connectivity to ${url}`);

    try {
      const response = await this.httpClient.get(url, { 
        timeout: options.timeout || 10000 
      });
      const duration = timer();

      if (response.status >= 200 && response.status < 300) {
        validations.push({
          id: `endpoint_connectivity_${testName.toLowerCase().replace(/\s+/g, '_')}`,
          name: `${testName} Connectivity`,
          status: 'passed',
          message: `Endpoint accessible (${response.status})`,
          duration,
          details: `HTTP ${response.status} response received in ${duration}ms`
        });
        this.logger.debug(`✓ ${testName} connectivity test passed`, { url, status: response.status, duration });
      } else {
        validations.push({
          id: `endpoint_connectivity_${testName.toLowerCase().replace(/\s+/g, '_')}`,
          name: `${testName} Connectivity`,
          status: 'failed',
          message: `Endpoint returned ${response.status}`,
          duration,
          details: `HTTP ${response.status} response indicates endpoint issues`
        });
        
        // Primary endpoint failures are errors, additional interfaces are warnings
        if (isPrimary) {
          errors.push({
            code: 'PRIMARY_ENDPOINT_HTTP_ERROR',
            message: `Primary endpoint returned HTTP ${response.status}`,
            field: 'url',
            severity: 'error',
            fixable: true
          });
        } else {
          warnings.push({
            code: 'ADDITIONAL_ENDPOINT_HTTP_ERROR',
            message: `${testName} returned HTTP ${response.status}`,
            field: 'additionalInterfaces',
            severity: 'warning',
            fixable: true
          });
        }
        this.logger.debug(`⚠ ${testName} connectivity test warning`, { url, status: response.status, duration });
      }
    } catch (error) {
      const duration = timer();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      validations.push({
        id: `endpoint_connectivity_${testName.toLowerCase().replace(/\s+/g, '_')}`,
        name: `${testName} Connectivity`,
        status: 'failed',
        message: `Endpoint unreachable`,
        duration,
        details: `Connection failed: ${errorMessage}`
      });
      
      // Primary endpoint failures are errors, additional interfaces are warnings
      if (isPrimary) {
        errors.push({
          code: 'PRIMARY_ENDPOINT_UNREACHABLE',
          message: `Primary endpoint is unreachable: ${errorMessage}`,
          field: 'url',
          severity: 'error',
          fixable: true
        });
      } else {
        warnings.push({
          code: 'ADDITIONAL_ENDPOINT_UNREACHABLE',
          message: `${testName} is unreachable: ${errorMessage}`,
          field: 'additionalInterfaces',
          severity: 'warning',
          fixable: true
        });
      }
      
      this.logger.debug(`✗ ${testName} connectivity test failed`, { url, error: errorMessage, duration });
    }
  }

  /**
   * Test transport protocol specific functionality
   */
  private async testTransportProtocol(
    url: string, 
    transport: TransportProtocol, 
    testName: string, 
    validations: any[], 
    errors: any[], 
    warnings: any[], 
    options: ValidationOptions,
    isPrimary: boolean = false
  ): Promise<void> {
    const timer = this.logger.timer();
    this.logger.debug(`Testing ${transport} protocol on ${url}`);

    try {
      switch (transport) {
        case 'JSONRPC': {
          await this.testJsonRpcEndpoint(url, testName, validations, errors, warnings, options);
          break;
        }
        case 'GRPC': {
          await this.testGrpcEndpoint(url, testName, validations, errors, warnings, options);
          break;
        }
        case 'HTTP+JSON': {
          await this.testHttpJsonEndpoint(url, testName, validations, errors, warnings, options);
          break;
        }
        default: {
          const duration = timer();
          validations.push({
            id: `transport_protocol_${testName.toLowerCase().replace(/\s+/g, '_')}`,
            name: `${testName} Protocol Test`,
            status: 'skipped',
            message: `Unknown transport protocol: ${transport}`,
            duration,
            details: `Transport protocol ${transport} is not supported for testing`
          });
        }
      }
    } catch (error) {
      const duration = timer();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      validations.push({
        id: `transport_protocol_${testName.toLowerCase().replace(/\s+/g, '_')}`,
        name: `${testName} Protocol Test`,
        status: 'failed',
        message: `Protocol test failed`,
        duration,
        details: `${transport} protocol test failed: ${errorMessage}`
      });
      
      // Primary transport failures are errors, additional interfaces are warnings
      if (isPrimary) {
        errors.push({
          code: 'PRIMARY_TRANSPORT_PROTOCOL_ERROR',
          message: `Primary transport ${testName} failed: ${errorMessage}`,
          field: 'preferredTransport',
          severity: 'error',
          fixable: true
        });
      } else {
        warnings.push({
          code: 'ADDITIONAL_TRANSPORT_PROTOCOL_ERROR',
          message: `Additional transport ${testName} failed: ${errorMessage}`,
          field: 'additionalInterfaces',
          severity: 'warning',
          fixable: true
        });
      }
    }
  }

  /**
   * Test JSON-RPC 2.0 endpoint
   */
  private async testJsonRpcEndpoint(
    url: string, 
    testName: string, 
    validations: any[], 
    errors: any[], 
    warnings: any[], 
    options: ValidationOptions
  ): Promise<void> {
    const timer = this.logger.timer();
    
    try {
      // Test with a basic JSON-RPC 2.0 request (method discovery)
      const payload = {
        jsonrpc: '2.0',
        method: 'rpc.discover',
        id: 1
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(options.timeout || 10000)
      });

      const duration = timer();
      const contentType = response.headers.get('content-type') || '';

      if (!contentType.includes('application/json')) {
        validations.push({
          id: `jsonrpc_${testName.toLowerCase().replace(/\s+/g, '_')}`,
          name: `${testName} JSON-RPC`,
          status: 'failed',
          message: 'Invalid content-type for JSON-RPC',
          duration,
          details: `Expected application/json, got ${contentType}`
        });
        warnings.push({
          code: 'JSONRPC_INVALID_CONTENT_TYPE',
          message: `JSON-RPC endpoint should return application/json content-type, got ${contentType}`,
          field: 'preferredTransport',
          severity: 'warning',
          fixable: true
        });
        return;
      }

      const responseData = await response.json();
      
      // Check if response follows JSON-RPC 2.0 structure
      if (response.status === 200 && responseData && (responseData.result !== undefined || responseData.error !== undefined)) {
        validations.push({
          id: `jsonrpc_${testName.toLowerCase().replace(/\s+/g, '_')}`,
          name: `${testName} JSON-RPC`,
          status: 'passed',
          message: 'JSON-RPC 2.0 endpoint responding correctly',
          duration,
          details: 'Endpoint accepts JSON-RPC requests and returns valid responses'
        });
      } else if (response.status === 405 || response.status === 404) {
        validations.push({
          id: `jsonrpc_${testName.toLowerCase().replace(/\s+/g, '_')}`,
          name: `${testName} JSON-RPC`,
          status: 'failed',
          message: `JSON-RPC endpoint returned ${response.status}`,
          duration,
          details: 'Method not allowed or not found - endpoint may not support JSON-RPC'
        });
        warnings.push({
          code: 'JSONRPC_METHOD_NOT_SUPPORTED',
          message: `JSON-RPC endpoint returned ${response.status} - may not support JSON-RPC protocol`,
          field: 'preferredTransport',
          severity: 'warning',
          fixable: true
        });
      } else {
        validations.push({
          id: `jsonrpc_${testName.toLowerCase().replace(/\s+/g, '_')}`,
          name: `${testName} JSON-RPC`,
          status: 'passed',
          message: 'JSON-RPC endpoint accessible',
          duration,
          details: `Endpoint responds to JSON-RPC requests (${response.status})`
        });
      }
    } catch (error) {
      const duration = timer();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      validations.push({
        id: `jsonrpc_${testName.toLowerCase().replace(/\s+/g, '_')}`,
        name: `${testName} JSON-RPC`,
        status: 'failed',
        message: 'JSON-RPC endpoint test failed',
        duration,
        details: `Failed to test JSON-RPC endpoint: ${errorMessage}`
      });
      
      warnings.push({
        code: 'JSONRPC_ENDPOINT_ERROR',
        message: `JSON-RPC endpoint test failed: ${errorMessage}`,
        field: 'preferredTransport',
        severity: 'warning',
        fixable: true
      });
    }
  }

  /**
   * Test gRPC endpoint (basic connectivity and port check)
   */
  private async testGrpcEndpoint(
    url: string, 
    testName: string, 
    validations: any[], 
    errors: any[], 
    warnings: any[], 
    options: ValidationOptions
  ): Promise<void> {
    const timer = this.logger.timer();
    
    try {
      // gRPC testing is more complex - for now just test if the endpoint is reachable
      // and check if it looks like a gRPC endpoint
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const portMatch = url.match(/:(\d+)/);
      const port = portMatch ? parseInt(portMatch[1] || '80') : (isHttps ? 443 : 80);
      
      // Try a basic HTTP/2 connection test (gRPC uses HTTP/2)
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/grpc',
          'TE': 'trailers'
        },
        signal: AbortSignal.timeout(options.timeout || 10000)
      });

      const duration = timer();
      
      // gRPC endpoints typically return specific status codes for invalid requests
      if (response.status === 415 || response.status === 400 || response.headers.get('content-type')?.includes('application/grpc')) {
        validations.push({
          id: `grpc_${testName.toLowerCase().replace(/\s+/g, '_')}`,
          name: `${testName} gRPC`,
          status: 'passed',
          message: 'gRPC endpoint detected',
          duration,
          details: `Endpoint responds like a gRPC server (${response.status})`
        });
      } else if (response.status === 404 || response.status === 405) {
        validations.push({
          id: `grpc_${testName.toLowerCase().replace(/\s+/g, '_')}`,
          name: `${testName} gRPC`,
          status: 'failed',
          message: `gRPC endpoint returned ${response.status}`,
          duration,
          details: 'Endpoint may not support gRPC protocol'
        });
        warnings.push({
          code: 'GRPC_ENDPOINT_NOT_FOUND',
          message: `gRPC endpoint returned ${response.status} - may not support gRPC protocol`,
          field: 'additionalInterfaces',
          severity: 'warning',
          fixable: true
        });
      } else {
        validations.push({
          id: `grpc_${testName.toLowerCase().replace(/\s+/g, '_')}`,
          name: `${testName} gRPC`,
          status: 'passed',
          message: 'gRPC endpoint accessible',
          duration,
          details: `Endpoint is reachable on port ${port}`
        });
      }
    } catch (error) {
      const duration = timer();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      validations.push({
        id: `grpc_${testName.toLowerCase().replace(/\s+/g, '_')}`,
        name: `${testName} gRPC`,
        status: 'failed',
        message: 'gRPC endpoint test failed',
        duration,
        details: `Failed to test gRPC endpoint: ${errorMessage}`
      });
      
      warnings.push({
        code: 'GRPC_ENDPOINT_ERROR',
        message: `gRPC endpoint test failed: ${errorMessage}`,
        field: 'additionalInterfaces',
        severity: 'warning',
        fixable: true
      });
    }
  }

  /**
   * Test HTTP+JSON endpoint (REST-like)
   */
  private async testHttpJsonEndpoint(
    url: string, 
    testName: string, 
    validations: any[], 
    errors: any[], 
    warnings: any[], 
    options: ValidationOptions
  ): Promise<void> {
    const timer = this.logger.timer();
    
    try {
      // Test common REST patterns
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(options.timeout || 10000)
      });

      const duration = timer();
      const contentType = response.headers.get('content-type') || '';

      if (response.status === 200 && contentType.includes('application/json')) {
        validations.push({
          id: `http_json_${testName.toLowerCase().replace(/\s+/g, '_')}`,
          name: `${testName} HTTP+JSON`,
          status: 'passed',
          message: 'HTTP+JSON endpoint responding correctly',
          duration,
          details: 'Endpoint returns JSON responses to HTTP requests'
        });
      } else if (response.status === 405) {
        // Method not allowed - try POST
        const postResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({}),
          signal: AbortSignal.timeout(options.timeout || 10000)
        });
        
        const postDuration = timer();
        
        if (postResponse.status < 500) {
          validations.push({
            id: `http_json_${testName.toLowerCase().replace(/\s+/g, '_')}`,
            name: `${testName} HTTP+JSON`,
            status: 'passed',
            message: 'HTTP+JSON endpoint accessible via POST',
            duration: postDuration,
            details: `Endpoint accepts POST requests (${postResponse.status})`
          });
        } else {
          validations.push({
            id: `http_json_${testName.toLowerCase().replace(/\s+/g, '_')}`,
            name: `${testName} HTTP+JSON`,
            status: 'failed',
            message: `HTTP+JSON endpoint error (${postResponse.status})`,
            duration: postDuration,
            details: 'Endpoint returned server error'
          });
        }
      } else {
        validations.push({
          id: `http_json_${testName.toLowerCase().replace(/\s+/g, '_')}`,
          name: `${testName} HTTP+JSON`,
          status: 'passed',
          message: 'HTTP+JSON endpoint accessible',
          duration,
          details: `Endpoint responds to HTTP requests (${response.status})`
        });
      }
    } catch (error) {
      const duration = timer();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      validations.push({
        id: `http_json_${testName.toLowerCase().replace(/\s+/g, '_')}`,
        name: `${testName} HTTP+JSON`,
        status: 'failed',
        message: 'HTTP+JSON endpoint test failed',
        duration,
        details: `Failed to test HTTP+JSON endpoint: ${errorMessage}`
      });
      
      warnings.push({
        code: 'HTTP_JSON_ENDPOINT_ERROR',
        message: `HTTP+JSON endpoint test failed: ${errorMessage}`,
        field: 'preferredTransport',
        severity: 'warning',
        fixable: true
      });
    }
  }

  // Convenience methods
  async validateProgressive(input: AgentCard | string, options: ValidationOptions = {}): Promise<ValidationResult> {
    return this.validate(input, { ...options, strictness: 'progressive' });
  }

  async validateStrict(input: AgentCard | string, options: ValidationOptions = {}): Promise<ValidationResult> {
    return this.validate(input, { ...options, strictness: 'strict' });
  }

  async validateConservative(input: AgentCard | string, options: ValidationOptions = {}): Promise<ValidationResult> {
    return this.validate(input, { ...options, strictness: 'conservative' });
  }

  async validateSchemaOnly(card: AgentCard, options: ValidationOptions = {}): Promise<ValidationResult> {
    return this.validate(card, { ...options, skipDynamic: true });
  }
}