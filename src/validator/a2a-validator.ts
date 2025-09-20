import { AgentCard, ValidationResult, ValidationOptions, HttpClient, VersionMismatch } from '../types';
import { FetchHttpClient } from './http-client';
import { semverCompare, isValidSemver } from '../utils/semver';

/**
 * A2A Validator with URL support and embedded validation logic
 * 
 * This validator combines schema validation, version checking, and HTTP endpoint testing
 * into a single self-contained validator optimized for CLI usage.
 */
export class A2AValidator {
  private httpClient: HttpClient;

  constructor(httpClient?: HttpClient) {
    this.httpClient = httpClient || new FetchHttpClient();
  }

  async validate(
    input: AgentCard | string, 
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    try {
      let agentCard: AgentCard;
      let usedLegacyEndpoint = false;
      let discoveryUrl = '';

      // Determine if input is a URL or local file path
      if (typeof input === 'string') {
        const isUrl = this.isValidUrl(input) || (!input.includes('\\') && !input.includes('/') && !input.endsWith('.json'));
        
        if (isUrl && !options.skipDynamic) {
          // Remote URL - fetch the agent card
          const fetchResult = await this.fetchAgentCard(input);
          agentCard = fetchResult.card;
          usedLegacyEndpoint = fetchResult.usedLegacyEndpoint;
          discoveryUrl = fetchResult.discoveryUrl;
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
      const result = await this.performValidation(agentCard, options);

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

  private async performValidation(card: AgentCard, options: ValidationOptions): Promise<ValidationResult> {
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

    // 3. Additional validations based on detected issues
    this.addAdditionalWarnings(card, warnings);

    // 4. Strictness-specific validations
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

    // Required fields validation
    const requiredFields = ['name', 'description', 'url', 'provider', 'version'];
    
    // A2A v0.3.0 specific required fields
    const v030RequiredFields = ['protocolVersion', 'preferredTransport'];
    
    [...requiredFields, ...v030RequiredFields].forEach(field => {
      if (!this.getNestedValue(card, field)) {
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

    // URL format validation
    if (card.url && !this.isValidUrl(card.url)) {
      errors.push({
        code: 'SCHEMA_VALIDATION_ERROR',
        message: 'url: Invalid URL format',
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

    // Optional URL fields validation
    const urlFields = ['iconUrl', 'documentationUrl', 'termsOfServiceUrl', 'privacyPolicyUrl'];
    urlFields.forEach(field => {
      const value = this.getNestedValue(card, field);
      if (value && !this.isValidUrl(value)) {
        errors.push({
          code: 'SCHEMA_VALIDATION_ERROR',
          message: `${field}: Invalid URL format`,
          field: field,
          severity: 'error',
          fixable: true
        });
      }
    });

    // Skills validation
    if (card.skills) {
      card.skills.forEach((skill, index) => {
        if (!skill.id) {
          errors.push({
            code: 'SCHEMA_VALIDATION_ERROR',
            message: `skills.${index}.id: Required`,
            field: `skills.${index}.id`,
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

    const duration = Date.now() - startTime;
    const success = errors.length === 0;

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

  private isVersionCompatible(version: string, required: string): boolean {
    try {
      return semverCompare(version, required) >= 0;
    } catch {
      return false;
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