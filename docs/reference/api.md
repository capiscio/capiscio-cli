---
title: TypeScript API Reference
description: Programmatic API documentation for the capiscio npm package. A2AValidator class and TypeScript types.
---

# TypeScript API Reference

The `capiscio` package exports a pure TypeScript validation engine for programmatic use.

!!! info "When to Use"
    Use the TypeScript API when you need:
    
    - Runtime validation in Node.js applications
    - Custom error handling and result processing
    - Integration with Express, Fastify, or other frameworks
    - Batch validation workflows
    
    For command-line usage, see the [CLI Reference](./cli.md).

---

## Installation

```bash
npm install capiscio
```

---

## Quick Start

```typescript
import { A2AValidator } from 'capiscio';

const validator = new A2AValidator();

// Validate a local file
const result = await validator.validate('./agent-card.json');

// Validate a URL
const remoteResult = await validator.validate('https://agent.example.com');

// Check results
if (result.success) {
  console.log(`Score: ${result.score}/100`);
} else {
  result.errors.forEach(err => console.error(err.message));
}
```

---

## A2AValidator

The main validation class.

### Constructor

```typescript
constructor(httpClient?: HttpClient)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `httpClient` | `HttpClient` | Optional custom HTTP client for network requests |

### Methods

#### validate()

Main validation method supporting files and URLs.

```typescript
async validate(
  input: AgentCard | string, 
  options?: ValidationOptions
): Promise<ValidationResult>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `AgentCard \| string` | Agent card object, file path, or URL |
| `options` | `ValidationOptions` | Validation configuration |

**Example:**

```typescript
const result = await validator.validate('./agent-card.json', {
  strictness: 'progressive',
  timeout: 10000,
  skipSignatureVerification: false
});
```

#### validateStrict()

Convenience method for strict validation.

```typescript
async validateStrict(
  input: AgentCard | string, 
  options?: ValidationOptions
): Promise<ValidationResult>
```

**Example:**

```typescript
const result = await validator.validateStrict('./agent-card.json');
// Equivalent to: validator.validate(input, { strictness: 'strict' })
```

#### validateProgressive()

Convenience method for progressive validation (default mode).

```typescript
async validateProgressive(
  input: AgentCard | string, 
  options?: ValidationOptions
): Promise<ValidationResult>
```

#### validateConservative()

Convenience method for conservative validation (minimal requirements).

```typescript
async validateConservative(
  input: AgentCard | string, 
  options?: ValidationOptions
): Promise<ValidationResult>
```

#### validateSchemaOnly()

Schema validation without network requests.

```typescript
async validateSchemaOnly(
  card: AgentCard, 
  options?: ValidationOptions
): Promise<ValidationResult>
```

**Example:**

```typescript
import { readFileSync } from 'fs';

const cardJson = JSON.parse(readFileSync('./agent-card.json', 'utf8'));
const result = await validator.validateSchemaOnly(cardJson);
```

---

## Types

### ValidationOptions

```typescript
interface ValidationOptions {
  strictness?: 'strict' | 'progressive' | 'conservative';
  timeout?: number;                    // HTTP timeout in ms (default: 10000)
  skipDynamic?: boolean;               // Skip network requests
  skipSignatureVerification?: boolean; // Skip JWS verification
  verbose?: boolean;                   // Enable detailed logging
  registryReady?: boolean;             // Check registry readiness
  showVersionCompat?: boolean;         // Include version analysis
}
```

### ValidationResult

```typescript
interface ValidationResult {
  success: boolean;           // Overall pass/fail
  score: number;              // 0-100 score
  errors: ValidationError[];  // Blocking issues
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  validations: ValidationCheck[];
  versionInfo?: VersionValidationInfo;
  scoringResult?: ScoringResult;
}
```

### ValidationError

```typescript
interface ValidationError {
  code: string;        // e.g., 'SCHEMA_VALIDATION_ERROR'
  message: string;     // Human-readable description
  field?: string;      // JSON path (e.g., 'skills.0.id')
  severity: 'error';
  fixable?: boolean;   // Can be auto-fixed
}
```

### ValidationWarning

```typescript
interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  severity: 'warning';
  fixable?: boolean;
}
```

### ValidationCheck

