# CapiscIO CLI - A2A Protocol Validator

> **Comprehensive validation for AI agent trust and protocol compliance** | Beyond schema validation - test cryptographic authenticity and live protocol functionality.

🌐 **[Learn more about CapiscIO](https://capisc.io)** | **[Download Page](https://capisc.io/downloads)** | **[Web Validator](https://capisc.io/validator)**

[![npm version](https://badge.fury.io/js/capiscio.svg)](https://badge.fury.io/js/capiscio)
[![Downloads](https://img.shields.io/npm/dm/capiscio)](https://www.npmjs.com/package/capiscio)
[![CI](https://github.com/capiscio/capiscio-node/workflows/CI/badge.svg)](https://github.com/capiscio/capiscio-node/actions)
[![Coverage](https://img.shields.io/badge/coverage-70.2%25-green.svg)](https://github.com/capiscio/capiscio-node)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Security](https://img.shields.io/badge/security-audited-brightgreen.svg)](https://github.com/capiscio/capiscio-node/security)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

## Common A2A Integration Challenges

**Agent cards can pass schema validation but fail in production due to real-world integration issues.**

### What Often Goes Wrong:
- **🔌 Endpoint connectivity** - declared URLs return 404 or timeout
- **⚠️ Protocol implementation gaps** - JSONRPC/GRPC errors in production  
- **🔒 Missing cryptographic signatures** - no way to verify agent authenticity
- **📋 Specification compliance** - subtle A2A protocol violations
- **❌ Schema vs reality** - valid JSON but broken functionality

### How CapiscIO Helps:
- **🔒 JWS signature verification** - cryptographically verify agent authenticity
- **🌐 Live endpoint testing** - catch broken protocols before deployment
- **⚡ Zero-dependency validation** - no npm vulnerabilities or Python conflicts
- **🛡️ Comprehensive validation** - trust AND functionality in one command

---

## Quick Start

**💡 Prefer a web interface?** Try our [online validator at capisc.io](https://capisc.io/validator) - no installation required!

### Option 1: Install via NPM (Requires Node.js)
```bash
# Install globally
npm install -g capiscio

# Validate your agent
capiscio validate ./agent-card.json

# Test live endpoints
capiscio validate https://your-agent.com

# Strict validation for production
capiscio validate ./agent-card.json --strict --json
```

### Option 2: Standalone Binary (Advanced)

If you don't want to use Node.js or Python, you can download the standalone Go binary directly from the **capiscio-core** repository. This is the engine that powers the CLI.

**[Download latest binaries from capiscio-core releases](https://github.com/capiscio/capiscio-core/releases)**

| Platform | Architecture | Binary Name |
|----------|-------------|-------------|
| **Linux** | x64 | `capiscio-linux-amd64` |
| **macOS** | Intel | `capiscio-darwin-amd64` |
| **macOS** | Apple Silicon | `capiscio-darwin-arm64` |
| **Windows** | Intel x64 | `capiscio-windows-amd64.exe` |

#### Quick Download Example (Linux):
```bash
# Download the binary
curl -L -o capiscio https://github.com/capiscio/capiscio-core/releases/download/v1.0.2/capiscio-linux-amd64

# Make executable
chmod +x capiscio

# Run
./capiscio validate ./agent-card.json
```

## Key Features

- **🔐 Two-Layer Validation** - ONLY CapiscIO validates both cryptographic trust AND protocol compliance
- **✅ JWS Signature Verification** - Cryptographic validation of agent authenticity (RFC 7515 compliant)
- **🚀 Live Protocol Testing** - Actually tests JSONRPC, GRPC, and REST endpoints (not just schemas)
- **⚡ High Performance** - Powered by a native Go binary for blazing fast validation
- **🛡️ Secure by Default** - Signature verification enabled automatically
- **🔧 CI/CD Ready** - JSON output with proper exit codes for automated pipelines
- **🌐 Smart Discovery** - Finds agent cards automatically with multiple fallbacks
- **💻 Cross-Platform** - npm or standalone binaries

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
| --test-live | Test agent endpoint with real messages |

### Live Agent Testing

The `--test-live` flag tests your agent endpoint with real A2A protocol messages:

```bash
# Test agent endpoint
capiscio validate https://agent.com --test-live

# Test with custom timeout
capiscio validate ./agent-card.json --test-live --timeout 5000

# Full validation for production
capiscio validate https://agent.com --test-live --strict --json
```

**What it validates:**
- ✅ Endpoint connectivity
- ✅ JSONRPC and HTTP+JSON transport protocols  
- ✅ A2A message structure (Message, Task, StatusUpdate, ArtifactUpdate)
- ✅ Response timing metrics

**Exit codes for automation:**
- `0` = Success
- `1` = Schema validation failed
- `2` = Network error (timeout, connection refused, DNS)
- `3` = Protocol violation (invalid A2A response)

**Use cases:**
- CI/CD post-deployment verification
- Cron-based health monitoring
- Pre-production testing
- Third-party agent evaluation
- Multi-environment validation

### Validation Modes

- **Progressive** (default): Balanced validation with warnings for compatibility issues
- **Strict**: Full compliance required, warnings become errors, registry-ready validation

**Registry Ready:** Use `--registry-ready` for strict validation optimized for agent registry deployment.

### Three-Dimensional Scoring

CapiscIO CLI automatically provides detailed quality scoring across three independent dimensions:

```bash
# Scoring is shown by default
capiscio validate agent.json
```

**Three Quality Dimensions:**
- **Spec Compliance (0-100)** - How well does the agent conform to A2A v0.3.0?
- **Trust (0-100)** - How trustworthy and secure is this agent? (includes confidence multiplier)
- **Availability (0-100)** - Is the endpoint operational? (requires `--test-live`)

Each score includes a detailed breakdown showing exactly what contributed to the result.

> **Note:** Legacy single-score output has been replaced by this multi-dimensional system in v2.0.0.

## Why Use CapiscIO CLI?

**Stop Integration Disasters Before They Happen:**

### 🚨 What Breaks When You Don't Validate
- **Compromised agents inject malicious responses** - unsigned cards can't be trusted
- **JSONRPC methods return wrong error codes** - protocol violations cause failures
- **GRPC services are unreachable or misconfigured** - integration breaks silently
- **REST endpoints don't match declared capabilities** - runtime mismatches
- **Tampered agent cards** - man-in-the-middle attacks succeed
- **Production failures cascade** - one bad agent brings down your system

### ✅ CapiscIO Prevents These Failures
- **JWS signature verification** - cryptographically prove agent authenticity  
- **Live endpoint connectivity testing** - catch broken protocols before deployment
- **A2A protocol compliance validation** - prevent specification violations
- **HTTPS-only JWKS security** - tamper-proof key distribution
- **Real connectivity validation** - beyond schema to actual functionality

**The only CLI that validates both cryptographic trust AND protocol compliance.**

## Transport Protocol Testing & Security

Unlike basic schema validators, CapiscIO CLI actually tests your agent endpoints and verifies cryptographic signatures:

- **JSONRPC** - Validates JSON-RPC 2.0 compliance and connectivity
- **GRPC** - Tests gRPC endpoint accessibility
- **REST** - Verifies HTTP+JSON endpoint patterns
- **JWS Signatures** - Cryptographic verification of agent card authenticity (RFC 7515)
- **Consistency** - Ensures equivalent functionality across protocols

Perfect for testing your own agents and evaluating third-party agents before integration.

## Signature Verification (New in v1.2.0)

CapiscIO CLI now includes **secure by default** JWS signature verification for agent cards:

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
    npm install -g capiscio
    capiscio validate ./agent-card.json --json --strict
```

### Using Standalone Binary (Core):
```yaml
# GitHub Actions - No Node.js required
- name: Download and Validate Agent
  run: |
    # Download Core Binary (Linux AMD64)
    curl -L -o capiscio https://github.com/capiscio/capiscio-core/releases/download/v1.0.2/capiscio-linux-amd64
    chmod +x capiscio
    ./capiscio validate ./agent-card.json --json --strict
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

Apache-2.0 © [CapiscIO](https://capisc.io)

---

**Need help?** [Visit capisc.io](https://capisc.io) | [Open an issue](https://github.com/capiscio/capiscio-node/issues) | [Documentation](https://capisc.io/cli) | [Web Validator](https://capisc.io/validator)

**Keywords**: A2A protocol, AI agent validation, agent-card.json validator, agent.json validator, agent-to-agent protocol, LLM agent cards, AI agent discovery, agent configuration validation, transport protocol testing, JSONRPC validation, GRPC testing, REST endpoint validation, agent protocol CLI, AI agent compliance, JWS signature verification, agent card authentication
