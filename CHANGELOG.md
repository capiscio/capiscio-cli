# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2025-10-03

### Added
- **Three-Dimensional Scoring System** - Revolutionary multi-dimensional evaluation replacing single score
  - **Compliance Scoring** (0-100): Measures A2A v0.3.0 specification adherence with weighted criteria
    - Core Fields (60 pts): Required field presence and validity
    - Skills Quality (20 pts): Skill definition completeness and structure
    - Format Compliance (15 pts): URL formats, semver, protocol versions, transports
    - Data Quality (5 pts): Duplicate detection, field lengths, SSRF protection
  - **Trust Scoring** (0-100): Evaluates security and authenticity with confidence multiplier
    - Cryptographic Signatures (40 pts): JWS validation, coverage, and freshness
    - Provider Trust (25 pts): Organization identity, reachable HTTPS URLs
    - Security Posture (20 pts): HTTPS-only transports, authentication requirements
    - Documentation (15 pts): ToS, privacy policy, documentation URLs
    - **Trust Confidence Multiplier**: Revolutionary approach that scales trust score based on signature validity
      - 1.0x with valid signature (full confidence)
      - 0.6x without signature (reduced confidence)
      - 0.4x with invalid signature (minimal confidence)
  - **Availability Scoring** (0-100): Measures operational readiness (requires `--test-live`)
    - Primary Endpoint (50 pts): Response time, connectivity, CORS, TLS validity
    - Transport Support (30 pts): Preferred protocol availability, additional interfaces
    - Response Quality (20 pts): Valid structure, content types, error handling
- **Production Readiness Thresholds** - Clear guidance for deployment decisions
  - Compliance ≥95: Specification adherence sufficient for production
  - Trust ≥60: Minimum trust level for production deployment
  - Availability ≥80: Operational stability sufficient for production
- **Comprehensive Scoring Documentation** - 350-line guide covering all aspects of the scoring system
- **9 New Integration Tests** - Complete test coverage for all scoring scenarios
- **Colored Score Display** - Visual feedback with score-based color coding (green/yellow/magenta/red)
- **Detailed Score Breakdowns** - Per-category explanations of how scores were calculated
- **Actionable Recommendations** - Multi-line guidance for improving scores across all dimensions
- **JSON Scoring Output** - Complete scoring data available in `--json` mode for automation

### Changed
- **BREAKING: Scoring is now default behavior** - Three-dimensional scores always calculated and displayed
- **BREAKING: Output format changed** - Removed single "Score: X/100" in favor of three-dimensional breakdown
- **BREAKING: No backward compatibility** - Legacy scoring completely removed from codebase
- Scoring results now appear in every validation run without opt-in flags
- Console output enhanced with rich scoring visualization
- Documentation reorganized to feature scoring system prominently

### Removed
- **BREAKING: Removed legacy single score** - No more "Score: X/100" output

### Technical Details
- **1,900+ lines of new code** across 5 scoring modules
- **176 total tests passing** (9 new scoring integration tests)
- **Zero configuration required** - scoring works out of the box
- **Schema-only mode respected** - Availability scoring returns `null` when `--test-live` not used
- **Type-safe implementation** - Complete TypeScript type system for all scoring components

### Migration Guide

**Version 2.0.0 introduces breaking changes to the output format.**

#### What Changed
- **Old format**: Single "Score: X/100" after validation
- **New format**: Three-dimensional scoring breakdown with Compliance, Trust, and Availability

#### CLI Output Impact
If you're parsing CLI output:
- **Console mode**: Look for three separate score lines instead of one
- **JSON mode**: Use `result.scoringResult` object with `compliance`, `trust`, `availability` properties
- **Legacy score**: No longer available - use appropriate dimension score instead

#### Recommended Actions
1. **CI/CD pipelines**: Update scripts to parse new JSON structure
2. **Automation**: Use `--json` flag and extract `scoringResult` object
3. **Human readers**: Enjoy richer, more actionable feedback!

#### No User Impact
Since there were no users of version 1.x in production, this breaking change has zero real-world impact. The new scoring system is significantly better and provides more actionable insights than the legacy single score.

## [1.2.6] - 2025-09-30

### Added
- Comprehensive transport endpoint testing for JSONRPC, gRPC, and HTTP+JSON protocols
- Transport consistency validation per A2A §5.6.4 requirements
- Enhanced endpoint connectivity testing with proper error categorization
- Improved error severity logic (primary vs additional interface failures)

### Changed
- **Standardized binary name** - All platforms now use consistent `capiscio` binary name
- **Windows binary compression** - Windows binaries now distributed as compressed zip files
- Enhanced transport protocol testing with real connectivity checks
- Improved validation pipeline with better error reporting
- Updated test coverage for transport endpoint functionality

### Fixed
- Corrected skills requirement validation (made optional per A2A specification)
- Removed unused TypeScript parameters in transport test methods
- Fixed test mock setup for network validation scenarios

## [1.2.5] - 2025-09-25

### Added
- **Multi-platform binaries** - Standalone executables for Windows, macOS, and Linux
- **PyPI package distribution** - Python package manager support (`pip install capiscio`)
- **Cross-platform compatibility** - Native binaries with zero dependencies
- **Enhanced distribution options** - npm, pip, and standalone binary downloads

### Enhanced
- JWS signature verification improvements and stability
- Enhanced cryptographic validation pipeline
- Improved JWKS endpoint handling and error reporting
- Better signature verification error messages

### Fixed
- Signature verification edge cases and error handling
- HTTPS-only JWKS URI validation improvements
- Enhanced detached signature support

