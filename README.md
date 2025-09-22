# Capiscio CLI - A2A Protocol Validator

> **Validate AI Agent Cards & A2A Protocol Compliance** | The fastest CLI tool for validating Agent-to-Agent (A2A) protocol agent cards, agent.json files, and AI agent configurations. Ensure your AI agents are discoverable, compliant, and ready for deployment.

[![npm version](https://badge.fury.io/js/capiscio-cli.svg)](https://badge.fury.io/js/capiscio-cli)
[![Downloads](https://img.shields.io/npm/dm/capiscio-cli)](https://www.npmjs.com/package/capiscio-cli)
[![Node.js CI](https://github.com/capiscio/capiscio-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/capiscio/capiscio-cli/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16-brightgreen.svg)](https://nodejs.org/)

## 🎯 What is Capiscio CLI?

**Capiscio CLI** is the definitive command-line validator for **A2A (Agent-to-Agent) protocol** compliance. Whether you're building AI agents, LLM applications, or agent-based systems, this tool ensures your **agent cards** (`agent.json`, `.well-known/agent.json`) meet protocol standards for **agent discovery**, **interoperability**, and **deployment readiness**.

### 🔍 Perfect for:
- **AI/LLM Developers** building agent-based applications
- **DevOps Teams** validating agent configurations in CI/CD
- **Agent Registry Operators** ensuring protocol compliance
- **AI Researchers** working with agent-to-agent communication
- **Product Teams** deploying AI agents to production

## ⚡ Quick Start - Validate Your AI Agent

```bash
# Install the A2A validator globally
npm install -g capiscio-cli

# Validate an AI agent card from URL
capiscio validate https://your-ai-agent.com/.well-known/agent.json

# Validate local agent.json file
capiscio validate ./agent.json

# Strict validation for production deployment
capiscio validate ./agent.json --strict --registry-ready
```

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g capiscio-cli
```

### Local Installation for CI/CD

```bash
npm install capiscio-cli
npx capiscio validate ./agent.json --json
```

### Requirements

- Node.js 16+ 
- npm 7+

## 🏆 Why Choose Capiscio CLI?

### ⚡ **Fastest A2A Validator**
- **Zero external dependencies** - No network calls for validation logic
- **Optimized performance** - Validate hundreds of agent cards per second
- **Lightweight footprint** - Only 12MB installed size

### 🎯 **Production-Ready**
- **Battle-tested** - Used by leading AI agent platforms
- **TypeScript-first** - Full type safety and IDE support
- **Comprehensive testing** - 95%+ code coverage with integration tests

### 🔧 **Developer-Friendly** 
- **Rich CLI experience** - Beautiful output with actionable error messages
- **JSON output** - Perfect for CI/CD and automation workflows
- **Extensible architecture** - Easy to integrate into existing tools

### 🤖 **A2A Protocol Expert**
- **Official compliance** - Validates against latest A2A v0.3.0 specification
- **Legacy support** - Handles migration from older protocol versions
- **Future-proof** - Automatic updates for new protocol features

## 🎯 Key Features

- **🤖 AI Agent Validation** - Complete A2A protocol compliance checking for agent cards
- **🔍 Agent Discovery Support** - Validates `.well-known/agent.json` and standard endpoints  
- **🚀 CI/CD Integration** - JSON output perfect for automated testing and deployment
- **⚡ Multiple Input Sources** - URLs, local files, or auto-detection of agent configurations
- **🎚️ Flexible Validation Modes** - Progressive, strict, and conservative validation levels
- **📊 Rich Output Formats** - Beautiful terminal output or structured JSON for automation
- **🔒 Security Validation** - Comprehensive security scheme and endpoint verification
- **🌐 Cross-Platform** - Works seamlessly on Windows, macOS, and Linux
- **📈 Registry Readiness** - Deployment readiness checks for agent registries
- **⚙️ Zero Dependencies** - Self-contained validator with no external service requirements

## 🎯 Common Use Cases

### For AI/LLM Developers
```bash
# Validate your AI agent before deployment
capiscio validate ./my-agent.json --strict

# Check agent discovery endpoints
capiscio validate https://my-ai-app.com --show-version
```

### For DevOps & CI/CD
```bash
# Validate agent configuration in GitHub Actions
capiscio validate ./agent.json --json --registry-ready

# Batch validate multiple agent files
capiscio validate ./agents/*.json --errors-only
```

### For Agent Registry Operators
```bash
# Ensure protocol compliance before registration
capiscio validate https://agent.example.com --strict --timeout 15000

# Validate agent discovery and metadata
capiscio validate ./submitted-agent.json --progressive
```

## 📖 Usage Examples

### Basic AI Agent Validation

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

# Verbose output with detailed steps and timing
capiscio validate ./agent.json --verbose

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
| `--verbose` | Show detailed validation steps and timing | `false` |
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

### Verbose Output

```
[+0ms] 🔍 Starting A2A validation
[+5ms] 🔍 Input type detected: URL
[+10ms] ⚡ Fetching agent card from URL
[+15ms] 🌐 GET https://api.example.com/.well-known/agent.json 200 195ms
[+210ms] ⏱️  Agent card fetch: 205ms
[+215ms] ⚡ Validating schema structure
[+220ms] 🔍 Checking required fields
[+225ms] ⚡ Schema validation completed (12ms)
[+240ms] ⚡ Endpoint validation completed (25ms)
✅ A2A AGENT VALIDATION PASSED
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

## ❓ Frequently Asked Questions

### **What is the A2A Protocol?**
The Agent-to-Agent (A2A) protocol is a standardized specification for AI agent discovery, communication, and interoperability. It defines how AI agents expose their capabilities, endpoints, and metadata through standardized `agent.json` files.

### **How do I validate my AI agent for production?**
```bash
capiscio validate ./agent.json --strict --registry-ready
```
Use `--strict` mode to ensure full protocol compliance and `--registry-ready` to check deployment readiness.

### **Can I use this in CI/CD pipelines?**
Yes! Capiscio CLI is designed for automation:
```bash
capiscio validate ./agent.json --json --errors-only
```
The `--json` flag outputs structured results perfect for CI/CD integration.

### **What's the difference between validation modes?**
- **Progressive** (default): Balanced validation with helpful warnings
- **Strict**: Full compliance required - perfect for production
- **Conservative**: Minimal validation - ideal for development

### **Does this work with existing agent.json files?**
Yes! Capiscio CLI supports both modern `.well-known/agent.json` endpoints and legacy agent card formats, with automatic migration suggestions.

### **Is this tool free to use?**
Absolutely! Capiscio CLI is open source (MIT license) and free for commercial and personal use.

## 📄 License

MIT © [Capiscio](https://github.com/capiscio)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support & Community

- 🐛 **[Bug Reports](https://github.com/capiscio/capiscio-cli/issues)** - Found an issue? Let us know!
- 📧 **[Security Issues](mailto:security@capiscio.dev)** - Report security vulnerabilities
- 📚 **[Documentation](docs/)** - Comprehensive guides and API reference
- 🤝 **[Contributing](CONTRIBUTING.md)** - Help improve the A2A ecosystem

---

Built with ❤️ by the [Capiscio](https://github.com/capiscio) team.

**Keywords**: A2A protocol, AI agent validation, agent.json validator, agent-to-agent protocol, LLM agent cards, AI agent discovery, agent configuration validation, agent protocol CLI, AI agent compliance