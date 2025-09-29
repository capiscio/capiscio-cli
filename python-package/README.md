# Capiscio CLI - Python Package

A Python package that provides the Capiscio A2A protocol validator as a pip-installable CLI tool.

## Installation

```bash
pip install capiscio
```

## Usage

After installation, you can use the `capiscio` command directly from your terminal:

```bash
# Validate an agent.json file
capiscio validate agent.json

# Check version
capiscio --version

# Get help
capiscio --help
```

## What's Inside

This package contains pre-built binaries of the Capiscio CLI tool for multiple platforms:
- Linux x64/ARM64
- macOS x64/ARM64 (Intel/Apple Silicon)
- Windows x64/ARM64

The Python wrapper automatically detects your platform and runs the appropriate binary.

## Platform Support

- **Linux**: x86_64, ARM64
- **macOS**: Intel (x64), Apple Silicon (ARM64)
- **Windows**: x64, ARM64
- **Python**: 3.7+ (no Python dependencies required for CLI functionality)

## Development

This is a wrapper package around the Node.js-based Capiscio CLI. The actual CLI logic is implemented in Node.js and compiled to standalone binaries for distribution.

For the underlying CLI source code, see: https://github.com/capiscio/capiscio-cli

## License

MIT License - see the main repository for details.