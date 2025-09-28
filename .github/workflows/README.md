# GitHub Actions Workflows

This directory contains the CI/CD workflows for the capiscio-cli project.

## Workflows

### 🔄 `ci.yml` - Continuous Integration
**Trigger**: Push to main/master, Pull Requests

**What it does**:
- Runs tests on Node.js 18.x and 20.x
- Performs linting and type checking
- Tests CLI functionality on both Node.js versions  
- Tests binary building process (Linux) on PRs and main pushes
- Runs security audit
- Skips CI for docs-only changes to optimize resource usage

### 🚀 `release-binaries.yml` - Automated Binary Release
**Trigger**: GitHub Release published, Manual dispatch

**What it does**:
- Builds 5 cross-platform binaries (Linux x64, macOS Intel/ARM, Windows Intel/ARM)
- Tests each binary on its native platform
- Signs macOS binaries for distribution compliance
- Uploads all binaries to GitHub Release
- Creates SHA256 checksums for verification
- Can be triggered manually for testing

**Usage**:
1. Create a new release on GitHub (e.g., tag `v1.1.1`)
2. Workflow automatically builds and attaches binaries
3. Binaries are available for download on the release page

### 🧪 `test-binaries.yml` - Manual Cross-Platform Testing  
**Trigger**: Manual dispatch only

**What it does**:
- Builds binaries for all platforms
- Tests basic CLI functionality on each platform
- Optionally tests validation functionality
- Provides downloadable artifacts

**Usage**:
1. Go to Actions tab → "Manual - Test Cross-Platform Binaries"
2. Click "Run workflow"
3. Optionally enable validation testing
4. Download binaries from artifacts

### 📦 `release.yml` - NPM Release (Existing)
**Trigger**: GitHub Release published

**What it does**:
- Publishes package to NPM registry
- Handles versioning and tagging

### 🔢 `version-bump.yml` - Version Management (Existing)
**Trigger**: Manual or automated

**What it does**:
- Manages version bumping
- Creates release PRs

## Binary Distribution Strategy

### Local Development
```bash
# Build all binaries locally
npm run build:binaries

# Test individual platforms
./dist/binaries/capiscio-linux-x64 --version
./dist/binaries/capiscio-darwin-x64 --version  
./dist/binaries/capiscio-win-x64.exe --version
```

### Production Releases
1. **Create Release**: Tag and create GitHub release (e.g., `v1.1.1`)
2. **Automated Build**: `release-binaries.yml` triggers automatically  
3. **Binary Upload**: Binaries attached to release within ~10 minutes
4. **Python Package**: Python CLI can download from release URL

### Testing Changes
1. **PR Testing**: `ci.yml` tests binary building on every PR
2. **Manual Testing**: Use `test-binaries.yml` for full cross-platform testing
3. **Pre-release**: Use workflow_dispatch on `release-binaries.yml`

## Binary Details

| Platform | Architecture | Target | Output | Size |
|----------|-------------|--------|--------|------|
| Linux | x64 | `node18-linux-x64` | `capiscio-linux-x64` | ~50MB |
| macOS | Intel x64 | `node18-macos-x64` | `capiscio-darwin-x64` | ~54MB |  
| macOS | ARM64 | `node18-macos-arm64` | `capiscio-darwin-arm64` | ~48MB |
| Windows | Intel x64 | `node18-win-x64` | `capiscio-win-x64.exe` | ~41MB |
| Windows | ARM64 | `node18-win-arm64` | `capiscio-win-arm64.exe` | ~29MB |

## Security

- Binaries are built in isolated GitHub runners
- SHA256 checksums provided for verification
- No external dependencies during binary runtime
- Node.js 18 runtime embedded (no system Node.js required)

## Troubleshooting

### Binary Build Fails
1. Check `ci.yml` results for basic issues
2. Use `test-binaries.yml` to isolate platform-specific problems
3. Review build logs in failed workflow runs

### Release Upload Fails
1. Ensure GitHub token has proper permissions
2. Verify release exists and is published (not draft)
3. Check for duplicate asset names

### Binary Doesn't Execute
1. Verify binary has execute permissions (Unix systems)
2. Check architecture compatibility (x64 vs ARM)
3. Test with `--version` first before complex commands

## Next Steps

With these workflows, you can now:

1. **✅ Automated Testing**: Every PR tests binary building
2. **✅ Automated Releases**: GitHub releases automatically include binaries  
3. **✅ Manual Testing**: Full cross-platform testing on demand
4. **🔄 Python Integration**: Python CLI can download binaries from releases

The Python package workflow will download binaries from GitHub releases and package them for PyPI distribution.