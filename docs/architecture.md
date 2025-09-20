# Architecture Documentation

> Internal architecture and design decisions for Capiscio CLI

This document outlines the internal architecture, design patterns, and technical decisions behind the Capiscio CLI validation system.

## Table of Contents

- [Overview](#overview)
- [Core Components](#core-components)
- [Data Flow](#data-flow)
- [Design Patterns](#design-patterns)
- [Dependency Management](#dependency-management)
- [Performance Considerations](#performance-considerations)
- [Extensibility](#extensibility)

## Overview

The Capiscio CLI is designed as a self-contained, performant validation tool for A2A protocol agent cards. The architecture prioritizes:

- **Zero External Dependencies**: No reliance on external validator services
- **Modularity**: Clean separation of concerns
- **Extensibility**: Easy to add new validation rules
- **Performance**: Efficient validation with minimal overhead
- **Reliability**: Comprehensive error handling and graceful degradation

## Core Components

### Component Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CLI Layer     │    │  Commands       │    │   Output        │
│                 │    │                 │    │                 │
│ • cli.ts        │───▶│ • validate.ts   │───▶│ • console.ts    │
│ • Command       │    │ • ValidateCmd   │    │ • json.ts       │
│   Registration  │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Utilities     │    │   Validator     │    │   HTTP Client   │
│                 │    │                 │    │                 │
│ • file-utils.ts │◀───│ • a2a-validator │───▶│ • http-client   │
│ • semver.ts     │    │   .ts           │    │   .ts           │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Type System                              │
│                                                                 │
│ • AgentCard          • ValidationResult     • HttpClient       │
│ • ValidationOptions  • ValidationError      • CLIOptions       │
│ • TransportProtocol  • ValidationWarning    • And more...      │
└─────────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

#### 1. CLI Layer (`src/cli.ts`)
- Entry point and command registration
- Global error handling
- Version management
- Commander.js integration

#### 2. Command Layer (`src/commands/`)
- Command-specific logic
- Option parsing and validation
- User interaction (spinners, prompts)
- Result formatting coordination

#### 3. Validator Layer (`src/validator/`)
- Core validation logic
- Schema validation
- Version compatibility checking
- Network endpoint testing

#### 4. Output Layer (`src/output/`)
- Result formatting and display
- Console output with colors and styling
- JSON output for CI/CD integration

#### 5. Utility Layer (`src/utils/`)
- File system operations
- Semver utilities
- Helper functions

#### 6. Type Layer (`src/types/`)
- TypeScript type definitions
- Interface contracts
- Type safety enforcement

## Data Flow

### Validation Flow Diagram

```
┌─────────────┐
│   User      │
│   Input     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Command    │
│  Parser     │
└──────┬──────┘
       │
       ▼
┌─────────────┐    ┌─────────────┐
│  Input      │───▶│  File or    │
│  Resolution │    │  URL        │
└──────┬──────┘    │  Detection  │
       │           └─────────────┘
       ▼
┌─────────────┐
│ A2A         │
│ Validator   │
└──────┬──────┘
       │
       ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Schema     │    │  Version    │    │  Network    │
│  Validation │    │  Compat     │    │  Testing    │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
                          ▼
                ┌─────────────┐
                │ Validation  │
                │ Result      │
                └──────┬──────┘
                       │
                       ▼
                ┌─────────────┐
                │ Output      │
                │ Formatter   │
                └──────┬──────┘
                       │
                       ▼
                ┌─────────────┐
                │ Console or  │
                │ JSON Output │
                └─────────────┘
```

### Processing Pipeline

1. **Input Processing**
   - Parse CLI arguments
   - Resolve input type (file/URL/auto-detect)
   - Load agent card data

2. **Validation Pipeline**
   - Schema validation
   - Version compatibility analysis
   - Network endpoint testing (if applicable)
   - Feature detection and warnings

3. **Result Aggregation**
   - Collect errors, warnings, suggestions
   - Calculate validation score
   - Generate timing metrics

4. **Output Generation**
   - Format results for console or JSON
   - Apply styling and colors
   - Display actionable feedback

## Design Patterns

### 1. Strategy Pattern (Validation Modes)

```typescript
// Validation strategies
interface ValidationStrategy {
  validate(card: AgentCard): ValidationResult;
}

class ProgressiveStrategy implements ValidationStrategy {
  validate(card: AgentCard): ValidationResult {
    // Progressive validation logic
  }
}

class StrictStrategy implements ValidationStrategy {
  validate(card: AgentCard): ValidationResult {
    // Strict validation logic
  }
}
```

### 2. Dependency Injection (HTTP Client)

```typescript
class A2AValidator {
  constructor(private httpClient: HttpClient = new FetchHttpClient()) {
    // Allows custom HTTP client injection for testing
  }
}
```

### 3. Factory Pattern (Output Formatters)

```typescript
function createOutputFormatter(format: 'json' | 'console'): OutputFormatter {
  return format === 'json' ? new JsonOutput() : new ConsoleOutput();
}
```

### 4. Command Pattern (CLI Commands)

```typescript
abstract class Command {
  abstract execute(args: string[], options: CLIOptions): Promise<void>;
}

class ValidateCommand extends Command {
  async execute(args: string[], options: CLIOptions): Promise<void> {
    // Validation command implementation
  }
}
```

### 5. Builder Pattern (Validation Options)

```typescript
class ValidationOptionsBuilder {
  private options: ValidationOptions = {};
  
  strictness(level: ValidationStrictness): this {
    this.options.strictness = level;
    return this;
  }
  
  timeout(ms: number): this {
    this.options.timeout = ms;
    return this;
  }
  
  build(): ValidationOptions {
    return { ...this.options };
  }
}
```

## Dependency Management

### Production Dependencies

| Package | Purpose | Justification |
|---------|---------|---------------|
| `commander` | CLI framework | Industry standard, well-maintained |
| `chalk` | Console colors | Enhanced user experience |
| `ora` | Loading spinners | Visual feedback for long operations |
| `inquirer` | Interactive prompts | Future extension capability |
| `glob` | File pattern matching | Auto-detection functionality |

### Zero External Service Dependencies

- **No axios**: Uses native `fetch()` API
- **No semver package**: Custom lightweight implementation
- **No external validators**: Embedded validation logic
- **No cloud services**: Completely self-contained

### Bundle Size Optimization

```bash
# Production bundle analysis
npm run build

# Outputs:
# dist/cli.js     ~27KB (minified)
# dist/index.js   ~26KB (library)
# dist/index.d.ts ~7KB  (types)
```

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**
   ```typescript
   // Only load validation rules when needed
   const loadValidationRules = () => import('./validation-rules');
   ```

2. **Caching**
   ```typescript
   // Cache semver comparisons
   const versionCache = new Map<string, boolean>();
   ```

3. **Early Termination**
   ```typescript
   // Stop validation on critical errors
   if (criticalError) {
     return { success: false, errors: [criticalError] };
   }
   ```

4. **Parallel Processing**
   ```typescript
   // Validate multiple aspects concurrently
   const [schemaResult, versionResult] = await Promise.all([
     validateSchema(card),
     validateVersion(card)
   ]);
   ```

### Memory Management

- Streaming JSON parsing for large files
- Cleanup of HTTP connections
- Garbage collection-friendly patterns

### Performance Benchmarks

| Operation | Average Time | Memory Usage |
|-----------|--------------|---------------|
| Schema validation | 1-10ms | 1-5MB |
| Network request | 50-500ms | 1-2MB |
| File parsing | 1-5ms | 1-3MB |
| Total validation | 100-1000ms | 5-15MB |

## Extensibility

### Adding New Validation Rules

```typescript
// src/validator/rules/custom-rule.ts
export class CustomValidationRule {
  validate(card: AgentCard): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Custom validation logic
    if (customCondition(card)) {
      errors.push({
        code: 'CUSTOM_ERROR',
        message: 'Custom validation failed',
        severity: 'error'
      });
    }
    
    return errors;
  }
}

// Register in validator
validator.addRule(new CustomValidationRule());
```

### Custom Output Formatters

```typescript
// src/output/xml-output.ts
export class XmlOutput implements OutputFormatter {
  display(result: ValidationResult): void {
    const xml = this.convertToXml(result);
    console.log(xml);
  }
  
  private convertToXml(result: ValidationResult): string {
    // XML conversion logic
  }
}
```

### Plugin Architecture (Future)

```typescript
// Future plugin system design
interface ValidationPlugin {
  name: string;
  version: string;
  validate(card: AgentCard, options: ValidationOptions): Promise<PluginResult>;
}

class PluginManager {
  private plugins: ValidationPlugin[] = [];
  
  register(plugin: ValidationPlugin): void {
    this.plugins.push(plugin);
  }
  
  async runPlugins(card: AgentCard): Promise<PluginResult[]> {
    return Promise.all(
      this.plugins.map(plugin => plugin.validate(card, {}))
    );
  }
}
```

### Configuration System (Future)

```typescript
// .capiscio.config.js
export default {
  validation: {
    strictness: 'progressive',
    timeout: 10000,
    rules: {
      'schema-validation': { enabled: true },
      'version-compatibility': { enabled: true },
      'custom-rule': { enabled: false }
    }
  },
  output: {
    format: 'console',
    colors: true,
    verbose: false
  }
};
```

## Testing Architecture

### Test Structure

```
tests/
├── unit/
│   ├── validator.test.ts
│   ├── http-client.test.ts
│   └── utils.test.ts
├── integration/
│   ├── cli.test.ts
│   └── end-to-end.test.ts
└── fixtures/
    ├── valid-agents/
    └── invalid-agents/
```

### Testing Patterns

1. **Unit Tests**: Individual component testing
2. **Integration Tests**: Component interaction testing
3. **E2E Tests**: Full CLI workflow testing
4. **Mock Strategy**: HTTP client mocking for network tests

---

## Maintenance & Evolution

### Version Management

- Semantic versioning for public API
- Internal API versioning for extensions
- Backward compatibility guarantees

### Code Quality

- TypeScript strict mode
- ESLint with custom rules
- Automated testing in CI
- Code coverage requirements

### Performance Monitoring

- Validation timing metrics
- Memory usage tracking
- Bundle size monitoring
- Performance regression testing

This architecture provides a solid foundation for the current CLI while enabling future growth and extensibility.