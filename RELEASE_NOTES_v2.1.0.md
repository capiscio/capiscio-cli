# CapiscIO CLI v2.1.0

We are excited to announce **CapiscIO CLI v2.1.0**, a major architectural evolution that unifies our validation logic across all platforms.

## 🚀 Major Architecture Change

The Node.js CLI has been re-engineered as a lightweight wrapper around the high-performance **`capiscio-core`** Go binary.

*   **Unified Logic**: Ensures 100% consistency between the CLI, the web validator, and other tools.
*   **Performance**: Drastically improved validation speed and stability.
*   **Automatic Management**: The CLI automatically downloads, verifies, and manages the correct binary version for your platform.

## 📜 License Update

*   **Apache 2.0**: The project license has been updated from MIT to **Apache License, Version 2.0**.

## ⚠️ Breaking Changes

*   **Removed `--conservative` flag**: The conservative validation mode is no longer supported. All validations now use the unified scoring logic.
*   **Output Format**: Error messages now follow the `capiscio-core` format, which may differ slightly from previous versions.
*   **Scoring Adjustments**: Test expectations for scores may need to be updated (e.g., baseline scores have been calibrated).

## 📦 Installation

### Node.js (Recommended)
```bash
npm install -g capiscio-cli
```

### Standalone Binary
If you prefer not to use a package manager, you can download the standalone binary directly from the [capiscio-core releases](https://github.com/capiscio/capiscio-core/releases/tag/v1.0.2).

## 🛠 Full Changelog

### Changed
- **ARCHITECTURE**: Replaced pure Node.js implementation with `capiscio-core` binary wrapper.
- **LICENSE**: Changed to Apache 2.0.
- **CI/CD**: Updated workflows to support binary caching and new architecture.

### Fixed
- Resolved high-severity npm vulnerabilities.
- Fixed binary download logic for various platforms.
