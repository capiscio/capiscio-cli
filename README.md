# Capiscio CLI

> The definitive CLI tool for validating A2A (Agent-to-Agent) protocol agent cards.

[![npm version](https://badge.fury.io/js/capiscio-cli.svg)](https://badge.fury.io/js/capiscio-cli)
[![Node.js CI](https://github.com/capiscio/capiscio-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/capiscio/capiscio-cli/actions/workflows/ci.yml)
## 📞 Support

- 🐛 [Bug Reports](https://github.com/capiscio/capiscio-cli/issues)
- 💬 [Discussions](https://github.com/capiscio/capiscio-cli/discussions)
- 📖 [Documentation](https://capiscio.dev/cli)
- 🔒 [Security Policy](SECURITY.md)

## 📚 Documentation

- **[Validation Process](docs/validation-process.md)** - Exhaustive guide to validation system
- **[API Reference](docs/api-reference.md)** - Programmatic usage documentation
- **[Architecture](docs/architecture.md)** - Internal design and extensibility
- **[Changelog](CHANGELOG.md)** - Version history and release notes
- **[Contributing](CONTRIBUTING.md)** - Development and contribution guidepeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## 🚀 Quick Start

```bash
# Install globally
npm install -g capiscio-cli

# Validate an agent card
capiscio validate https://your-agent.com/.well-known/agent.json

# Validate a local file
capiscio validate ./agent.json

# Validate with specific options
capiscio validate ./agent.json --strict --registry-ready
```

## 📥 Installation

### Global Installation (Recommended)

```bash
npm install -g capiscio-cli
```

### Local Installation

```bash
npm install capiscio-cli
npx capiscio validate ./agent.json
```

### Requirements

- Node.js 16+ 
- npm 7+

## 🎯 Features

- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Multiple Input Sources**: URLs, local files, or auto-detection
- **Flexible Validation Modes**: Progressive, strict, and conservative
- **Rich Output**: Beautiful terminal output or JSON for CI/CD
- **Schema Validation**: Comprehensive A2A protocol schema checking
- **Endpoint Testing**: Optional HTTP endpoint validation
- **Registry Readiness**: Deployment readiness checks
- **Zero Dependencies**: Self-contained with no external service dependencies

## 📖 Usage

### Basic Validation

```bash
# Validate from URL (looks for .well-known/agent.json)
capiscio validate https://your-agent.com

# Validate specific endpoint
capiscio validate https://your-agent.com/.well-known/agent.json

# Validate local file
capiscio validate ./agent.json

# Auto-detect in current directory
capiscio validate
```

### Validation Modes

```bash
# Progressive mode (default) - balanced validation
capiscio validate ./agent.json --progressive

# Strict mode - strict A2A protocol compliance
capiscio validate ./agent.json --strict

# Conservative mode - minimal requirements only
capiscio validate ./agent.json --conservative
```

### Output Formats

```bash
# Human-readable output (default)
capiscio validate ./agent.json

# JSON output for CI/CD integration
capiscio validate ./agent.json --json

# Show only errors and warnings
capiscio validate ./agent.json --errors-only
```

### Advanced Options

```bash
# Schema validation only (skip endpoint testing)
capiscio validate ./agent.json --schema-only

# Check registry deployment readiness
capiscio validate ./agent.json --registry-ready

# Custom timeout for HTTP requests
capiscio validate https://agent.com --timeout 15000

# Show detailed version compatibility analysis
capiscio validate ./agent.json --show-version
```

## 🔧 Command Reference

### `capiscio validate [input]`

Validates an A2A agent card from various sources.

#### Arguments

- `input` - Agent URL, file path, or omit for auto-detection

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--strict` | Enable strict validation mode | `false` |
| `--progressive` | Enable progressive validation mode | `true` |
| `--conservative` | Enable conservative validation mode | `false` |
| `--registry-ready` | Check registry deployment readiness | `false` |
| `--schema-only` | Validate schema only, skip endpoint testing | `false` |
| `--json` | Output results in JSON format | `false` |
| `--errors-only` | Show only errors and warnings | `false` |
| `--timeout <ms>` | Request timeout in milliseconds | `10000` |
| `--show-version` | Display detailed version compatibility analysis | `false` |

## 📊 Output Examples

### Successful Validation

```
✅ A2A AGENT VALIDATION PASSED
Agent: https://api.example.com/.well-known/agent.json
Score: 100/100
Version: 0.3.0 (Strictness: progressive)

🔍 VALIDATION SUMMARY:
  📊 3 checks performed: 3 passed, 0 failed, 0 warnings
  ⏱️  Completed in 245ms

🔍 VALIDATIONS PERFORMED:
✅ Schema Validation
   Agent card structure is valid
   Duration: 12ms
✅ Endpoint Connectivity
   All endpoints are accessible and responding
   Duration: 195ms
✅ A2A v0.3.0 Features
   All v0.3.0 features are properly configured

🏆 Perfect! Your agent passes all validations.
🚀 Your agent is ready for deployment!
```

### Failed Validation

```
❌ A2A AGENT VALIDATION FAILED
Agent: ./agent.json
Score: 65/100
Version: 0.3.0 (Strictness: progressive)

🔍 VALIDATION SUMMARY:
  📊 3 checks performed: 2 passed, 1 failed, 1 warnings
  ⏱️  Completed in 89ms

🔍 VALIDATIONS PERFORMED:
✅ Schema Validation
   Agent card structure is valid
   Duration: 8ms
❌ Endpoint Connectivity
   Some endpoints are not accessible
   Duration: 78ms
⚠️  Security Configuration
   Security settings could be improved

🔍 ERRORS FOUND (2):
❌ ENDPOINT_UNREACHABLE: Primary endpoint not accessible
   URL: https://api.example.com/v1
   Status: Connection timeout after 10000ms

❌ MISSING_SECURITY_SCHEME: No security scheme defined
   Field: securitySchemes
   Recommendation: Add authentication configuration

⚠️  WARNINGS FOUND (1):
⚠️  DEPRECATED_FEATURE: Using deprecated authentication format
   Field: authentication.type
   Recommendation: Migrate to securitySchemes format

💻 NEXT STEPS:
1. Fix the errors listed above
2. Address the warnings for better compliance
3. Re-run validation to confirm fixes
```

### JSON Output

```json
{
  "success": true,
  "score": 100,
  "errors": [],
  "warnings": [],
  "suggestions": [],
  "validations": [
    {
      "id": "schema_validation",
      "name": "Schema Validation", 
      "status": "passed",
      "message": "Agent card conforms to A2A v0.3.0 schema",
      "duration": 12,
      "details": "Agent card structure is valid"
    }
  ],
  "versionInfo": {
    "detectedVersion": "0.3.0",
    "validatorVersion": "0.3.0",
    "strictness": "progressive",
    "compatibility": {
      "compatible": true,
      "mismatches": [],
      "suggestions": []
    }
  }
}
```

## 🔍 Validation Modes

### Progressive Mode (Default)

Balanced validation that enforces core A2A protocol requirements while being permissive of emerging features.

- ✅ Schema compliance required
- ✅ Endpoint connectivity testing
- ✅ Basic security validation
- ⚠️  Warnings for deprecated features
- 💡 Suggestions for best practices

### Strict Mode

Rigorous validation for production-ready agents.

- ✅ Full A2A protocol compliance
- ✅ All endpoints must be accessible
- ✅ Security schemes required
- ✅ Complete metadata required
- ❌ No tolerance for deprecated features

### Conservative Mode

Minimal validation for development and testing.

- ✅ Basic schema structure
- ⚠️  Optional endpoint testing
- ⚠️  Permissive security requirements
- 💡 Focus on core functionality

## 🔗 Integration

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Validate A2A Agent Card
  run: |
    npm install -g capiscio-cli
    capiscio validate ./agent.json --json > validation-results.json
    
- name: Check validation results
  run: |
    if [ $(cat validation-results.json | jq '.success') == "false" ]; then
      echo "Agent validation failed"
      cat validation-results.json | jq '.errors'
      exit 1
    fi
```

### Programmatic Usage

```typescript
import { A2AValidator } from 'capiscio-cli';

const validator = new A2AValidator();
const result = await validator.validate('./agent.json', {
  strictness: 'progressive',
  skipDynamic: true
});

if (result.success) {
  console.log(`Validation passed with score: ${result.score}/100`);
} else {
  console.error('Validation failed:', result.errors);
}
```

## 🛠️ Development

### Setup

```bash
git clone https://github.com/capiscio/capiscio-cli.git
cd capiscio-cli
npm install
```

### Scripts

```bash
# Build the CLI
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Type check
npm run type-check

# Development build with watch
npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode  
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📄 License

MIT © [Capiscio](https://github.com/capiscio)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

- 🐛 [Bug Reports](https://github.com/capiscio/capiscio-cli/issues)
- 💬 [Discussions](https://github.com/capiscio/capiscio-cli/discussions)
- 📖 [Documentation](https://capisc.io/cli)

---

Built with ❤️ by the [Capiscio](https://capisc.io) team.