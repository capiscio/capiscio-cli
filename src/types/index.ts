// A2A Protocol Types - Based on v0.3.0 specification (aligned with official TypeScript types)
export interface AgentCard {
  protocolVersion: string; // REQUIRED per official A2A spec
  name: string;
  description: string;
  url: string;
  preferredTransport?: TransportProtocol; // OPTIONAL per official A2A spec (default: "JSONRPC")
  additionalInterfaces?: AgentInterface[];
  provider?: AgentProvider; // Optional per official spec, but organization required if present
  iconUrl?: string;
  version: string;
  documentationUrl?: string;
  capabilities: AgentCapabilities; // REQUIRED per official A2A specification
  securitySchemes?: Record<string, SecurityScheme>;
  security?: Array<Record<string, string[]>>;
  defaultInputModes: string[]; // REQUIRED per official A2A specification
  defaultOutputModes: string[]; // REQUIRED per official A2A specification
  skills: AgentSkill[]; // REQUIRED per official A2A specification
  supportsAuthenticatedExtendedCard?: boolean;
  signatures?: AgentCardSignature[];
  extensions?: AgentExtension[];
}

export interface AgentProvider {
  organization: string;
  url: string; // REQUIRED per official A2A TypeScript types
}

export interface AgentCapabilities {
  streaming?: boolean;
  pushNotifications?: boolean;
  stateTransitionHistory?: boolean;
}

export interface AgentInterface {
  url: string;
  transport: TransportProtocol;
}

export type TransportProtocol = 'JSONRPC' | 'GRPC' | 'HTTP+JSON';

export interface SecurityScheme {
  type: string;
  scheme?: string;
  bearerFormat?: string;
  openIdConnectUrl?: string;
  flows?: any;
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  tags: string[]; // REQUIRED per official A2A specification
  examples?: string[];
  inputModes?: string[];
  outputModes?: string[];
}

export interface AgentCardSignature {
  protected: string;
  signature: string;
}

export interface AgentExtension {
  name: string;
  version: string;
  description?: string;
}

// Validation Types
export type ValidationStrictness = 'conservative' | 'progressive' | 'strict';

export interface ValidationOptions {
  transport?: TransportProtocol | 'all';
  strictness?: ValidationStrictness;
  a2aVersion?: string;
  timeout?: number;
  compliance?: boolean;
  registryReady?: boolean;
  testMessage?: string;
  skipDynamic?: boolean;
  suggestions?: boolean;
  showVersionCompat?: boolean;
  verbose?: boolean;
  skipSignatureVerification?: boolean;
}

export interface VersionCompatibility {
  detectedVersion: string;
  targetVersion: string;
  compatible: boolean;
  mismatches: VersionMismatch[];
  suggestions: string[];
}

export interface VersionMismatch {
  feature: string;
  requiredVersion: string;
  detectedVersion: string;
  severity: 'error' | 'warning';
  description: string;
}

export interface ValidationResult {
  success: boolean;
  score: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  validations: ValidationCheck[];
  versionInfo?: VersionValidationInfo;
}

export interface VersionValidationInfo {
  detectedVersion: string;
  validatorVersion: string;
  strictness: ValidationStrictness;
  compatibility: VersionCompatibility;
  migrationPath?: string[];
}

export interface ValidationCheck {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  message: string;
  duration?: number;
  details?: string;
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  line?: number;
  severity: 'error';
  fixable?: boolean;
  docsUrl?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  line?: number;
  severity: 'warning';
  fixable?: boolean;
  docsUrl?: string;
}

export interface ValidationSuggestion {
  id: string;
  message: string;
  severity: 'info';
  impact?: string;
  fixable?: boolean;
}

// HTTP Client Types
export interface HttpClient {
  get(url: string, options?: RequestOptions): Promise<HttpResponse>;
}

export interface RequestOptions {
  timeout?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface HttpResponse {
  status: number;
  data: any;
  headers: Record<string, string>;
}

export class HttpError extends Error {
  public status?: number;
  public code?: string;
  public override cause?: unknown;
  
  constructor(
    message: string,
    status?: number,
    code?: string,
    cause?: unknown
  ) {
    super(message);
    this.name = 'HttpError';
    if (status !== undefined) this.status = status;
    if (code !== undefined) this.code = code;
    if (cause !== undefined) this.cause = cause;
  }
}

// CLI-specific types
export interface CLIOptions {
  strict?: boolean;
  progressive?: boolean;
  conservative?: boolean;
  registryReady?: boolean;
  schemaOnly?: boolean;
  skipSignature?: boolean;
  json?: boolean;
  junit?: boolean;
  sarif?: boolean;
  errorsOnly?: boolean;
  watch?: boolean;
  timeout?: string;
  fix?: boolean;
  verbose?: boolean;
  quiet?: boolean;
  showVersion?: boolean;
}