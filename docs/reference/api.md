---
title: API Reference - CapiscIO CLI Documentation
description: Programmatic API documentation for CapiscIO CLI including A2AValidator class, validation methods, and TypeScript interfaces.
keywords: CapiscIO CLI API, A2AValidator, validation methods, TypeScript, programmatic usage, npm package
---

# API Reference

> Programmatic usage documentation for CapiscIO CLI

This document provides comprehensive API documentation for using CapiscIO CLI programmatically.

## Table of Contents

- [Installation](#installation)
- [Core Classes](#core-classes)
- [Types & Interfaces](#types-interfaces)
- [Validation Options](#validation-options)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Installation

```bash
npm install capiscio-cli
```

## Core Classes

### A2AValidator

The main validation class for A2A agent cards.

```typescript
import { A2AValidator } from 'capiscio-cli';

const validator = new A2AValidator();
```

#### Constructor

```typescript
constructor(httpClient?: HttpClient)
```

**Parameters:**
- `httpClient` (optional): Custom HTTP client implementation

#### Methods

##### `validate(input, options?): Promise<ValidationResult>`

Main validation method that supports both files and URLs.

```typescript
const result = await validator.validate('./agent.json', {
  strictness: 'progressive',
  timeout: 10000
});
```

**Parameters:**
- `input`: `AgentCard | string` - Agent card object or URL/file path
- `options`: `ValidationOptions` - Validation configuration

**Returns:** `Promise<ValidationResult>`

##### `validateProgressive(input, options?): Promise<ValidationResult>`

Convenience method for progressive validation.

```typescript
const result = await validator.validateProgressive('./agent.json');
```

##### `validateStrict(input, options?): Promise<ValidationResult>`

Convenience method for strict validation.

```typescript
const result = await validator.validateStrict('./agent.json');
```

##### `validateConservative(input, options?): Promise<ValidationResult>`

Convenience method for conservative validation.

```typescript
const result = await validator.validateConservative('./agent.json');
```

##### `validateSchemaOnly(card, options?): Promise<ValidationResult>`

Schema-only validation (no network calls).

```typescript
const result = await validator.validateSchemaOnly(agentCardObject);
```

### FetchHttpClient

Default HTTP client implementation using native fetch API.

```typescript
import { FetchHttpClient } from 'capiscio-cli';

const httpClient = new FetchHttpClient();
const validator = new A2AValidator(httpClient);
```

#### Methods

##### `get(url, options?): Promise<HttpResponse>`

Performs HTTP GET request.

```typescript
const response = await httpClient.get('https://example.com/agent.json', {
  timeout: 5000,
  headers: { 'Authorization': 'Bearer token' }
});
```

## Types & Interfaces

### AgentCard

```typescript
interface AgentCard {
  protocolVersion: string;
  name: string;
  description: string;
  url: string;
  preferredTransport: TransportProtocol;
  additionalInterfaces?: AgentInterface[];
  provider: AgentProvider;
  iconUrl?: string;
  version: string;
  documentationUrl?: string;
  capabilities?: AgentCapabilities;
  securitySchemes?: Record<string, SecurityScheme>;
  security?: Array<Record<string, string[]>>;
  defaultInputModes?: string[];
  defaultOutputModes?: string[];
  skills?: AgentSkill[];
  supportsAuthenticatedExtendedCard?: boolean;
  signatures?: AgentCardSignature[];
  extensions?: AgentExtension[];
}
```

### ValidationResult

```typescript
interface ValidationResult {
  success: boolean;
  score: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  validations: ValidationCheck[];
  versionInfo?: VersionInfo;
}
```

### ValidationOptions

```typescript
interface ValidationOptions {
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
}
```

### ValidationStrictness

```typescript
type ValidationStrictness = 'strict' | 'progressive' | 'conservative';
```

### TransportProtocol

```typescript
type TransportProtocol = 'JSONRPC' | 'GRPC' | 'HTTP+JSON';
```

### ValidationError

```typescript
interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'error';
  fixable?: boolean;
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

### ValidationSuggestion

```typescript
interface ValidationSuggestion {
  id: string;
  message: string;
  severity: 'info';
  impact?: string;
  fixable?: boolean;
}
```

### ValidationCheck

```typescript
interface ValidationCheck {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  message: string;
  duration?: number;
  details?: string;
}
```

### HttpClient Interface

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

## Validation Options

### Strictness Levels

| Level | Description | Use Case |
|-------|-------------|----------|
| `strict` | Full compliance, zero tolerance | Production deployment |
| `progressive` | Balanced validation with warnings | Development, CI/CD |
| `conservative` | Minimal requirements only | Early development |

### Common Options

```typescript
const options: ValidationOptions = {
  strictness: 'progressive',    // Validation level
  timeout: 10000,              // HTTP timeout in ms
  skipDynamic: false,          // Skip network calls
  registryReady: false,        // Registry deployment checks
  showVersionCompat: true      // Detailed version analysis
};
```

## Error Handling

### Error Types

```typescript
// Validation errors
if (!result.success) {
  result.errors.forEach(error => {
    console.error(`${error.code}: ${error.message}`);
    if (error.field) {
      console.error(`Field: ${error.field}`);
    }
  });
}

// HTTP errors
try {
  const result = await validator.validate('https://invalid-url.com');
} catch (error) {
  if (error instanceof HttpError) {
    console.error(`HTTP ${error.status}: ${error.message}`);
  }
}
```

### Error Codes

- `SCHEMA_VALIDATION_ERROR`: Schema validation failed
- `VERSION_MISMATCH_ERROR`: Version compatibility issues
- `VALIDATION_FAILED`: General validation failure
- `ENDPOINT_UNREACHABLE`: Network connectivity issues
- `NOT_FOUND`: Agent card not found
- `TIMEOUT`: Request timeout

## Examples

### Basic Validation

```typescript
import { A2AValidator } from 'capiscio-cli';

const validator = new A2AValidator();

// Validate local file
const result = await validator.validate('./agent.json');
console.log(`Validation ${result.success ? 'passed' : 'failed'}`);
console.log(`Score: ${result.score}/100`);

// Validate URL
const urlResult = await validator.validate('https://api.example.com');
if (!urlResult.success) {
  urlResult.errors.forEach(error => {
    console.error(`Error: ${error.message}`);
  });
}
```

### Strict Validation for Production

```typescript
const validator = new A2AValidator();

const result = await validator.validateStrict('./agent.json', {
  registryReady: true,
  timeout: 15000
});

if (result.success) {
  console.log('✅ Agent ready for production deployment!');
} else {
  console.log('❌ Agent failed production validation:');
  result.errors.forEach(error => {
    console.log(`  • ${error.message}`);
  });
  process.exit(1);
}
```

### Schema-Only Validation

```typescript
const validator = new A2AValidator();
const agentCard = JSON.parse(fs.readFileSync('./agent.json', 'utf8'));

const result = await validator.validateSchemaOnly(agentCard);

if (result.success) {
  console.log('Schema validation passed');
} else {
  console.log('Schema issues found:');
  result.errors.forEach(error => {
    console.log(`  ${error.field}: ${error.message}`);
  });
}
```

### Custom HTTP Client

```typescript
class CustomHttpClient implements HttpClient {
  async get(url: string, options?: RequestOptions): Promise<HttpResponse> {
    // Custom implementation with authentication, retries, etc.
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + process.env.API_TOKEN,
        ...options?.headers
      }
    });
    
    return {
      status: response.status,
      data: await response.json(),
      headers: Object.fromEntries(response.headers.entries())
    };
  }
}

const validator = new A2AValidator(new CustomHttpClient());
const result = await validator.validate('https://protected-api.example.com');
```

### CI/CD Integration

```typescript
// ci-validation.js
import { A2AValidator } from 'capiscio-cli';

const validator = new A2AValidator();

const result = await validator.validate('./dist/agent.json', {
  strictness: 'progressive',
  skipDynamic: true  // No network calls in CI
});

// Output for CI systems
console.log(JSON.stringify({
  success: result.success,
  score: result.score,
  errors: result.errors.length,
  warnings: result.warnings.length
}, null, 2));

process.exit(result.success ? 0 : 1);
```

### Batch Validation

```typescript
import { A2AValidator } from 'capiscio-cli';
import { glob } from 'glob';

const validator = new A2AValidator();
const agentFiles = await glob('./agents/**/*.json');

const results = await Promise.all(
  agentFiles.map(async (file) => {
    const result = await validator.validate(file);
    return {
      file,
      success: result.success,
      score: result.score,
      errors: result.errors.length
    };
  })
);

// Report summary
const passed = results.filter(r => r.success).length;
const total = results.length;
console.log(`Validation Summary: ${passed}/${total} agents passed`);

// Report failures
results.filter(r => !r.success).forEach(result => {
  console.log(`❌ ${result.file}: ${result.errors} errors`);
});
```

---

## See Also

- **[Validation Process](../../concepts/validation.md)** - Detailed validation logic
- **[Scoring System](../../concepts/scoring.md)** - How scores are calculated
- **[Architecture](./architecture.md)** - Internal implementation details