```typescript
interface ValidationCheck {
  id: string;                              // e.g., 'schema_validation'
  name: string;                            // e.g., 'Schema Validation'
  status: 'passed' | 'failed' | 'skipped';
  message: string;
  duration?: number;                       // ms
  details?: string;
}
```

### AgentCard

Full A2A v0.3.0 agent card type:

```typescript
interface AgentCard {
  // Required fields
  protocolVersion: string;
  name: string;
  description: string;
  url: string;
  version: string;
  capabilities: AgentCapabilities;
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: AgentSkill[];
  
  // Optional fields
  preferredTransport?: 'JSONRPC' | 'GRPC' | 'HTTP+JSON';
  additionalInterfaces?: AgentInterface[];
  provider?: AgentProvider;
  iconUrl?: string;
  documentationUrl?: string;
  securitySchemes?: Record<string, SecurityScheme>;
  security?: Array<Record<string, string[]>>;
  supportsAuthenticatedExtendedCard?: boolean;
  signatures?: AgentCardSignature[];
  extensions?: AgentExtension[];
}
```

### AgentSkill

```typescript
interface AgentSkill {
  id: string;           // Required, unique
  name: string;         // Required, max 200 chars
  description: string;  // Required, max 2000 chars
  tags: string[];       // Required, at least one
  examples?: string[];
  inputModes?: string[];
  outputModes?: string[];
}
```

### HttpClient

Interface for custom HTTP clients:

```typescript
interface HttpClient {
  get(url: string, options?: RequestOptions): Promise<HttpResponse>;
}

interface RequestOptions {
  timeout?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

interface HttpResponse {
  status: number;
  data: any;
  headers: Record<string, string>;
}
```

---

## Examples

### Express Middleware

```typescript
import express from 'express';
import { A2AValidator } from 'capiscio';

const app = express();
const validator = new A2AValidator();

app.post('/validate', express.json(), async (req, res) => {
  const result = await validator.validate(req.body);
  
  res.json({
    valid: result.success,
    score: result.score,
    errors: result.errors,
    warnings: result.warnings
  });
});
```

### Batch Validation

```typescript
import { A2AValidator } from 'capiscio';
import { glob } from 'glob';

const validator = new A2AValidator();
const files = await glob('./agents/**/*.json');

const results = await Promise.all(
  files.map(async (file) => ({
    file,
    result: await validator.validate(file)
  }))
);

// Summary
const passed = results.filter(r => r.result.success).length;
console.log(`${passed}/${results.length} agents passed validation`);

// Failed agents
results
  .filter(r => !r.result.success)
  .forEach(r => {
    console.log(`❌ ${r.file}:`);
    r.result.errors.forEach(e => console.log(`   ${e.message}`));
  });
```

### Custom HTTP Client

```typescript
import { A2AValidator, HttpClient, HttpResponse } from 'capiscio';

class AuthenticatedClient implements HttpClient {
  constructor(private token: string) {}
  
  async get(url: string, options?: RequestOptions): Promise<HttpResponse> {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        ...options?.headers
      },
      signal: options?.signal
    });
    
    return {
      status: response.status,
      data: await response.json(),
      headers: Object.fromEntries(response.headers)
    };
  }
}

const validator = new A2AValidator(
  new AuthenticatedClient(process.env.API_TOKEN!)
);
```

### Error Code Reference

| Code | Description |
|------|-------------|
| `SCHEMA_VALIDATION_ERROR` | Required field missing or invalid type |
| `VERSION_MISMATCH_ERROR` | Protocol version incompatibility |
| `SIGNATURE_VERIFICATION_FAILED` | JWS signature invalid |
| `PRIMARY_ENDPOINT_UNREACHABLE` | Main URL not responding |
| `TRANSPORT_URL_CONFLICT` | Conflicting transport declarations |
| `JSONRPC_ENDPOINT_ERROR` | JSON-RPC protocol test failed |

---

## Exports

The package exports these items:

```typescript
// Classes
export { A2AValidator } from './validator/a2a-validator';
export { FetchHttpClient } from './validator/http-client';
export { ValidateCommand } from './commands/validate';
export { ConsoleOutput } from './output/console';
export { JsonOutput } from './output/json';

// Types
export * from './types';
```

---

## See Also

- [CLI Reference](./cli.md) - Command-line usage
- [Scoring System](./scoring.md) - Understanding validation scores
- [Programmatic Usage](./programmatic-usage.md) - Integration patterns
