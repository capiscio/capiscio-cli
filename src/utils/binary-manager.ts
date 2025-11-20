import fs from 'fs';
import path from 'path';
import os from 'os';
import axios from 'axios';
import { promisify } from 'util';
import stream from 'stream';
import ora from 'ora';

const pipeline = promisify(stream.pipeline);

// Configuration
const BINARY_NAME = 'capiscio-core';
const REPO_OWNER = 'capiscio';
const REPO_NAME = 'capiscio-core';

// Allow version override via env var or package.json
// TODO: Update this to the actual release version you want to pin
const DEFAULT_VERSION = 'v1.0.2';
const VERSION = process.env.CAPISCIO_CORE_VERSION || DEFAULT_VERSION;

export class BinaryManager {
  private static instance: BinaryManager;
  private binaryPath: string;
  private installDir: string;

  private constructor() {
    // Store binary in node_modules/.bin or a local bin directory
    // We need to find the package root to ensure we store it in the right place
    // regardless of whether we're running from src (dev) or dist (prod)
    
    // Check if running in pkg
    // @ts-ignore
    if ('pkg' in process) {
      // In pkg, we should store the binary next to the executable
      this.installDir = path.dirname(process.execPath);
    } else {
      const packageRoot = this.findPackageRoot();
      this.installDir = path.join(packageRoot, 'bin');
    }
    
    // Ensure bin directory exists
    if (!fs.existsSync(this.installDir)) {
      try {
        fs.mkdirSync(this.installDir, { recursive: true });
      } catch (error) {
        // If we can't create the directory (e.g. permission denied or read-only fs), 
        // fallback to a user-writable directory
        this.installDir = path.join(os.homedir(), '.capiscio', 'bin');
        if (!fs.existsSync(this.installDir)) {
          fs.mkdirSync(this.installDir, { recursive: true });
        }
      }
    }
    
    const platform = this.getPlatform();
    const ext = platform === 'windows' ? '.exe' : '';
    this.binaryPath = path.join(this.installDir, `${BINARY_NAME}${ext}`);
  }

  private findPackageRoot(): string {
    let currentDir = __dirname;
    // Look for package.json up the directory tree
    // Limit to 5 levels up to prevent infinite loops or going too far
    for (let i = 0; i < 5; i++) {
      if (fs.existsSync(path.join(currentDir, 'package.json'))) {
        return currentDir;
      }
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) break;
      currentDir = parentDir;
    }
    // Fallback: assume we are in dist/ or src/utils/ and go up appropriately
    // If we can't find package.json, we might be in a bundled environment where it's not included
    // In that case, try to use the directory of the main module or process.cwd()
    return path.resolve(__dirname, '..'); 
  }

  public static getInstance(): BinaryManager {
    if (!BinaryManager.instance) {
      BinaryManager.instance = new BinaryManager();
    }
    return BinaryManager.instance;
  }

  public async getBinaryPath(): Promise<string> {
    // Check for environment variable override
    if (process.env.CAPISCIO_CORE_PATH) {
      if (fs.existsSync(process.env.CAPISCIO_CORE_PATH)) {
        return process.env.CAPISCIO_CORE_PATH;
      }
      console.warn(`Warning: CAPISCIO_CORE_PATH set to '${process.env.CAPISCIO_CORE_PATH}' but file does not exist. Falling back to managed binary.`);
    }

    if (!fs.existsSync(this.binaryPath)) {
      await this.install();
    }
    return this.binaryPath;
  }

  private async install(): Promise<void> {
    const spinner = ora('Downloading CapiscIO Core binary...').start();
    
    try {
      const platform = this.getPlatform();
      const arch = this.getArch();
      
      // Construct download URL
      // Assets are named: capiscio-{platform}-{arch} (e.g. capiscio-linux-amd64)
      // Windows has .exe extension
      let assetName = `capiscio-${platform}-${arch}`;
      if (platform === 'windows') {
        assetName += '.exe';
      }
      
      const url = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${VERSION}/${assetName}`;

      // Download
      const response = await axios.get(url, { responseType: 'stream' });
      
      // Write directly to a temp file
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'capiscio-'));
      const tempFilePath = path.join(tempDir, assetName);
      
      const writer = fs.createWriteStream(tempFilePath);
      await pipeline(response.data, writer);

      // Move to install dir
      // We rename it to capiscio-core (or .exe) for internal consistency
      fs.copyFileSync(tempFilePath, this.binaryPath);
      
      if (platform !== 'windows') {
        fs.chmodSync(this.binaryPath, 0o755); // Make executable
      }

      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });

      spinner.succeed(`Installed CapiscIO Core ${VERSION}`);
    } catch (error: any) {
      spinner.fail('Failed to install binary');
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          console.error(`\nError: Could not find binary version ${VERSION} for ${this.getPlatform()}/${this.getArch()}`);
          console.error('Please check the version and platform support.');
        } else {
          console.error(`\nNetwork error: ${error.message}`);
        }
      } else {
        console.error(`\nError: ${error.message}`);
      }
      
      // Attempt cleanup if tempDir was created (though it's local to try block, 
      // in a real scenario we'd scope it wider or rely on OS cleanup for temp files)
      throw error;
    }
  }

  private getPlatform(): string {
    const platform = os.platform();
    switch (platform) {
      case 'darwin': return 'darwin';
      case 'linux': return 'linux';
      case 'win32': return 'windows';
      default: throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  private getArch(): string {
    const arch = os.arch();
    switch (arch) {
      case 'x64': return 'amd64';
      case 'arm64': return 'arm64';
      default: throw new Error(`Unsupported architecture: ${arch}`);
    }
  }
}
