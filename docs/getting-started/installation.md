# CapiscIO Node.js CLI

The **CapiscIO Node.js CLI** is a lightweight wrapper that automatically downloads and executes the high-performance [CapiscIO Core](https://github.com/capiscio/capiscio-core) binary.

It provides a seamless experience for JavaScript/TypeScript developers, allowing you to install the CLI via `npm` or `pnpm` without worrying about platform-specific binaries.

## Installation

```bash
npm install -g capiscio
# or
pnpm add -g capiscio
```

## Usage

Once installed, the `capiscio` command is available in your terminal. It passes all arguments directly to the underlying Core binary.

```bash
# Validate an agent card
capiscio validate ./agent-card.json

# Check version
capiscio version
```

For full command reference, see the [CapiscIO Core Documentation](../../capiscio-core/reference/cli.md).

## How it Works

1.  **Detection**: When you run `capiscio`, the wrapper detects your Operating System (Linux, macOS, Windows) and Architecture (AMD64, ARM64).
2.  **Download**: It checks if the correct `capiscio-core` binary is present in your global `node_modules` or user cache. If not, it downloads it securely from GitHub Releases.
3.  **Execution**: It executes the binary with your provided arguments, piping input and output directly to your terminal.

## Requirements

*   Node.js 18+
*   Internet connection (for initial binary download)
