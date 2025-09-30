# Capiscio CLI - A2A Protocol Validator

> **Validator & A2A Protocol Compliance CLI** | The only CLI that actually tests AI agent transport protocols. Validate agent-card.json files, A2A compliance across JSONRPC, GRPC, and REST with live endpoint testing.

🌐 **[Learn more about Capiscio](https://capisc.io)** | **[Download Page](https://capisc.io/downloads)** | **[Web Validator](https://capisc.io/validator)**

[![PyPI version](https://badge.fury.io/py/capiscio.svg)](https://badge.fury.io/py/capiscio)
[![Downloads](https://img.shields.io/pypi/dm/capiscio)](https://pypi.org/project/capiscio/)
[![Python](https://img.shields.io/badge/python-3.7+-blue.svg)](https://python.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/capiscio/capiscio-cli/blob/main/LICENSE)
[![Security](https://img.shields.io/badge/security-JWS%20verified-green.svg)](https://capisc.io)
[![A2A Protocol](https://img.shields.io/badge/A2A-v0.3.0-purple.svg)](https://capisc.io)

## Installation

```bash
pip install capiscio
```

**Zero dependencies required** - This package contains pre-built native binaries that work without Python runtime dependencies.

## Quick Start

**💡 Prefer a web interface?** Try our [online validator at capisc.io](https://capisc.io/validator) - no installation required!

```bash
# Validate your agent (with signature verification)
capiscio validate ./agent-card.json

# Test live endpoints with cryptographic verification  
capiscio validate https://your-agent.com

# Strict validation for production deployment
capiscio validate ./agent-card.json --strict --json

# Skip signature verification when not needed
capiscio validate ./agent-card.json --skip-signature
```

## Security & Trust 🔐

**Industry-grade cryptographic validation:**
- ✅ **RFC 7515 compliant** JWS signature verification
- ✅ **HTTPS-only** JWKS endpoint fetching
- ✅ **Secure by default** - signatures checked automatically
- ✅ **Zero trust** - verify before you trust any agent card
- ✅ **Production ready** - meets enterprise security standards

**Why signature verification matters:**
- **Prevent tampering** - Detect modified or malicious agent cards
- **Establish authenticity** - Cryptographically verify publisher identity
- **Enable trust networks** - Build secure agent ecosystems
- **Regulatory compliance** - Meet security audit requirements

## Key Features

- **🚀 Transport Protocol Testing** - Actually tests JSONRPC, GRPC, and REST endpoints
- **🔐 JWS Signature Verification** - Cryptographic validation of agent cards (RFC 7515 compliant)
- **💻 Native Binaries** - No Node.js or runtime dependencies required
- **🔍 Smart Discovery** - Finds agent cards automatically with multiple fallbacks
- **⚡ Three Validation Modes** - Progressive, strict, and conservative
- **🔧 CI/CD Ready** - JSON output with proper exit codes
- **🌐 Live Endpoint Testing** - Validates real connectivity, not just schemas
- **🛡️ Secure by Default** - Signature verification enabled automatically

## Usage Examples

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
| --registry-ready | Registry deployment validation |

## Signature Verification (New in v1.2.0)

**Secure by default** JWS signature verification for agent cards:

### 🔐 Cryptographic Validation
- **RFC 7515 compliant** JWS (JSON Web Signature) verification
- **JWKS (JSON Web Key Set)** fetching from trusted sources
- **Detached signature** support for agent card authentication
- **HTTPS-only** JWKS endpoints for security

### 🛡️ Security Benefits
- **Authenticity** - Verify agent cards haven't been tampered with
- **Trust** - Cryptographically confirm the publisher's identity  
- **Security** - Prevent malicious agent card injection
- **Compliance** - Meet security requirements for production deployments

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

## Transport Protocol Testing

Unlike basic schema validators, Capiscio CLI actually tests your agent endpoints:

- **JSONRPC** - Validates JSON-RPC 2.0 compliance and connectivity
- **GRPC** - Tests gRPC endpoint accessibility
- **REST** - Verifies HTTP+JSON endpoint patterns
- **Consistency** - Ensures equivalent functionality across protocols

Perfect for testing your own agents and evaluating third-party agents before integration.

## CI/CD Integration

### GitHub Actions Example:
```yaml
- name: Install and Validate Agent
  run: |
    pip install capiscio
    capiscio validate ./agent-card.json --json --strict
```

### Docker Example:
```dockerfile
RUN pip install capiscio
COPY agent-card.json .
RUN capiscio validate ./agent-card.json --strict
```

Exit codes: 0 = success, 1 = validation failed

## Platform Support

This package contains pre-built binaries for multiple platforms:

- **Linux**: x86_64, ARM64
- **macOS**: Intel (x64), Apple Silicon (ARM64) 
- **Windows**: x64 (ARM64 available via [direct download](https://capisc.io/downloads))
- **Python**: 3.7+ (no runtime dependencies required)

The Python wrapper automatically detects your platform and runs the appropriate native binary.

## FAQ

**Q: What is the A2A Protocol?**  
A: The Agent-to-Agent (A2A) protocol v0.3.0 is a standardized specification for AI agent discovery, communication, and interoperability. [Learn more at capisc.io](https://capisc.io).

**Q: How is this different from schema validators?**  
A: We actually test live JSONRPC, GRPC, and REST endpoints with transport protocol validation, not just JSON schema structure. We also verify JWS signatures for cryptographic authenticity.

**Q: Do I need Node.js installed?**  
A: No! This Python package contains pre-built native binaries that work without any Node.js dependency.

**Q: Can I validate LLM agent cards?**  
A: Yes! Perfect for AI/LLM developers validating agent configurations and testing third-party agents before integration.

## Development

This package contains pre-built native binaries compiled for maximum performance and zero dependencies. The CLI provides the same functionality across all platforms without requiring any additional runtime installations.

**Source code:** https://github.com/capiscio/capiscio-cli

## License

MIT License - see the [main repository](https://github.com/capiscio/capiscio-cli/blob/main/LICENSE) for details.

---

**Need help?** [Visit capisc.io](https://capisc.io) | [Open an issue](https://github.com/capiscio/capiscio-cli/issues) | [Documentation](https://capisc.io/cli) | [Web Validator](https://capisc.io/validator)

**Keywords**: A2A protocol, AI agent validation, agent-card.json validator, Python CLI, agent-to-agent protocol, LLM agent cards, AI agent discovery, transport protocol testing, JSONRPC validation, GRPC testing, JWS signature verification