## [1.2.0] - 2025-09-20

### Added
- **JWS Signature Verification** - RFC 7515 compliant JSON Web Signature validation
- **JWKS Support** - JSON Web Key Set fetching and verification from trusted sources
- **Cryptographic Authentication** - Ed25519 and RSA signature algorithm support
- **Secure by Default** - Automatic signature verification when signatures are present
- **Detached Signature Support** - Support for agent card authentication via detached signatures
- **HTTPS-only JWKS** - Security requirement for key distribution endpoints

### Security
- Added cryptographic validation layer for agent card authenticity
- Implemented secure key fetching with HTTPS-only requirements
- Enhanced trust verification for production deployments

## [1.0.0] - 2025-09-18

### Added
- Initial release of Capiscio CLI
- A2A protocol validation for agent cards
- Support for A2A protocol v0.3.0
- Multiple validation modes (progressive, strict, conservative)
- Schema validation with comprehensive error reporting
- Version compatibility analysis
- Network endpoint testing
- Auto-detection of agent cards in common locations
- Support for both legacy and modern discovery endpoints
- Beautiful console output with colors and formatting
- JSON output for CI/CD integration
- Cross-platform support (Windows, macOS, Linux)
- Zero external service dependencies
- Comprehensive CLI options and configuration

### Features

#### Core Validation
- **Schema Validation**: Complete A2A v0.3.0 schema compliance checking
- **Version Compatibility**: Semver-based version analysis and feature compatibility
- **Network Testing**: HTTP endpoint accessibility verification
- **Legacy Support**: Backward compatibility with older A2A protocol versions

#### Input Sources
- **File Validation**: Local JSON file validation
- **URL Validation**: Remote agent card validation via HTTP/HTTPS
- **Auto-Detection**: Intelligent discovery in common file locations
- **Well-Known Endpoints**: Support for `.well-known/agent-card.json` and legacy `.well-known/agent.json`

#### Validation Modes
- **Progressive Mode**: Balanced validation with warnings and suggestions (default)
- **Strict Mode**: Full compliance checking for production deployment
- **Conservative Mode**: Minimal requirements for development and testing

#### Output Formats
- **Console Output**: Rich, colorized terminal output with emojis and formatting
- **JSON Output**: Structured output for automation and CI/CD integration
- **Error-Only Mode**: Focused output showing only issues that need attention

#### CLI Features
- **Flexible Input**: Support for files, URLs, and auto-detection
- **Configurable Timeouts**: Custom HTTP request timeouts
- **Schema-Only Mode**: Skip network testing for faster validation
- **Registry Readiness**: Additional checks for registry deployment
- **Version Analysis**: Detailed version compatibility reporting

### Technical Implementation

#### Architecture
- **TypeScript**: Full type safety and modern JavaScript features
- **Modular Design**: Clean separation of concerns with extensible architecture
- **Zero Dependencies**: Self-contained validation without external services
- **Native APIs**: Uses fetch() API and Node.js built-ins for minimal footprint

#### HTTP Client
- **Fetch-Based**: Modern fetch() API implementation
- **Timeout Handling**: Proper request timeout and cancellation
- **Error Normalization**: Consistent error handling across network issues
- **Custom Headers**: User-Agent and Accept headers for proper identification

#### Validation Engine
- **Embedded Schema**: Built-in A2A protocol schema validation
- **Custom Semver**: Lightweight semantic version comparison
- **Feature Detection**: Intelligent feature-version compatibility checking
- **Legacy Endpoint Detection**: Automatic fallback and migration warnings

#### Performance
- **Fast Validation**: Optimized validation pipeline
- **Minimal Memory**: Efficient memory usage for large agent cards
- **Early Termination**: Quick failure on critical errors
- **Parallel Processing**: Concurrent validation where possible

### Documentation
- **Comprehensive README**: Complete usage guide with examples
- **API Reference**: Full programmatic usage documentation
- **Validation Process**: Detailed explanation of all validation steps
- **Architecture Guide**: Internal design and extension documentation
- **Contributing Guide**: Guidelines for community contributions

### Testing
- **Unit Tests**: Core validator functionality testing
- **Integration Tests**: CLI workflow validation
- **Type Safety**: Full TypeScript coverage
- **CI/CD**: Automated testing and quality checks

### Build & Distribution
- **Dual Output**: CLI binary and library exports
- **Cross-Platform**: Windows, macOS, and Linux support
- **npm Package**: Ready for npm registry publication
- **GitHub Actions**: Automated CI/CD pipeline

---

## Release Notes

### 1.0.0 - Initial Release

This is the first public release of Capiscio CLI, extracted from the Capiscio monorepo to provide a standalone, performant validation tool for the A2A protocol community.

**Key Highlights:**
- Complete A2A v0.3.0 protocol validation
- Zero external dependencies - fully self-contained
- Beautiful terminal output with comprehensive error reporting
- JSON output for seamless CI/CD integration
- Support for multiple validation strictness levels
- Intelligent agent card discovery and legacy endpoint support

**Migration from Monorepo:**
This CLI represents a strategic extraction from the larger Capiscio platform to provide a focused, high-performance tool that can serve as the foundation for future CI plugins and SDKs.

**Community Ready:**
The CLI is designed for community adoption with comprehensive documentation, contributing guidelines, and a clear API for programmatic usage.

---

## Upgrade Guide

Since this is the initial release, no upgrade procedures are needed. For future releases, upgrade guides will be provided here.

## Breaking Changes

No breaking changes in this initial release.

## Security

For security vulnerabilities, please see [SECURITY.md](SECURITY.md).