import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { A2AValidator } from '../validator/a2a-validator';
import { ConsoleOutput } from '../output/console';
import { JsonOutput } from '../output/json';
import { resolveInput, readAgentCard } from '../utils/file-utils';
import { CLIOptions } from '../types';

export class ValidateCommand {
  static register(program: Command): void {
    program
      .command('validate')
      .description('Validate an A2A agent card')
      .argument('[input]', 'Agent URL, file path, or auto-detect')
      .option('--strict', 'Enable strict validation mode')
      .option('--progressive', 'Enable progressive validation mode (default)')
      .option('--conservative', 'Enable conservative validation mode')
      .option('--skip-signature', 'Skip JWS signature verification (not recommended)')
      .option('--registry-ready', 'Check registry deployment readiness')
      .option('--schema-only', 'Validate schema only, skip endpoint testing')
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
    const spinner = ora('Validating A2A agent...').start();
    
    try {
      // Resolve input to file or URL
      const resolved = await resolveInput(input);
      
      if (!resolved) {
        spinner.fail('No agent card found');
        console.error(chalk.red('❌ No agent card found. Please provide a file path or URL to an agent card.'));
        process.exit(1);
      }

      spinner.text = `Validating A2A agent: ${resolved.value}`;

      // Prepare validation input
      let validationInput: string | any;
      if (resolved.type === 'file') {
        const agentCard = await readAgentCard(resolved.value);
        validationInput = agentCard;
        spinner.text = `Validating A2A agent from file: ${resolved.value}`;
      } else {
        validationInput = resolved.value;
        spinner.text = `Validating A2A agent from URL: ${resolved.value}`;
      }

      // Create validator
      const validator = new A2AValidator();
      
      // Set validation options
      const validationOptions = {
        strictness: this.getStrictness(options),
        timeout: parseInt(options.timeout || '10000'),
        skipDynamic: options.schemaOnly || resolved.type === 'file',
        verbose: options.verbose || false,
        ...(options.skipSignature !== undefined && { skipSignatureVerification: options.skipSignature }),
        ...(options.registryReady !== undefined && { registryReady: options.registryReady }),
        ...(options.showVersion !== undefined && { showVersionCompat: options.showVersion })
      };

      // Perform validation
      let result;
      if (options.strict || options.registryReady) {
        result = await validator.validateStrict(validationInput, validationOptions);
      } else if (options.conservative) {
        result = await validator.validateConservative(validationInput, validationOptions);
      } else {
        result = await validator.validateProgressive(validationInput, validationOptions);
      }

      spinner.stop();

      // Choose output format and display results
      const outputFormatter = options.json ? new JsonOutput() : new ConsoleOutput();
      outputFormatter.display(result, resolved.value, options);

      // Exit with appropriate code
      process.exit(result.success ? 0 : 1);

    } catch (error) {
      spinner.fail('Validation failed');
      console.error(chalk.red(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  }

  private static getStrictness(options: CLIOptions): 'strict' | 'progressive' | 'conservative' {
    if (options.strict || options.registryReady) return 'strict';
    if (options.conservative) return 'conservative';
    return 'progressive';
  }
}