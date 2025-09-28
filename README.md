# Capiscio CLI - A2A Protocol Validator

> **Validator & A2A Protocol Compliance CLI** | The only CLI that actually tests AI agent transport protocols. Validate agent-card.json files, A2A compliance across JSONRPC, GRPC, and REST with live endpoint testing.

[![npm version](https://badge.fury.io/js/capiscio-cli.svg)](https://badge.fury.io/js/capiscio-cli)
[![Downloads](https://img.shields.io/npm/dm/capiscio-cli)](https://www.npmjs.com/package/capiscio-cli)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Quick Start

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

### Option 2: Download Standalone Binary (No Node.js Required)

| Platform | Architecture | Download | Size |
|----------|-------------|----------|------|
| **Linux** | x64 | [`capiscio-linux-x64`](https://github.com/capiscio/capiscio-cli/releases/latest/download/capiscio-linux-x64) | ~50MB |
| **macOS** | Intel | [`capiscio-darwin-x64`](https://github.com/capiscio/capiscio-cli/releases/latest/download/capiscio-darwin-x64) | ~54MB |
| **macOS** | Apple Silicon | [`capiscio-darwin-arm64`](https://github.com/capiscio/capiscio-cli/releases/latest/download/capiscio-darwin-arm64) | ~48MB |
| **Windows** | Intel x64 | [`capiscio-win-x64.exe`](https://github.com/capiscio/capiscio-cli/releases/latest/download/capiscio-win-x64.exe) | ~41MB |
| **Windows** | ARM64 | [`capiscio-win-arm64.exe`](https://github.com/capiscio/capiscio-cli/releases/latest/download/capiscio-win-arm64.exe) | ~29MB |

#### Quick Download Commands:
```bash
# Linux x64
curl -L -o capiscio https://github.com/capiscio/capiscio-cli/releases/latest/download/capiscio-linux-x64
chmod +x capiscio

# macOS Intel
curl -L -o capiscio https://github.com/capiscio/capiscio-cli/releases/latest/download/capiscio-darwin-x64
chmod +x capiscio

# macOS Apple Silicon (M1/M2/M3/M4)
curl -L -o capiscio https://github.com/capiscio/capiscio-cli/releases/latest/download/capiscio-darwin-arm64
chmod +x capiscio

# Windows Intel (PowerShell)
Invoke-WebRequest -Uri "https://github.com/capiscio/capiscio-cli/releases/latest/download/capiscio-win-x64.exe" -OutFile "capiscio.exe"

# Windows ARM64 (PowerShell)  
Invoke-WebRequest -Uri "https://github.com/capiscio/capiscio-cli/releases/latest/download/capiscio-win-arm64.exe" -OutFile "capiscio.exe"

# Use the binary
./capiscio validate ./agent-card.json
```

## Key Features

- **🚀 Transport Protocol Testing** - Actually tests JSONRPC, GRPC, and REST endpoints
- **� Cross-Platform Binaries** - Native executables for Linux, macOS (Intel & ARM), Windows (Intel & ARM)
- **�🔍 Smart Discovery** - Finds agent cards automatically with multiple fallbacks
- **⚡ Three Validation Modes** - Progressive, strict, and conservative
- **🔧 CI/CD Ready** - JSON output with proper exit codes
- **🌐 Live Endpoint Testing** - Validates real connectivity, not just schemas
- **⚡ No Dependencies** - Standalone binaries require no Node.js installation

## Usage

### Basic Commands

```bash
capiscio validate [input] [options]

# Examples
capiscio validate                              # Auto-detect in current directory
capiscio validate ./agent-card.json           # Validate local file
capiscio validate https://agent.com           # Test live agent
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
- ✅ **Capiscio tests actual connectivity and protocol compliance**

**Real Problems This Solves:**
- JSONRPC methods return wrong error codes
- GRPC services are unreachable or misconfigured  
- REST endpoints don't match declared capabilities
- Agent cards validate but agents don't work

## Transport Protocol Testing

Unlike basic schema validators, Capiscio CLI actually tests your agent endpoints:

- **JSONRPC** - Validates JSON-RPC 2.0 compliance and connectivity
- **GRPC** - Tests gRPC endpoint accessibility
- **REST** - Verifies HTTP+JSON endpoint patterns
- **Consistency** - Ensures equivalent functionality across protocols

Perfect for testing your own agents and evaluating third-party agents before integration.

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
    curl -L -o capiscio https://github.com/capiscio/capiscio-cli/releases/latest/download/capiscio-linux-x64
    chmod +x capiscio
    ./capiscio validate ./agent-card.json --json --strict
```

Exit codes: 0 = success, 1 = validation failed

## FAQ

**Q: What is the A2A Protocol?**  
A: The Agent-to-Agent (A2A) protocol v0.3.0 is a standardized specification for AI agent discovery, communication, and interoperability.

**Q: How is this different from schema validators?**  
A: We actually test live JSONRPC, GRPC, and REST endpoints with transport protocol validation, not just JSON schema structure.

**Q: Can I validate LLM agent cards?**  
A: Yes! Perfect for AI/LLM developers validating agent configurations and testing third-party agents before integration.

**Q: What file formats are supported?**  
A: Current spec uses `agent-card.json`. We also support legacy `agent.json` files and auto-discover from `/.well-known/agent-card.json` endpoints.

## License

MIT © [Capiscio](https://github.com/capiscio)

---

**Need help?** [Open an issue](https://github.com/capiscio/capiscio-cli/issues) or check our [documentation](docs/)

**Keywords**: A2A protocol, AI agent validation, agent-card.json validator, agent.json validator, agent-to-agent protocol, LLM agent cards, AI agent discovery, agent configuration validation, transport protocol testing, JSONRPC validation, GRPC testing, REST endpoint validation, agent protocol CLI, AI agent compliance
