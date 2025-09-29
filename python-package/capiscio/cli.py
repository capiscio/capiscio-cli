#!/usr/bin/env python3
"""
Capiscio CLI Wrapper

This module provides a Python wrapper for the Capiscio CLI tool.
It automatically detects the current platform and architecture,
then executes the appropriate pre-built binary.
"""

import os
import sys
import platform
import subprocess
from pathlib import Path
from typing import List, Optional


def get_platform_binary() -> str:
    """
    Determine the correct binary name for the current platform and architecture.
    
    Returns:
        str: The binary filename for this platform
        
    Raises:
        RuntimeError: If the platform/architecture combination is not supported
    """
    system = platform.system().lower()
    machine = platform.machine().lower()
    
    # Normalize architecture names
    if machine in ('x86_64', 'amd64'):
        arch = 'x64'
    elif machine in ('arm64', 'aarch64'):
        arch = 'arm64'
    else:
        # Default to x64 for unknown architectures
        arch = 'x64'
    
    # Map platform names
    if system == 'linux':
        return f'capiscio-linux-{arch}'
    elif system == 'darwin':  # macOS
        return f'capiscio-darwin-{arch}'
    elif system == 'windows':
        return f'capiscio-win-{arch}.exe'
    else:
        raise RuntimeError(f"Unsupported platform: {system} {machine}")


def get_binary_path() -> Path:
    """
    Get the full path to the appropriate binary for this platform.
    
    Returns:
        Path: Path to the binary file
        
    Raises:
        FileNotFoundError: If the binary doesn't exist
        RuntimeError: If the platform is not supported
    """
    binary_name = get_platform_binary()
    
    # Get the directory where this Python file is located
    package_dir = Path(__file__).parent
    binary_path = package_dir / 'binaries' / binary_name
    
    if not binary_path.exists():
        available_binaries = list((package_dir / 'binaries').glob('*'))
        available_names = [b.name for b in available_binaries if b.is_file()]
        
        raise FileNotFoundError(
            f"Binary '{binary_name}' not found. "
            f"Available binaries: {', '.join(available_names) or 'none'}"
        )
    
    return binary_path


def run_capiscio(args: Optional[List[str]] = None) -> int:
    """
    Execute the Capiscio CLI tool with the given arguments.
    
    Args:
        args: Command line arguments to pass to capiscio (default: sys.argv[1:])
        
    Returns:
        int: Exit code from the capiscio process
        
    Raises:
        FileNotFoundError: If the binary doesn't exist
        RuntimeError: If the platform is not supported
    """
    if args is None:
        args = sys.argv[1:]
    
    binary_path = get_binary_path()
    
    # Make sure the binary is executable on Unix-like systems
    if os.name != 'nt':  # Not Windows
        os.chmod(binary_path, 0o755)
    
    try:
        # Execute the binary with the provided arguments
        result = subprocess.run([str(binary_path)] + args)
        return result.returncode
    except KeyboardInterrupt:
        # Handle Ctrl+C gracefully
        return 130
    except Exception as e:
        print(f"Error executing capiscio: {e}", file=sys.stderr)
        return 1


def main() -> int:
    """
    Main entry point for the capiscio command.
    
    This function is called when running `capiscio` from the command line
    after installing the package via pip.
    
    Returns:
        int: Exit code
    """
    try:
        return run_capiscio()
    except Exception as e:
        print(f"capiscio: {e}", file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())