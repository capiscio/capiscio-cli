# Using Scoring in the CLI

> **Learn how to use the three-dimensional scoring system with CapiscIO CLI**

## Quick Overview

CapiscIO CLI uses a three-dimensional scoring system to evaluate agent cards:

- **📄 Compliance (0-100)** - Protocol adherence and format validation (`complianceScore`)
- **🔐 Trust (0-100)** - Security practices and cryptographic verification (`trustScore`)
- **🚀 Availability (0-100)** - Operational readiness *(only with `--test-live`)*

---

## Basic Usage

### Viewing Scores

Scores are included in `--json` output:

```bash
# Validate and get JSON output with scores
capiscio validate agent-card.json --json

# Add live endpoint testing for availability scores
capiscio validate https://agent.example.com --json --test-live
```

### Example Text Output

```
✅ A2A AGENT VALIDATION PASSED
Score: 100/100
Version: 0.3.0
Perfect! Your agent passes all validations
```

### Example Output with Warnings

```
✅ A2A AGENT VALIDATION PASSED
Score: 85/100
Version: 0.3.0
Agent passed with warnings

ERRORS FOUND:
⚠️ [MISSING_DOCS] warning: No documentation URL provided
⚠️ [UNSIGNED] warning: Agent card is not cryptographically signed
```

---

## JSON Output Format

When using `--json`, the output includes the full scoring result:

```json
{
  "success": true,
  "score": 100,
  "version": "0.3.0",
  "errors": [],
  "warnings": [],
  "scoringResult": {
    "success": true,
    "complianceScore": 100,
    "trustScore": 85,
    "availability": {
      "score": 0,
      "tested": false
    },
    "issues": [],
    "signatures": null
  },
  "liveTest": null
}
```

### With Live Testing (`--test-live`)

```json
{
  "success": true,
  "score": 100,
  "version": "0.3.0",
  "errors": [],
  "warnings": [],
  "scoringResult": {
    "success": true,
    "complianceScore": 100,
    "trustScore": 85,
    "availability": {
      "score": 95,
      "tested": true,
      "endpointUrl": "https://agent.example.com/.well-known/agent.json",
      "latencyMs": 142
    },
    "issues": []
  },
  "liveTest": {
    "success": true,
    "endpoint": "https://agent.example.com/.well-known/agent.json",
    "responseTime": 142,
    "errors": []
  }
}
```

### Parsing JSON in Scripts

```bash
# Extract compliance score
capiscio validate agent.json --json | jq '.scoringResult.complianceScore'

# Extract trust score
capiscio validate agent.json --json | jq '.scoringResult.trustScore'

# Check if production-ready (compliance >= 95, trust >= 60)
RESULT=$(capiscio validate agent.json --json)
COMPLIANCE=$(echo "$RESULT" | jq '.scoringResult.complianceScore')
TRUST=$(echo "$RESULT" | jq '.scoringResult.trustScore')

if (( $(echo "$COMPLIANCE >= 95" | bc -l) )) && (( $(echo "$TRUST >= 60" | bc -l) )); then
  echo "✅ Production ready"
else
  echo "⚠️  Not production ready"
fi

# Get all validation issues
capiscio validate agent.json --json | jq '.scoringResult.issues[]'
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Validate Agent Card

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install CapiscIO CLI
        run: npm install -g capiscio
      
      - name: Validate with scoring
        run: |
          capiscio validate agent-card.json --json > results.json
          
          # Extract scores
          COMPLIANCE=$(jq '.scoringResult.complianceScore' results.json)
          TRUST=$(jq '.scoringResult.trustScore' results.json)
          
          echo "📊 Compliance: $COMPLIANCE/100"
          echo "🔐 Trust: $TRUST/100"
          
          # Fail if below thresholds
          if (( $(echo "$COMPLIANCE < 95" | bc -l) )) || (( $(echo "$TRUST < 60" | bc -l) )); then
            echo "❌ Failed: Scores below production thresholds"
            exit 1
          fi
          
          echo "✅ Passed: Production-ready scores"
```

