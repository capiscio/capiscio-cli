# Contributing to CapiscIO CLI

Thank you for your interest in contributing to CapiscIO CLI! This document provides guidelines and information for contributors.

## 🚀 Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/capiscio-cli.git`
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`
5. Make your changes
6. Run tests: `npm test`
7. Submit a pull request

## 📦 Release Process

Our release process uses GitHub Actions workflows to automate binary building and package publishing. Here's how it works:

### 🔄 Two-Phase Release Process

We use a **draft-first** approach to handle GitHub's immutable release limitation:

1. **Create Draft Release** → Binary workflow triggers and uploads assets
2. **Publish Release** → NPM and PyPI workflows trigger and publish packages

### 📋 Step-by-Step Release Procedure

#### 1. Prepare the Release

1. Update version in `package.json`:
```bash
npm version patch  # or minor/major
```

2. Update version in `python-package/pyproject.toml` to match

3. Commit and push changes:
```bash
git add .
git commit -m "chore: bump version to v1.x.x"
git push origin main
```

#### 2. Create Draft Release

1. Go to [GitHub Releases](https://github.com/capiscio/capiscio-cli/releases)
2. Click "Create a new release"
3. **Important**: Create as **Draft** (do not publish yet)
4. Set tag version (e.g., `v1.2.3`)
5. Set release title (e.g., `v1.2.3`)
6. Add release notes
7. Click "Save draft" (NOT "Publish release")

#### 3. Wait for Binary Upload

1. The **Build and Release Binaries** workflow will trigger automatically
2. Monitor the [Actions tab](https://github.com/capiscio/capiscio-cli/actions)
3. Wait for all binaries to be built and uploaded (~10-15 minutes)
4. Verify assets appear in the draft release:
   - `capiscio-linux-x64.tar.gz`
   - `capiscio-darwin-x64.tar.gz` 
   - `capiscio-darwin-arm64.tar.gz`
   - `capiscio-win-x64.exe`
   - `capiscio-win-arm64.exe`

#### 4. Publish the Release

1. Once all binaries are uploaded, go back to the draft release
2. Click "Edit" and then "Publish release"
3. This will trigger the **Release** and **Build and Publish Python Package** workflows
4. Monitor these workflows to ensure NPM and PyPI publishing succeed

### ⚠️ Important Notes

- **Never publish a release before binaries are uploaded** - GitHub releases become immutable once published
- **Always use draft releases first** - This allows binary uploads before the release becomes immutable
- **Monitor all workflows** - Ensure each step completes successfully before proceeding

### 🚨 Troubleshooting

#### "Cannot upload binaries to immutable release"
- This happens if you publish the release before binaries are uploaded
- Solution: Delete the release, create a new draft, wait for binaries, then publish

#### Binary workflow fails
- Check the Actions logs for specific errors
- Solution: Fix the issue and create a new release

## 🛠️ Development Setup

### Prerequisites

- Node.js 16 or higher
- npm 7 or higher
- Git

### Installation

```bash
git clone https://github.com/capiscio/capiscio-cli.git
cd capiscio-cli
npm install
```

### Available Scripts

- `npm run build` - Build the CLI for production
- `npm run dev` - Development build with watch mode
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Lint code with ESLint
- `npm run type-check` - Type check with TypeScript

## 📝 Code Style

- We use TypeScript for type safety
- ESLint and Prettier for code formatting
- Follow existing code patterns and conventions
- Add JSDoc comments for public APIs

## 🧪 Testing

- Write tests for new features
- Maintain or improve test coverage
- Run `npm test` before submitting
- Add integration tests for CLI commands

## 📋 Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure all tests pass
4. Update CHANGELOG.md if applicable
5. Submit a clear pull request description

## 🐛 Bug Reports

When reporting bugs, please include:

- Node.js version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Sample agent card (if applicable)

## 💡 Feature Requests

We welcome feature suggestions! Please:

- Check existing issues first
- Clearly describe the use case
- Provide examples if possible
- Consider implementation complexity

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.