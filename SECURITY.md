# Security Policy

## Supported Versions

We provide security updates for the following versions of Capiscio CLI:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of Capiscio CLI seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: security@capiscio.dev

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

### What to Include

Please include the following information in your report:

- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

### Security Considerations

Capiscio CLI is designed with security in mind:

#### Network Security
- Uses HTTPS by default for all remote requests
- Implements proper timeout handling to prevent hanging connections
- Does not store or cache sensitive information
- Uses standard HTTP headers and follows security best practices

#### Input Validation
- All JSON input is parsed safely
- URL validation prevents malicious redirects
- File path validation prevents directory traversal attacks
- Input sanitization for all user-provided data

#### Dependencies
- Minimal dependency footprint to reduce attack surface
- Regular dependency auditing and updates
- No external service dependencies that could be compromised

#### Data Handling
- No persistent storage of validated agent cards
- No transmission of sensitive data to external services
- All validation is performed locally

## Vulnerability Response

When we receive a security bug report, we will:

1. **Acknowledge** receipt of your report within 48 hours
2. **Assess** the vulnerability and determine its impact
3. **Develop** a fix for the issue
4. **Test** the fix thoroughly
5. **Release** a patch version as soon as possible
6. **Notify** the community about the security update

### Timeline

- **Critical vulnerabilities**: Patch within 7 days
- **High vulnerabilities**: Patch within 14 days
- **Medium/Low vulnerabilities**: Patch in next regular release

### Credit

We believe in giving credit to security researchers who help make our software safer. If you report a security vulnerability, we will:

- Credit you in the security advisory (unless you prefer to remain anonymous)
- Include your name in the CHANGELOG for the release that fixes the issue
- Provide a brief description of your contribution

## Security Best Practices for Users

### When Using Capiscio CLI

1. **Keep Updated**: Always use the latest version of Capiscio CLI
2. **Verify Sources**: Only validate agent cards from trusted sources
3. **Network Security**: Be cautious when validating URLs from untrusted sources
4. **File Permissions**: Ensure proper file permissions on agent card files
5. **CI/CD Security**: Use JSON output mode in automated environments

### In Production Environments

1. **Use Strict Mode**: Enable strict validation for production deployments
2. **Network Isolation**: Consider running validation in isolated environments
3. **Logging**: Monitor validation logs for suspicious activity
4. **Access Control**: Limit who can run validation commands in production

### For Developers

1. **Validate Input**: Always validate agent cards before deployment
2. **Use HTTPS**: Ensure agent cards are served over HTTPS
3. **Content Security**: Implement proper Content-Security-Policy headers
4. **Regular Audits**: Regularly audit your agent card configurations

## Scope

This security policy applies to:

- The Capiscio CLI codebase
- npm package distribution
- GitHub repository and releases
- Documentation and examples

This policy does not cover:

- Third-party agent cards validated by the CLI
- External services that agent cards may reference
- User-specific configurations or environments

## Contact

For general security questions (not vulnerability reports), please contact:
security@capiscio.dev

For urgent security matters, you may also reach out via:
- GitHub Security Advisory (for confirmed vulnerabilities)
- Direct message to maintainers (for clarification only)

## Legal

By reporting security vulnerabilities, you agree that:

- You will not access, modify, or delete data belonging to others
- You will not perform any attacks that could harm the reliability or integrity of our services
- You will not disclose the vulnerability publicly until we have had time to address it
- Your testing and research comply with applicable laws

---

Thank you for helping keep Capiscio CLI and our users safe!\n