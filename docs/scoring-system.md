# Three-Dimensional Scoring System

> **Beyond pass/fail** - Understand exactly where your agent excels and where it needs improvement

The Capiscio CLI uses a sophisticated three-dimensional scoring system that evaluates agents across three independent quality dimensions. Unlike a single aggregate score that obscures specific issues, our system clearly shows whether problems lie in specification compliance, trustworthiness, or operational availability.

## Overview

Every agent receives three independent scores:

1. **Spec Compliance (0-100)** - How well does the agent card conform to the A2A v0.3.0 specification?
2. **Trust (0-100)** - How trustworthy and secure is this agent?
3. **Availability (0-100)** - How operational and reliable is the endpoint? *(Only with `--test-live`)*

Each score has a detailed breakdown showing exactly what contributed to the final value.

## Using Detailed Scores

Add the `--detailed-scores` flag to any validation command:

```bash
# Show detailed scoring breakdown
capiscio validate agent-card.json --detailed-scores

# Combine with live testing
capiscio validate https://agent.example.com --detailed-scores --test-live

# JSON output with scoring
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

  ✓ Trust: 24/100 Low Trust
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

## Score 1: Spec Compliance (100 points)

**What it measures:** How well the agent card adheres to the A2A v0.3.0 specification.

### Breakdown (60/20/15/5 weighting)

#### Core Fields (60 points)
Checks for presence of all 9 required A2A fields:
- `protocolVersion` (6.67 points)
- `name` (6.67 points)
- `description` (6.67 points)
- `url` (6.67 points)
- `version` (6.67 points)
- `capabilities` (6.67 points)
- `defaultInputModes` (6.67 points)
- `defaultOutputModes` (6.67 points)
- `skills` (6.67 points)

**Each missing field costs you 6.67 points.**

#### Skills Quality (20 points)
Evaluates the quality of your skills array:
- **Skills present** (10 points) - At least one skill defined
- **Required fields** (5 points) - All skills have `id`, `name`, `description`
- **Tags present** (5 points) - All skills have at least one tag

**Penalty:** -2 points per skill with missing required fields, -1 point per skill without tags

#### Format Compliance (15 points)
Validates proper formatting:
- **Valid semver** (3 points) - `version` follows semantic versioning (e.g., `1.0.0`)
- **Valid protocol version** (3 points) - `protocolVersion` is `0.3.0`
- **Valid URL** (3 points) - `url` is a proper HTTPS URL
- **Valid transports** (3 points) - Transport protocols are `JSONRPC`, `GRPC`, or `HTTP+JSON`
- **Valid MIME types** (3 points) - Input/output modes are valid MIME types

**Penalty:** -10 points for bad MIME types (security risk)

#### Data Quality (5 points)
Checks for data integrity:
- **No duplicate skill IDs** (2 points) - Each skill has a unique identifier
- **Field lengths valid** (2 points) - Names, descriptions within reasonable limits
- **No SSRF risks** (1 point) - URLs don't point to internal/private networks

### Rating Levels
- **100**: Perfect
- **90-99**: Excellent
- **75-89**: Good
- **60-74**: Fair
- **<60**: Poor

### Common Issues
- ❌ Missing required fields like `protocolVersion` or `capabilities`
- ❌ Skills without tags (reduces discoverability)
- ❌ Invalid MIME types in input/output modes
- ❌ Using HTTP instead of HTTPS for URLs
- ❌ Invalid semantic version strings

## Score 2: Trust (100 points + multiplier)

**What it measures:** How trustworthy and secure is this agent? Can users verify its authenticity?

### The Trust Confidence Multiplier 🔑

**This is revolutionary:** The presence and validity of cryptographic signatures affects ALL trust claims via a confidence multiplier:

- **Valid JWS signature**: 1.0x multiplier (full trust)
- **No signature**: 0.6x multiplier (unverified claims)
- **Invalid signature**: 0.4x multiplier (active distrust)

**Why this matters:** An agent claiming strong security without signatures gets reduced trust. This prevents "trust washing" where agents make security claims they can't prove.

### Breakdown (40/25/20/15 weighting)

#### Signatures (40 points + confidence key)
The foundation of trust:
- **Valid signature present** (30 points)
- **Multiple signatures** (+3 points) - Redundant verification
- **Comprehensive coverage** (+4 points) - Signature covers all fields
- **Recent signature** (+3 points) - Signed within last 90 days

**Penalties:**
- **Invalid signature** (-15 points + 0.4x multiplier) - Worse than no signature
- **Expired signature** (-10 points + 0.6x multiplier)

#### Provider Information (25 points)
Who is behind this agent?
- **Organization specified** (10 points) - `provider.organization` present
- **Provider URL** (10 points) - `provider.url` present and HTTPS
- **URL reachable** (+5 bonus) - Provider website responds *(requires `--test-live`)*

#### Security Practices (20 points)
How secure is the implementation?
- **HTTPS-only endpoints** (10 points) - All URLs use HTTPS
- **Security schemes declared** (5 points) - `securitySchemes` defined
- **Strong authentication** (5 points) - OAuth2, OpenID Connect, or similar

**Penalty:** -10 points for any HTTP URLs (security risk)

#### Documentation (15 points)
Transparency and user support:
- **Documentation URL** (5 points) - `documentationUrl` provided
- **Terms of Service** (5 points) - `termsOfServiceUrl` provided
- **Privacy Policy** (5 points) - `privacyPolicyUrl` provided

### Rating Levels
- **80-100**: Highly Trusted
- **60-79**: Trusted
- **40-59**: Moderate Trust
- **20-39**: Low Trust
- **<20**: Untrusted

### Example: Confidence Multiplier in Action

**Scenario:** Agent card claims strong security (OAuth2, HTTPS-only) = 40 raw points

- **With valid signature**: 40 × 1.0 = **40 points** ✅
- **Without signature**: 40 × 0.6 = **24 points** ⚠️ (Same claims, less trustworthy)
- **Invalid signature**: 40 × 0.4 = **16 points** ❌ (Active red flag)

### Common Issues
- ❌ No cryptographic signatures (reduces trust by 40%)
- ❌ Missing provider information
- ❌ No documentation or privacy policy URLs
- ❌ Using HTTP instead of HTTPS
- ❌ No security schemes declared

## Score 3: Availability (100 points)

**What it measures:** Is the agent operationally available and responding correctly?

**Important:** This score is only calculated with the `--test-live` flag. Without it, you'll see "Not Tested".

### Breakdown (50/30/20 weighting)

#### Primary Endpoint (50 points)
Can we reach your agent?
- **Endpoint responds** (30 points) - Returns a valid response
- **Fast response** (10 points) - Responds in under 3 seconds
- **CORS configured** (5 points) - Proper CORS headers for web access
- **Valid TLS certificate** (5 points) - HTTPS certificate is valid and trusted

#### Transport Support (30 points)
Are the declared transports working?
- **Preferred transport works** (20 points) - Primary protocol responds correctly
- **Additional interfaces** (10 points) - Alternative transports also functional

#### Response Quality (20 points)
How well-formed are the responses?
- **Valid A2A structure** (10 points) - Responses follow A2A message format
- **Proper content-type** (5 points) - Correct HTTP headers
- **Error handling** (5 points) - Graceful error responses

### Rating Levels
- **95-100**: Fully Available
- **80-94**: Available
- **60-79**: Degraded
- **40-59**: Unstable
- **<40**: Unavailable

### Common Issues
- ❌ Endpoint timeouts (> 3 seconds)
- ❌ Connection refused or DNS errors
- ❌ Invalid TLS certificates
- ❌ Missing or incorrect CORS headers
- ❌ Responses not following A2A message structure
- ❌ Declared transports returning errors

## Production Readiness

The system automatically determines if an agent is "production ready" based on these thresholds:

- **Compliance ≥ 95** - Nearly perfect spec adherence
- **Trust ≥ 60** - Moderate trust or better
- **Availability ≥ 80** - Available or better *(if tested)*

Agents meeting all thresholds receive a "✅ Production ready" recommendation.

## Recommendations

After scoring, you'll receive actionable recommendations:

- **Perfect compliance?** "✅ Fully A2A v0.3.0 compliant"
- **Good but no signatures?** "⚠️ No cryptographic signatures - consider adding JWS signatures"
- **Poor compliance?** "❌ Poor compliance - significant improvements needed"
- **Not production ready?** "⚠️ Not yet production ready - improve: compliance, trust"

## JSON Output

The full scoring breakdown is available in JSON format:

```bash
capiscio validate agent.json --detailed-scores --json
```

```json
{
  "scoringResult": {
    "compliance": {
      "total": 100,
      "rating": "Perfect",
      "breakdown": {
        "coreFields": {
          "score": 60,
          "maxScore": 60,
          "details": {
            "present": ["protocolVersion", "name", "..."],
            "missing": []
          }
        },
        "skillsQuality": { "score": 20, "maxScore": 20, "..." },
        "formatCompliance": { "score": 15, "maxScore": 15, "..." },
        "dataQuality": { "score": 5, "maxScore": 5, "..." }
      },
      "issues": []
    },
    "trust": {
      "total": 24,
      "rawScore": 40,
      "confidenceMultiplier": 0.6,
      "rating": "Low Trust",
      "breakdown": { "..." },
      "issues": [
        "No valid cryptographic signatures - trust claims unverified",
        "Trust confidence reduced (0.6x) - no cryptographic verification"
      ]
    },
    "availability": {
      "total": null,
      "tested": false,
      "notTestedReason": "Schema-only validation (use --test-live to test availability)"
    },
    "recommendation": "✅ Fully A2A v0.3.0 compliant\n⚠️ No cryptographic signatures..."
  }
}
```

## Use Cases

### Development Workflow
```bash
# Quick check during development (compliance only)
capiscio validate agent.json --detailed-scores

