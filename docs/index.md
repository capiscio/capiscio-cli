---
title: CapiscIO npm Package
description: Install the capiscio CLI via npm. Validate A2A agent cards from the command line.
---

# CapiscIO npm Package

The `capiscio` npm package installs the CapiscIO CLI for validating A2A agent cards.

```bash
npm install -g capiscio
```

---

## Quick Start

```bash
# Validate a local file
capiscio validate ./agent-card.json

# Validate a remote agent
capiscio validate https://your-agent.example.com

# Strict mode with JSON output
capiscio validate ./agent-card.json --strict --json
```

---

## What This Package Does

This npm package is a **distribution wrapper** for [capiscio-core](https://github.com/capiscio/capiscio-core), the Go-based validation engine.

```
┌────────────────────────────────────┐
│     npm install -g capiscio        │
└─────────────────┬──────────────────┘
                  │
                  ▼
┌────────────────────────────────────┐
│     capiscio-core (Go binary)      │
│     Downloaded automatically       │
└────────────────────────────────────┘
```

**Why a wrapper?**

- ✅ Easy installation via npm
- ✅ No Go toolchain required
- ✅ Automatic binary management
- ✅ Cross-platform support

---

## Installation Options

### Global Install (Recommended)

```bash
npm install -g capiscio
capiscio validate ./agent-card.json
```

### npx (No Install)

```bash
npx capiscio validate ./agent-card.json
```

### Project Dependency

```bash
npm install --save-dev capiscio
npx capiscio validate ./agent-card.json
```

---

## CLI Reference

### validate

Validate an A2A agent card.

```bash
capiscio validate [input] [options]
```

| Option | Description |
|--------|-------------|
| `--strict` | Strict validation mode |
| `--json` | JSON output (for CI/CD) |
| `--schema-only` | Skip network requests |
| `--skip-signature` | Skip JWS signature verification |
| `--test-live` | Test live agent endpoint |
| `--timeout <ms>` | Request timeout (default: 10000) |
| `--verbose` | Detailed output |
| `--errors-only` | Show only errors |

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Validation passed |
| `1` | Validation failed |

---

## CI/CD Integration

### GitHub Actions

```yaml
- name: Validate Agent Card
  run: npx capiscio validate ./agent-card.json --strict --json
```

### GitLab CI

```yaml
validate:
  script:
    - npx capiscio validate ./agent-card.json --strict --json
```

!!! tip "Dedicated GitHub Action"
    For richer CI integration, use [validate-a2a](https://github.com/capiscio/validate-a2a).

---

## Programmatic Usage

For Node.js applications that need validation results programmatically, spawn the CLI with JSON output:

```typescript
import { spawnSync } from 'child_process';

function validateAgentCard(path: string) {
  const result = spawnSync('npx', ['capiscio', 'validate', path, '--json'], {
    encoding: 'utf8'
  });
  
  // CLI may exit with code 1 on validation failure but still outputs valid JSON
  const output = result.stdout || result.stderr;
  return JSON.parse(output);
}

const result = validateAgentCard('./agent-card.json');
console.log(`Valid: ${result.success}, Score: ${result.score}`);
```

---

## Alternative Installation Methods

If you prefer not to use npm:

| Method | Command |
|--------|---------|
| **pip** | `pip install capiscio` |
| **Binary** | [Download from GitHub](https://github.com/capiscio/capiscio-core/releases) |
| **Docker** | `docker pull ghcr.io/capiscio/capiscio-core` |

---

## See Also

- [CLI Reference](../reference/cli/index.md) - Complete command documentation
- [capiscio-core](https://github.com/capiscio/capiscio-core) - Underlying Go binary
- [validate-a2a](https://github.com/capiscio/validate-a2a) - GitHub Action
