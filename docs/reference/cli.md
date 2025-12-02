---
title: CLI Reference
description: Command-line reference for the capiscio npm package.
---

# CLI Reference

Complete reference for the `capiscio` command-line interface.

---

## validate

Validate an A2A agent card from a file or URL.

```bash
capiscio validate [input] [options]
```

### Arguments

| Argument | Description |
|----------|-------------|
| `input` | Path to agent-card.json, URL, or omit to auto-detect |

### Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--strict` | boolean | false | Strict validation mode |
| `--progressive` | boolean | true | Progressive validation (default) |
| `--schema-only` | boolean | false | Validate schema only, skip network requests |
| `--skip-signature` | boolean | false | Skip JWS signature verification |
| `--test-live` | boolean | false | Test live agent endpoint |
| `--registry-ready` | boolean | false | Check registry deployment readiness |
| `--json` | boolean | false | Output results as JSON |
| `--errors-only` | boolean | false | Show only errors and warnings |
| `--verbose` | boolean | false | Show detailed validation steps |
| `--timeout <ms>` | string | 10000 | Request timeout in milliseconds |

---

## Examples

### Basic Validation

```bash
# Local file
capiscio validate ./agent-card.json

# Remote agent (auto-discovers /.well-known/agent-card.json)
capiscio validate https://my-agent.example.com

# Auto-detect in current directory
capiscio validate
```

### Validation Modes

```bash
# Progressive (default) - warnings for issues
capiscio validate ./agent-card.json

# Strict - warnings become errors
capiscio validate ./agent-card.json --strict

# Schema only - no network requests
capiscio validate ./agent-card.json --schema-only
```

### CI/CD

```bash
# JSON output for parsing
capiscio validate ./agent-card.json --json

# Production pipeline
capiscio validate ./agent-card.json --strict --json
```

### Live Testing

```bash
# Test endpoint responds correctly
capiscio validate https://agent.example.com --test-live

# With custom timeout
capiscio validate https://agent.example.com --test-live --timeout 15000
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Validation passed |
| 1 | Validation failed |

---

## JSON Output

When using `--json`, output follows this structure:

```json
{
  "success": true,
  "score": 95,
  "errors": [],
  "warnings": [
    {
      "code": "NO_SIGNATURES_FOUND",
      "message": "No signatures present",
      "severity": "warning"
    }
  ],
  "validations": [
    {
      "id": "schema_validation",
      "status": "passed",
      "message": "Agent card conforms to A2A v0.3.0"
    }
  ],
  "scoringResult": {
    "compliance": { "total": 95, "rating": "Excellent" },
    "trust": { "total": 80, "rating": "Good" },
    "availability": null
  }
}
```

---

## See Also

- [capiscio-core CLI](../../reference/cli/index.md) - Full CLI documentation
- [validate-a2a](https://github.com/capiscio/validate-a2a) - GitHub Action
