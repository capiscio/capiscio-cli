# Using Scoring in the CLI

> **Learn how to use the three-dimensional scoring system with CapiscIO CLI** - For the full scoring system reference, see the [**Unified Scoring Guide**](https://docs.capisc.io/guides/scoring-system/)

## Quick Overview

CapiscIO CLI uses a three-dimensional scoring system to evaluate agent cards:

- **📄 Compliance (0-100)** - Protocol adherence and format validation
- **🔐 Trust (0-100)** - Security practices and cryptographic verification  
- **🚀 Availability (0-100)** - Operational readiness *(optional with `--test-live`)*

!!! tip "Complete Scoring Details"
    This page focuses on **CLI usage**. For the complete scoring system explanation, breakdowns, and calculations, see the [**Unified Scoring Guide**](https://docs.capisc.io/guides/scoring-system/).

---

## Basic Usage

### Viewing Scores

Add the `--detailed-scores` flag to any validation command:

```bash
# Show detailed scoring breakdown
capiscio validate agent-card.json --detailed-scores

# Combine with live testing for availability scores
capiscio validate https://agent.example.com --detailed-scores --test-live

# JSON output with full scoring details
capiscio validate agent-card.json --detailed-scores --json
```

### Example Output

```
📊 SCORING BREAKDOWN:

  ✓ Spec Compliance: 100/100 Perfect
    └─ Core Fields:       60/60
    └─ Skills Quality:    20/20
    └─ Format:            15/15
    └─ Data Quality:      5/5

  ✓ Trust: 24/100 Moderately Trusted
    ⚠️  Confidence: 0.6x (Raw: 40)
    └─ Signatures:        0/40
    └─ Provider:          20/25
    └─ Security:          15/20
    └─ Documentation:     5/15

  ⏭️  Availability: Not Tested
    └─ Schema-only validation (use --test-live to test availability)

💡 RECOMMENDATION:
  ✅ Fully A2A v0.3.0 compliant
  ⚠️ No cryptographic signatures - consider adding JWS signatures to improve trust
  ⚠️ Not yet production ready - improve: trust
```

---

## JSON Output Format

When using `--json` with `--detailed-scores`, the output includes full scoring details:

```json
{
  "valid": true,
  "version": "0.3.0",
  "scores": {
    "compliance": {
      "total": 100,
      "rating": "PERFECT",
      "breakdown": {
        "coreFields": {"score": 60, "maxScore": 60, "issues": []},
        "skillsQuality": {"score": 20, "maxScore": 20, "issues": []},
        "formatCompliance": {"score": 15, "maxScore": 15, "issues": []},
        "dataQuality": {"score": 5, "maxScore": 5, "issues": []}
      }
    },
    "trust": {
      "total": 24,
      "rating": "MODERATELY_TRUSTED",
      "confidenceMultiplier": 0.6,
      "breakdown": {
        "signatures": {"score": 0, "maxScore": 40, "issues": ["No signatures present"]},
        "provider": {"score": 20, "maxScore": 25, "issues": []},
        "security": {"score": 15, "maxScore": 20, "issues": []},
        "documentation": {"score": 5, "maxScore": 15, "issues": ["Missing docs URL"]}
      }
    },
    "availability": null
  },
  "recommendation": "Improve trust score by adding cryptographic signatures"
}
```

### Parsing JSON in Scripts

```bash
# Extract compliance score
capiscio validate agent.json --detailed-scores --json | jq '.scores.compliance.total'

# Check if production-ready (compliance >= 95, trust >= 60)
COMPLIANCE=$(capiscio validate agent.json --detailed-scores --json | jq '.scores.compliance.total')
TRUST=$(capiscio validate agent.json --detailed-scores --json | jq '.scores.trust.total')

if [ "$COMPLIANCE" -ge 95 ] && [ "$TRUST" -ge 60 ]; then
  echo "✅ Production ready"
else
  echo "⚠️  Not production ready"
fi

# Get all issues from trust breakdown
capiscio validate agent.json --detailed-scores --json | \
  jq '.scores.trust.breakdown | to_entries | .[] | select(.value.issues | length > 0) | {category: .key, issues: .value.issues}'
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
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install CapiscIO CLI
        run: npm install -g capiscio-cli
      
      - name: Validate with scoring
        run: |
          capiscio validate agent-card.json --detailed-scores --json > results.json
          
          # Extract scores
          COMPLIANCE=$(jq '.scores.compliance.total' results.json)
          TRUST=$(jq '.scores.trust.total' results.json)
          
          echo "📊 Compliance: $COMPLIANCE/100"
          echo "🔐 Trust: $TRUST/100"
          
          # Fail if below thresholds
          if [ "$COMPLIANCE" -lt 95 ] || [ "$TRUST" -lt 60 ]; then
            echo "❌ Failed: Scores below production thresholds (Compliance >= 95, Trust >= 60)"
            exit 1
          fi
          
          echo "✅ Passed: Production-ready scores"
```

### GitLab CI Example

```yaml
validate-agent:
  stage: test
  image: node:18
  script:
    - npm install -g capiscio-cli
    - capiscio validate agent-card.json --detailed-scores --json > results.json
    - COMPLIANCE=$(jq '.scores.compliance.total' results.json)
    - TRUST=$(jq '.scores.trust.total' results.json)
    - |
      if [ "$COMPLIANCE" -lt 95 ] || [ "$TRUST" -lt 60 ]; then
        echo "❌ Scores below thresholds"
        exit 1
      fi
  artifacts:
    reports:
      junit: results.json
```

---

## Command Combinations

### Validate Multiple Files

```bash
# Validate all agent cards with scoring
for file in agents/*.json; do
  echo "Validating $file..."
  capiscio validate "$file" --detailed-scores
done

# Or use find
find agents/ -name "*.json" -exec capiscio validate {} --detailed-scores \;
```

### Live Testing with Scoring

```bash
# Full validation with live endpoint testing
capiscio validate https://agent.example.com --detailed-scores --test-live

# Output shows all three dimensions:
# - Compliance: Protocol adherence
# - Trust: Security and signatures
# - Availability: Endpoint health (from live test)
```

### Compare Agents

```bash
# Compare two agents side-by-side
capiscio validate agent-a.json --detailed-scores --json > a.json
capiscio validate agent-b.json --detailed-scores --json > b.json

# Extract key metrics
echo "Agent A - Compliance: $(jq '.scores.compliance.total' a.json), Trust: $(jq '.scores.trust.total' a.json)"
echo "Agent B - Compliance: $(jq '.scores.compliance.total' b.json), Trust: $(jq '.scores.trust.total' b.json)"
```

---

## Filtering by Score Thresholds

### Only Show Low Scores

```bash
#!/bin/bash
# validate-and-filter.sh - Only show agents below thresholds

for file in agents/*.json; do
  RESULT=$(capiscio validate "$file" --detailed-scores --json)
  COMPLIANCE=$(echo "$RESULT" | jq '.scores.compliance.total')
  TRUST=$(echo "$RESULT" | jq '.scores.trust.total')
  
  if [ "$COMPLIANCE" -lt 90 ] || [ "$TRUST" -lt 70 ]; then
    echo "⚠️  $file - Compliance: $COMPLIANCE, Trust: $TRUST"
    echo "$RESULT" | jq '.scores.compliance.breakdown, .scores.trust.breakdown'
  fi
done
```

### Batch Validation Report

```bash
#!/bin/bash
# generate-report.sh - Create CSV report of all agent scores

echo "File,Compliance,Trust,ComplianceRating,TrustRating" > report.csv

for file in agents/*.json; do
  RESULT=$(capiscio validate "$file" --detailed-scores --json 2>/dev/null)
  if [ $? -eq 0 ]; then
    COMPLIANCE=$(echo "$RESULT" | jq -r '.scores.compliance.total')
    TRUST=$(echo "$RESULT" | jq -r '.scores.trust.total')
    COMP_RATING=$(echo "$RESULT" | jq -r '.scores.compliance.rating')
    TRUST_RATING=$(echo "$RESULT" | jq -r '.scores.trust.rating')
    
    echo "$file,$COMPLIANCE,$TRUST,$COMP_RATING,$TRUST_RATING" >> report.csv
  fi
done

echo "📊 Report generated: report.csv"
```

---

## Exit Codes and Scoring

The CLI uses exit codes to indicate validation results:

- **Exit 0**: Validation passed (agent is valid)
- **Exit 1**: Validation failed (agent has errors)

**Important:** The CLI exits with 0 even if scores are low, as long as the agent card is structurally valid. If you need to enforce score thresholds, use the JSON output and check scores in your script (see examples above).

```bash
# This will exit 0 even if trust is low
capiscio validate agent.json --detailed-scores

# To enforce thresholds, check JSON output
TRUST=$(capiscio validate agent.json --detailed-scores --json | jq '.scores.trust.total')
if [ "$TRUST" -lt 60 ]; then
  echo "❌ Trust score too low"
  exit 1
fi
```

---

## Rating Enums

The CLI outputs rating labels based on score ranges:

### Compliance Ratings
- `PERFECT` (100)
- `EXCELLENT` (95-99)
- `GOOD` (85-94)
- `FAIR` (70-84)
- `POOR` (0-69)

### Trust Ratings
- `HIGHLY_TRUSTED` (90-100)
- `TRUSTED` (70-89)
- `MODERATELY_TRUSTED` (50-69)
- `UNTRUSTED` (30-49)
- `HIGHLY_UNTRUSTED` (0-29)

### Availability Ratings (with `--test-live`)
- `HIGHLY_AVAILABLE` (90-100)
- `AVAILABLE` (70-89)
- `PARTIALLY_AVAILABLE` (50-69)
- `DEGRADED` (30-49)
- `UNAVAILABLE` (0-29)

---

## See Also

<div class="grid cards" markdown>

-   **📚 Unified Scoring Guide**

    ---

    Complete scoring system reference with all breakdowns, calculations, and rating thresholds.

    [:octicons-arrow-right-24: View Complete Guide](https://docs.capisc.io/guides/scoring-system/)

-   **🐍 A2A Security Scoring**

    ---

    Python usage with ValidationResult API and decision patterns.

    [:octicons-arrow-right-24: Python Usage](https://docs.capisc.io/a2a-security/guides/scoring/)

-   **📖 CLI Reference**

    ---

    Complete command-line reference and options.

    [:octicons-arrow-right-24: CLI Docs](./cli-reference/)

-   **⚡ Quick Start**

    ---

    Get started with CapiscIO CLI in 5 minutes.

    [:octicons-arrow-right-24: Quick Start](./getting-started/)

</div>

---

**For complete scoring details**, see the [**Unified Scoring Guide**](https://docs.capisc.io/guides/scoring-system/).
