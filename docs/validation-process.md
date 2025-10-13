# 🔍 Validation Process Documentation

> **Comprehensive guide to the CapiscIO CLI validation system**

## What Gets Validated?

**The Challenge:** The A2A protocol specification is comprehensive, and manually checking every requirement is time-consuming and error-prone.

**Our Solution:** Automated validation across 7+ categories:

- ✅ Input resolution and discovery
- ✅ HTTP client and network validation
- ✅ Schema and structure compliance
- ✅ Version compatibility analysis
- ✅ Protocol adherence
- ✅ Security and authentication
- ✅ Endpoint availability (optional)

This document provides an exhaustive overview of everything included in the A2A agent card validation process.

## 📚 Table of Contents

- [Input Resolution & Discovery](#input-resolution-discovery)
- [HTTP Client & Network Validation](#http-client-network-validation)
- [Schema Validation](#schema-validation)
- [Version Compatibility Analysis](#version-compatibility-analysis)
- [Validation Modes](#validation-modes)
- [Advanced Feature Detection](#advanced-feature-detection)
- [Output & Reporting](#output-reporting)
- [Error Codes Reference](#error-codes-reference)
- [Performance & Timing](#performance-timing)

## Input Resolution & Discovery

### Auto-Detection Process

When no input is specified, the CLI searches for agent cards in these locations (in order):

```
./agent-card.json (preferred)
./.well-known/agent-card.json 
./src/agent-card.json
./public/.well-known/agent-card.json
./dist/.well-known/agent-card.json
./agent.json (legacy support)
./.well-known/agent.json (legacy support)
```

### URL Handling

1. **Direct URL validation**: Tests if URL directly contains agent card JSON
2. **Well-known endpoint discovery**: Tries `/.well-known/agent-card.json` (A2A v0.3.0 standard)
3. **Legacy endpoint fallback**: Falls back to `/.well-known/agent.json` (legacy)
4. **Protocol inference**: Automatically adds `https://` if missing

### File Processing

- JSON parsing with detailed error messages
- UTF-8 encoding support
- Validation of JSON structure before processing
- Graceful error handling for malformed files

## HTTP Client & Network Validation

### Request Configuration

```typescript
{
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'capiscio-cli/1.0.0'
  },
  timeout: 10000 // configurable
}
```

### Error Handling

| Error Type | Code | Description |
|------------|------|-------------|
| HTTP 400 | `BAD_REQUEST` | Invalid request format |
| HTTP 401 | `UNAUTHORIZED` | Authentication required |
| HTTP 403 | `FORBIDDEN` | Access denied |
| HTTP 404 | `NOT_FOUND` | Agent card not found |
| HTTP 408 | `TIMEOUT` | Request timeout |
| HTTP 429 | `RATE_LIMITED` | Too many requests |
| HTTP 500 | `INTERNAL_SERVER_ERROR` | Server error |
| HTTP 502 | `BAD_GATEWAY` | Gateway error |
| HTTP 503 | `SERVICE_UNAVAILABLE` | Service unavailable |
| HTTP 504 | `GATEWAY_TIMEOUT` | Gateway timeout |
| Network | `ENOTFOUND` | Domain not found |
| Network | `ECONNREFUSED` | Connection refused |
| Network | `NETWORK_ERROR` | General network error |

## Schema Validation

### Required Fields (A2A v0.3.0)

#### Basic Required Fields
- `name`: Agent display name
- `description`: Agent description
- `url`: Agent base URL
- `provider`: Provider information object
- `version`: Agent version (semver format)

#### A2A Protocol Required Fields
- `protocolVersion`: A2A protocol version (e.g., "0.3.0")
- `preferredTransport`: Primary transport protocol

#### Provider Structure
```typescript
{
  "provider": {
    "organization": "string", // Required
    "url": "string"           // Optional
  }
}
```

### Skills Validation

Each skill in the `skills` array must have:
- `id`: Unique skill identifier
- `examples`: Array of string examples (if present)

### Version Format Validation

- **Agent Version**: Must follow semantic versioning (semver)
- **Protocol Version**: Must be valid A2A protocol version

## Version Compatibility Analysis

### Feature-Version Requirements

| Feature | Minimum Protocol Version | Description |
|---------|-------------------------|-------------|
| `capabilities.pushNotifications` | 0.3.0 | Push notification support |
| `additionalInterfaces` | 0.3.0 | Multiple interface support |
| `capabilities.streaming` | 0.3.0 | Streaming capability |

### Compatibility Checks

1. **Protocol Version Detection**: Identifies declared protocol version
2. **Feature Analysis**: Checks used features against declared version
3. **Mismatch Detection**: Identifies incompatible feature-version combinations
4. **Migration Suggestions**: Provides upgrade recommendations

## Validation Modes

### Progressive Mode (Default)
```bash
capiscio validate agent.json --progressive
```

**Characteristics:**
- Balanced validation approach
- Core A2A protocol requirements enforced
- Warnings for deprecated features
- Suggestions for best practices
- Permissive of emerging features

**Use Cases:**
- Development and testing
- Continuous integration
- General-purpose validation

### Strict Mode
```bash
capiscio validate agent.json --strict
```

**Characteristics:**
- Full A2A protocol compliance required
- All endpoints must be accessible
- Security schemes required
- Complete metadata validation
- Zero tolerance for deprecated features

**Use Cases:**
- Production deployment
- Registry submission
- Compliance verification

### Conservative Mode
```bash
capiscio validate agent.json --conservative
```

**Characteristics:**
- Minimal validation requirements
- Basic schema structure checking
- Optional endpoint testing
- Permissive security requirements

**Use Cases:**
- Early development
- Legacy agent support
- Basic structure validation

## Advanced Feature Detection

### Legacy Endpoint Handling

**Detection Logic:**
1. Check if URL uses `.well-known/agent.json` (legacy)
2. Generate warning if legacy endpoint detected
3. Suggest migration to `.well-known/agent-card.json`

**Warning Generated:**
```
LEGACY_DISCOVERY_ENDPOINT: Agent discovered via legacy endpoint.
The A2A v0.3.0 specification recommends using /.well-known/agent-card.json
```

### Transport Protocol Validation

**Supported Protocols:**
- `JSONRPC`: JSON-RPC transport
- `GRPC`: gRPC transport
- `HTTP+JSON`: HTTP with JSON payloads

**Cross-Validation:**
- gRPC transport should have streaming capabilities
- Transport protocols must match interface declarations

## Output & Reporting

### Console Output Structure

```
✅ A2A AGENT VALIDATION PASSED
Agent: https://example.com/.well-known/agent-card.json
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

### JSON Output Structure

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

## Error Codes Reference

### Schema Validation Errors

| Code | Description | Severity | Fixable |
|------|-------------|----------|----------|
| `SCHEMA_VALIDATION_ERROR` | Missing or invalid required field | Error | Yes |
| `VERSION_MISMATCH_ERROR` | Protocol version conflicts | Error | Yes |
| `STRICT_VERSION_MISMATCH` | Strict mode version issues | Error | Yes |

### Network & Discovery Errors

| Code | Description | Severity | Fixable |
|------|-------------|----------|----------|
| `VALIDATION_FAILED` | General validation failure | Error | Depends |
| `ENDPOINT_UNREACHABLE` | HTTP connection issues | Error | Yes |
| `LEGACY_DISCOVERY_ENDPOINT` | Using legacy endpoint | Warning | Yes |

### Feature Compatibility Warnings

| Code | Description | Severity | Fixable |
|------|-------------|----------|----------|
| `VERSION_FEATURE_MISMATCH` | Feature requires newer protocol | Warning | Yes |
| `GRPC_WITHOUT_STREAMING` | gRPC without streaming capability | Warning | Yes |

## Performance & Timing

### Metrics Collected

- **Individual Validation Steps**: Timing for each validation component
- **Total Duration**: Complete validation time
- **Network Requests**: HTTP request timing
- **Schema Processing**: JSON parsing and validation time

### Optimization Features

- **Schema-Only Mode**: Skip network calls with `--schema-only`
- **Timeout Configuration**: Custom timeout with `--timeout <ms>`
- **Efficient Error Handling**: Early termination on critical failures

### Performance Benchmarks

| Operation | Typical Duration | Notes |
|-----------|------------------|-------|
| Schema Validation | 1-50ms | Depends on agent card size |
| Network Request | 50-1000ms | Depends on network latency |
| Version Analysis | <1ms | Cached semver operations |
| Total Validation | 100-2000ms | Varies by mode and network |

---

## See Also

- **[Scoring System](scoring-system.md)** - Understand how validation results translate to scores
- **[API Reference](api-reference.md)** - Use validation programmatically
- **[Architecture](architecture.md)** - Internal validator implementation details
- **[A2A Security](../../a2a-security/)** - Runtime protection for production agents

!!! tip "Production Deployment"
    capiscio-cli validates agent cards during development and CI/CD. For runtime protection, use [CapiscIO A2A Security middleware](../../a2a-security/).

## Contributing to Validation

See the [GitHub repository](https://github.com/capiscio/capiscio-cli) for information on extending the validation system.

## Related Documentation

- [CLI Usage Guide](README.md)
- [API Reference](./api-reference.md)
- [A2A Protocol Specification](https://github.com/a2aproject/A2A){:target="_blank"}