# Add when ready to test security
capiscio validate agent.json --detailed-scores --test-live
```

### CI/CD Pipeline
```bash
# Fail build if compliance < 95 or trust < 60
capiscio validate agent.json --detailed-scores --json > scores.json

# Parse JSON and check thresholds in your pipeline
```

### Agent Registry
```bash
# Full scoring for registry submissions
capiscio validate https://agent.com --detailed-scores --test-live --strict

# Enforce production readiness for listing
```

### User-Facing Agent Discovery
- Show compliance scores to help users find well-implemented agents
- Display trust scores to help users assess risk
- Show availability scores to indicate operational status

## Best Practices

1. **Always aim for 100/100 compliance** - It's achievable and ensures interoperability
2. **Add cryptographic signatures** - Boosts trust from ~20-40 to ~60-90+
3. **Test live before deploying** - Catch endpoint issues early
4. **Monitor availability scores** - Set up alerts for degradation
5. **Document everything** - Adding URLs to docs/ToS/privacy is easy points
6. **Use HTTPS everywhere** - HTTP URLs cost points and reduce trust

## Comparing to Legacy Systems

**Old way:** Single score (0-100) that didn't tell you what was wrong

**New way:** Three clear dimensions showing exactly where to improve

**Example:**
- Agent with score 45 - Is it insecure? Broken? Non-compliant? **Unknown.**
- Agent with 100/24/85 - Perfect spec compliance, low trust (no signatures), good availability. **Actionable.**

---

**Ready to improve your scores?** Run `capiscio validate --detailed-scores` to see where your agent stands!
