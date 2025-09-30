# Capiscio CLI - A2A Protocol Validator

> **Validator & A2A Protocol Compliance CLI** | The only CLI that actually tests AI agent transport protocols. Validate agent-card.json files, A2A compliance across JSONRPC, GRPC, and REST with live endpoint testing.

🌐 **[Learn more about Capiscio](https://capisc.io)** | **[Download Page](https://capisc.io/downloads)** | **[Web Validator](https://capisc.io/validator)**

[![npm version](https://badge.fury.io/js/capiscio-cli.svg)](https://badge.fury.io/js/capiscio-cli)
[![Downloads](https://img.shields.io/npm/dm/capiscio-cli)](https://www.npmjs.com/package/capiscio-cli)
[![CI](https://github.com/capiscio/capiscio-cli/workflows/CI/badge.svg)](https://github.com/capiscio/capiscio-cli/actions)
[![Coverage](https://img.shields.io/badge/coverage-70.2%25-green.svg)](https://github.com/capiscio/capiscio-cli)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Security](https://img.shields.io/badge/security-audited-brightgreen.svg)](https://github.com/capiscio/capiscio-cli/security)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Quick Start

**💡 Prefer a web interface?** Try our [online validator at capisc.io](https://capisc.io/validator) - no installation required!

### Option 1: Install via NPM (Requires Node.js)
```bash
# Install globally
npm install -g capiscio-cli

# Validate your agent
capiscio validate ./agent-card.json

# Test live endpoints
capiscio validate https://your-agent.com

# Strict validation for production
capiscio validate ./agent-card.json --strict --json
```

### Option 2: Install via pip (Requires Python 3.7+)
```bash
# Install globally
pip install capiscio

# Validate your agent
capiscio validate ./agent-card.json

# Test live endpoints  
capiscio validate https://your-agent.com

# Strict validation for production
capiscio validate ./agent-card.json --strict --json
```

### Option 3: Download Standalone Binary (No Dependencies)

| Platform | Architecture | Download | Size |
|----------|-------------|----------|------|
| **Linux** | x64 | [`capiscio-linux-x64.tar.gz`](https://github.com/capiscio/capiscio-cli/releases/latest/download/capiscio-linux-x64.tar.gz) | ~18.2MB |
| **macOS** | Intel | [`capiscio-darwin-x64.tar.gz`](https://github.com/capiscio/capiscio-cli/releases/latest/download/capiscio-darwin-x64.tar.gz) | ~18.3MB |
| **macOS** | Apple Silicon | [`capiscio-darwin-arm64.tar.gz`](https://github.com/capiscio/capiscio-cli/releases/latest/download/capiscio-darwin-arm64.tar.gz) | ~16.6MB |
| **Windows** | Intel x64 | [`capiscio-win-x64.zip`](https://github.com/capiscio/capiscio-cli/releases/latest/download/capiscio-win-x64.zip) | ~14.7MB |

> **Note:** Windows ARM64 users should install via npm (`npm install -g capiscio-cli`) or pip (`pip install capiscio`) instead.

#### Quick Download Commands:
```bash
# Linux x64
curl -L -o capiscio-linux-x64.tar.gz https://github.com/capiscio/capiscio-cli/releases/latest/download/capiscio-linux-x64.tar.gz
tar -xzf capiscio-linux-x64.tar.gz
chmod +x capiscio

# macOS Intel
curl -L -o capiscio-darwin-x64.tar.gz https://github.com/capiscio/capiscio-cli/releases/latest/download/capiscio-darwin-x64.tar.gz
tar -xzf capiscio-darwin-x64.tar.gz
chmod +x capiscio

# macOS Apple Silicon (M1/M2/M3/M4)
curl -L -o capiscio-darwin-arm64.tar.gz https://github.com/capiscio/capiscio-cli/releases/latest/download/capiscio-darwin-arm64.tar.gz
tar -xzf capiscio-darwin-arm64.tar.gz
chmod +x capiscio

# Windows Intel (PowerShell)
Invoke-WebRequest -Uri "https://github.com/capiscio/capiscio-cli/releases/latest/download/capiscio-win-x64.zip" -OutFile "capiscio-win-x64.zip"
Expand-Archive -Path capiscio-win-x64.zip -DestinationPath .

# Use the binary (all platforms)
./capiscio validate ./agent-card.json
# or .\capiscio.exe validate .\agent-card.json (Windows)
```

## Key Features

- **🚀 Transport Protocol Testing** - Actually tests JSONRPC, GRPC, and REST endpoints
- **🔐 JWS Signature Verification** - Cryptographic validation of agent cards (RFC 7515 compliant)
- **💻 Cross-Platform Binaries** - Native executables for Linux, macOS (Intel & ARM), Windows (Intel & ARM)
- **🔍 Smart Discovery** - Finds agent cards automatically with multiple fallbacks
- **⚡ Three Validation Modes** - Progressive, strict, and conservative
- **🔧 CI/CD Ready** - JSON output with proper exit codes
- **🌐 Live Endpoint Testing** - Validates real connectivity, not just schemas
- **🛡️ Secure by Default** - Signature verification enabled automatically
- **⚡ No Dependencies** - Standalone binaries require no Node.js installation

## Usage

### Basic Commands

```bash
capiscio validate [input] [options]

# Examples
capiscio validate                              # Auto-detect in current directory
capiscio validate ./agent-card.json           # Validate local file (with signatures)
capiscio validate https://agent.com           # Test live agent (with signatures)
capiscio validate ./agent-card.json --skip-signature # Skip signature verification
capiscio validate ./agent-card.json --verbose # Detailed output
capiscio validate ./agent-card.json --registry-ready # Check registry readiness
capiscio validate https://agent.com --errors-only    # Show only problems
capiscio validate ./agent-card.json --show-version   # Version analysis
```

### Key Options

| Option | Description |
|--------|-------------|
| --strict | Strict A2A protocol compliance |
| --json | JSON output for CI/CD |
| --verbose | Detailed validation steps |
| --timeout <ms> | Request timeout (default: 10000) |
| --schema-only | Skip live endpoint testing |
| --skip-signature | Skip JWS signature verification |

### Validation Modes

- **Progressive** (default): Balanced validation with warnings for compatibility issues
- **Strict**: Full compliance required, warnings become errors, registry-ready validation
- **Conservative**: Minimal validation for development and testing environments

**Registry Ready:** Use `--registry-ready` for strict validation optimized for agent registry deployment.

## Why Use Capiscio CLI?

**Catch Integration Issues Before Production:**
- ❌ Schema validators miss broken JSONRPC endpoints  
- ❌ Manual testing doesn't cover all transport protocols
- ❌ Integration failures happen at runtime
- ❌ Unsigned agent cards can't be trusted
- ✅ **Capiscio tests actual connectivity and protocol compliance**
- ✅ **Capiscio verifies cryptographic signatures for authenticity**

**Real Problems This Solves:**
- JSONRPC methods return wrong error codes
- GRPC services are unreachable or misconfigured  
- REST endpoints don't match declared capabilities
- Agent cards validate but agents don't work
- Unsigned or tampered agent cards pose security risks

## Transport Protocol Testing & Security

Unlike basic schema validators, Capiscio CLI actually tests your agent endpoints and verifies cryptographic signatures:

- **JSONRPC** - Validates JSON-RPC 2.0 compliance and connectivity
- **GRPC** - Tests gRPC endpoint accessibility
- **REST** - Verifies HTTP+JSON endpoint patterns
- **JWS Signatures** - Cryptographic verification of agent card authenticity (RFC 7515)
- **Consistency** - Ensures equivalent functionality across protocols

Perfect for testing your own agents and evaluating third-party agents before integration.

## Signature Verification (New in v1.2.0)

Capiscio CLI now includes **secure by default** JWS signature verification for agent cards:

### 🔐 Cryptographic Validation
- **RFC 7515 compliant** JWS (JSON Web Signature) verification
- **JWKS (JSON Web Key Set)** fetching from trusted sources
- **Detached signature** support for agent card authentication
- **HTTPS-only** JWKS endpoints for security

### 🛡️ Secure by Default
```bash
# Signature verification runs automatically
capiscio validate ./agent-card.json

# Opt-out when signatures aren't needed
capiscio validate ./agent-card.json --skip-signature
```

### ✅ Benefits
- **Authenticity** - Verify agent cards haven't been tampered with
- **Trust** - Cryptographically confirm the publisher's identity  
- **Security** - Prevent malicious agent card injection
- **Compliance** - Meet security requirements for production deployments

Signature verification adds minimal overhead while providing crucial security guarantees for agent ecosystems.

## CI/CD Integration

### Using NPM Package:
```yaml
# GitHub Actions
- name: Validate Agent
  run: |
    npm install -g capiscio-cli
    capiscio validate ./agent-card.json --json --strict
```

### Using Standalone Binary:
```yaml
# GitHub Actions - No Node.js required
- name: Download and Validate Agent
  run: |
    curl -L -o capiscio-linux-x64.tar.gz https://github.com/capiscio/capiscio-cli/releases/latest/download/capiscio-linux-x64.tar.gz
    tar -xzf capiscio-linux-x64.tar.gz
    chmod +x capiscio-linux-x64
    ./capiscio-linux-x64 validate ./agent-card.json --json --strict
```

Exit codes: 0 = success, 1 = validation failed

## FAQ

**Q: What is the A2A Protocol?**  
A: The Agent-to-Agent (A2A) protocol v0.3.0 is a standardized specification for AI agent discovery, communication, and interoperability. [Learn more at capisc.io](https://capisc.io).

**Q: How is this different from schema validators?**  
A: We actually test live JSONRPC, GRPC, and REST endpoints with transport protocol validation, not just JSON schema structure. We also verify JWS signatures for cryptographic authenticity.

**Q: Can I validate LLM agent cards?**  
A: Yes! Perfect for AI/LLM developers validating agent configurations and testing third-party agents before integration.

**Q: What file formats are supported?**  
A: Current spec uses `agent-card.json`. We also support legacy `agent.json` files and auto-discover from `/.well-known/agent-card.json` endpoints.

## License

MIT © [Capiscio](https://capisc.io)

---

**Need help?** [Visit capisc.io](https://capisc.io) | [Open an issue](https://github.com/capiscio/capiscio-cli/issues) | [Documentation](https://capisc.io/cli) | [Web Validator](https://capisc.io/validator)

**Keywords**: A2A protocol, AI agent validation, agent-card.json validator, agent.json validator, agent-to-agent protocol, LLM agent cards, AI agent discovery, agent configuration validation, transport protocol testing, JSONRPC validation, GRPC testing, REST endpoint validation, agent protocol CLI, AI agent compliance, JWS signature verification, agent card authentication