### GitLab CI Example

```yaml
validate-agent:
  stage: test
  image: node:20
  script:
    - npm install -g capiscio
    - capiscio validate agent-card.json --json > results.json
    - COMPLIANCE=$(jq '.scoringResult.complianceScore' results.json)
    - TRUST=$(jq '.scoringResult.trustScore' results.json)
    - |
      if (( $(echo "$COMPLIANCE < 95" | bc -l) )) || (( $(echo "$TRUST < 60" | bc -l) )); then
        echo "❌ Scores below thresholds"
        exit 1
      fi
```

---

## Command Combinations

### Validate Multiple Files

```bash
# Validate all agent cards
for file in agents/*.json; do
  echo "Validating $file..."
  capiscio validate "$file"
done

# Or use find
find agents/ -name "*.json" -exec capiscio validate {} \;
```

### Live Testing for Availability

```bash
# Full validation with live endpoint testing
capiscio validate https://agent.example.com --test-live --json

# Schema-only validation (no live test even if URL)
capiscio validate https://agent.example.com --schema-only
```

### Compare Agents

```bash
# Compare two agents side-by-side
capiscio validate agent-a.json --json > a.json
capiscio validate agent-b.json --json > b.json

# Extract key metrics
echo "Agent A - Compliance: $(jq '.scoringResult.complianceScore' a.json), Trust: $(jq '.scoringResult.trustScore' a.json)"
echo "Agent B - Compliance: $(jq '.scoringResult.complianceScore' b.json), Trust: $(jq '.scoringResult.trustScore' b.json)"
```

---

## Batch Validation Report

```bash
#!/bin/bash
# generate-report.sh - Create CSV report of all agent scores

echo "File,Success,Compliance,Trust,Issues" > report.csv

for file in agents/*.json; do
  RESULT=$(capiscio validate "$file" --json 2>/dev/null)
  if [ $? -eq 0 ] || [ $? -eq 1 ]; then
    SUCCESS=$(echo "$RESULT" | jq -r '.success')
    COMPLIANCE=$(echo "$RESULT" | jq -r '.scoringResult.complianceScore')
    TRUST=$(echo "$RESULT" | jq -r '.scoringResult.trustScore')
    ISSUES=$(echo "$RESULT" | jq -r '.scoringResult.issues | length')
    
    echo "$file,$SUCCESS,$COMPLIANCE,$TRUST,$ISSUES" >> report.csv
  fi
done

echo "📊 Report generated: report.csv"
```

---

## Exit Codes

The CLI uses exit codes to indicate validation results:

| Exit Code | Meaning |
|-----------|---------|
| **0** | Validation passed (agent is valid) |
| **1** | Validation failed (agent has errors) |

**Important:** The CLI exits with 0 even if scores are low, as long as the agent card is structurally valid. To enforce score thresholds, parse the JSON output:

```bash
# Enforce minimum trust score
RESULT=$(capiscio validate agent.json --json)
TRUST=$(echo "$RESULT" | jq '.scoringResult.trustScore')

if (( $(echo "$TRUST < 60" | bc -l) )); then
  echo "❌ Trust score too low: $TRUST"
  exit 1
fi
```

---

## CLI Flags Reference

| Flag | Description |
|------|-------------|
| `--json` | Output results as JSON (includes all scores) |
| `--test-live` | Test live agent endpoint for availability score |
| `--strict` | Enable strict validation mode |
| `--schema-only` | Validate schema only, skip endpoint testing |
| `--skip-signature` | Skip JWS signature verification |
| `--registry-ready` | Check registry deployment readiness |
| `--timeout` | Request timeout (default: 10s) |
| `--errors-only` | Show only errors and warnings |

---

## See Also

- [CLI Reference](../reference/cli.md) - Complete command-line reference and options
- [Programmatic Usage](./programmatic-usage.md) - Use the CLI from Node.js applications
