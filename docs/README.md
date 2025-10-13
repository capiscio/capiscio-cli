# capiscio-cli Documentation

> **Validate A2A agent cards with confidence** - Catch issues before they reach production

## Why capiscio-cli?

**The Problem:** You're building an A2A agent and need to ensure your agent card is valid, trustworthy, and production-ready. Manual validation is error-prone and doesn't catch subtle issues.

**The Solution:** capiscio-cli provides comprehensive three-dimensional validation:

- ✅ **Spec Compliance (0-100)**: Is your agent card properly formatted?
- ✅ **Trust (0-100)**: Can users verify your agent's authenticity?
- ✅ **Availability (0-100)**: Are your endpoints operational?

## � Documentation Structure

### User Documentation

- **[Installation & Usage](README.md)** - Installation guide and getting started
- **[Validation Process](validation-process.md)** - Exhaustive guide to the validation system
- **[Scoring System](scoring-system.md)** - Three-dimensional scoring breakdown and best practices
- **[API Reference](api-reference.md)** - Programmatic usage and TypeScript API documentation

### Developer Documentation

- **[Architecture](architecture.md)** - Internal design, patterns, and extensibility

## 🚀 Quick Navigation

### New Users
1. Start with [Installation & Usage](README.md) for installation and basic usage
2. Review [Validation Process](validation-process.md) to understand what's validated
3. Learn about [Scoring System](scoring-system.md) to interpret your results

### Developers
1. Read the [API Reference](api-reference.md) for programmatic usage
2. Study the [Architecture](architecture.md) for internal design

### CI/CD Integration
1. See JSON output examples in the [API Reference](api-reference.md)
2. Review error codes in [Validation Process](validation-process.md#error-codes-reference)
3. Check [API Reference](api-reference.md#cicd-integration) for automation examples

## 🔍 Find What You Need

### I want to...

- **Validate an agent card** → [Installation & Usage](README.md)
- **Understand what gets validated** → [Validation Process](validation-process.md)
- **Understand scoring results** → [Scoring System](scoring-system.md)
- **Use the CLI programmatically** → [API Reference](api-reference.md)
- **Extend or modify the validator** → [Architecture](architecture.md)

!!! tip "Building an A2A Agent?"
    If you're building an agent (not just validating cards), check out [CapiscIO A2A Security](../../a2a-security/) for runtime protection.

### Validation Specifics

- **Error codes and meanings** → [Validation Process - Error Codes](validation-process.md#error-codes-reference)
- **Validation modes explained** → [Validation Process - Validation Modes](validation-process.md#validation-modes)
- **Network and HTTP handling** → [Validation Process - HTTP Client](validation-process.md#http-client-network-validation)
- **Schema validation details** → [Validation Process - Schema Validation](validation-process.md#schema-validation)

### Integration Examples

- **CLI usage examples** → [Installation & Usage](README.md)
- **Programmatic examples** → [API Reference - Examples](api-reference.md#examples)
- **CI/CD integration** → [API Reference - CI/CD Integration](api-reference.md#cicd-integration)
- **Custom HTTP clients** → [API Reference - Custom HTTP Client](api-reference.md#custom-http-client)

## 📝 Documentation Standards

Our documentation follows these principles:

- **Comprehensive**: Covers all features and use cases
- **Example-Driven**: Includes practical examples for every concept
- **Up-to-Date**: Synchronized with code changes
- **Accessible**: Clear language suitable for all skill levels
- **Searchable**: Well-structured with good navigation

## 🤝 Contributing to Documentation

We welcome improvements to documentation! For:

- How to submit documentation changes
- Writing style guidelines
- Documentation review process
- Setting up the development environment

See the repository on GitHub for more details.

---

**Need help?** Open an [issue](https://github.com/capiscio/capiscio-cli/issues) or start a [discussion](https://github.com/capiscio/capiscio-cli/discussions).