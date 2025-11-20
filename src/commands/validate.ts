import { Command } from 'commander';
import chalk from 'chalk';
import execa from 'execa';
import { BinaryManager } from '../utils/binary-manager';
import { CLIOptions } from '../types';

export class ValidateCommand {
  static register(program: Command): void {
    program
      .command('validate')
      .description('Validate an A2A agent card')
      .argument('[input]', 'Agent URL, file path, or auto-detect')
      .option('--strict', 'Enable strict validation mode')
      .option('--progressive', 'Enable progressive validation mode (default)')
      // .option('--conservative', 'Enable conservative validation mode')
      .option('--skip-signature', 'Skip JWS signature verification (not recommended)')
      .option('--registry-ready', 'Check registry deployment readiness')
      .option('--schema-only', 'Validate schema only, skip endpoint testing')
      .option('--test-live', 'Test live agent endpoint by sending a message')
      .option('--json', 'Output results in JSON format')
      .option('--errors-only', 'Show only errors and warnings')
      .option('--verbose', 'Show detailed validation steps and timing')
      .option('--timeout <ms>', 'Request timeout in milliseconds', '10000')
      .option('--show-version', 'Display detailed version compatibility analysis')
      .action(async (input, options) => {
        await this.execute(input, options);
      });
  }

  static async execute(input: string | undefined, options: CLIOptions): Promise<void> {
    try {
      const binaryManager = BinaryManager.getInstance();
      const binaryPath = await binaryManager.getBinaryPath();

      const args = ['validate'];

      if (input) {
        args.push(input);
      } else {
        // Default to agent-card.json if no input provided
        // This matches the behavior of the previous Node CLI
        args.push('agent-card.json');
      }

      // Map flags
      if (options.strict) args.push('--strict');
      if (options.progressive) args.push('--progressive');
      // Conservative mode is not supported in the core binary yet
      // if (options.conservative) args.push('--conservative');
      if (options.skipSignature) args.push('--skip-signature');
      if (options.registryReady) args.push('--registry-ready');
      if (options.schemaOnly) args.push('--schema-only');
      if (options.testLive) args.push('--test-live');
      if (options.json) args.push('--json');
      if (options.errorsOnly) args.push('--errors-only');
      if (options.verbose) args.push('--verbose');
      
      if (options.timeout) {
        // Convert ms string to Go duration string (e.g. "10000" -> "10s")
        const ms = parseInt(options.timeout);
        if (!isNaN(ms)) {
          args.push('--timeout', `${ms}ms`);
        }
      }

      // Execute binary
      // We inherit stdio so the binary's output goes directly to the user's terminal
      const subprocess = execa(binaryPath, args, {
        stdio: 'inherit',
        reject: false // Don't throw on non-zero exit code, we handle it manually
      });

      const result = await subprocess;
      process.exit(result.exitCode);

    } catch (error) {
      console.error(chalk.red(`❌ Error executing CapiscIO Core: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  }
}
