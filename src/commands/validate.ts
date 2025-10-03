import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { A2AValidator } from '../validator/a2a-validator';
import { LiveTester } from '../validator/live-tester';
import { ConsoleOutput } from '../output/console';
import { JsonOutput } from '../output/json';
import { resolveInput, readAgentCard } from '../utils/file-utils';
import { CLIOptions } from '../types';
import { calculateScores, createScoringContext } from '../scoring/index.js';

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

      // Perform live agent testing if requested
      if (options.testLive && !options.schemaOnly) {
        const liveSpinner = ora('Testing live agent endpoint...').start();
        
        try {
          // Get agent card for live testing
          let agentCard;
          if (resolved.type === 'file') {
            agentCard = await readAgentCard(resolved.value);
          } else {
            // For URL input, we need to fetch the agent card
            // We'll use the result from validation if available
            agentCard = validationInput;
          }

          const liveTester = new LiveTester({
            timeout: parseInt(options.timeout || '10000'),
            verbose: options.verbose || false
          });

          const liveResult = await liveTester.testAgent(agentCard);
          result.liveTest = liveResult;

          if (liveResult.success) {
            liveSpinner.succeed(`Live test passed (${liveResult.responseTime}ms)`);
          } else {
            liveSpinner.fail('Live test failed');
            
            // Update overall result
            result.success = false;
            liveResult.errors.forEach(error => {
              result.errors.push({
                code: 'LIVE_TEST_FAILED',
                message: error,
                severity: 'error' as const,
                fixable: false
              });
            });
          }
        } catch (error) {
          liveSpinner.fail('Live test error');
          result.success = false;
          result.errors.push({
            code: 'LIVE_TEST_ERROR',
            message: `Live test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'error' as const,
            fixable: false
          });
        }
      } else if (options.testLive && options.schemaOnly) {
        console.log(chalk.yellow('⚠️  --test-live requires network access and cannot be used with --schema-only'));
      }

      // Calculate detailed scores (always)
      try {
        // Get agent card
        let agentCard;
        if (resolved.type === 'file') {
          agentCard = await readAgentCard(resolved.value);
        } else {
          agentCard = validationInput;
        }

        // Create scoring context
        const scoringContext = createScoringContext({
          schemaOnly: options.schemaOnly || resolved.type === 'file',
          skipSignatureVerification: options.skipSignature || false,
          testLive: options.testLive || false,
          strictMode: options.strict || options.registryReady || false,
        });

        // Prepare scoring input
        const scoringInput: any = {
          agentCard,
          validationErrors: result.errors.map(e => e.message),
        };

        if (result.liveTest) {
          scoringInput.liveTestResult = {
            success: result.liveTest.success,
            responseTime: result.liveTest.responseTime,
            errors: result.liveTest.errors,
            response: result.liveTest.response,
          };
        }

        // Calculate scores
        const scoringResult = calculateScores(scoringInput, scoringContext);
        result.scoringResult = scoringResult;
      } catch (error) {
        console.error(chalk.yellow(`⚠️  Could not calculate detailed scores: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }

      // Choose output format and display results
      const outputFormatter = options.json ? new JsonOutput() : new ConsoleOutput();
      outputFormatter.display(result, resolved.value, options);

      // Exit with appropriate code
      // Exit codes: 0=success, 1=validation/schema failed, 2=network error, 3=protocol violation
      if (!result.success) {
        // Check if failure is due to live test
        if (result.liveTest && !result.liveTest.success) {
          const hasNetworkError = result.liveTest.errors.some(err => 
            err.includes('timeout') || 
            err.includes('refused') || 
            err.includes('unreachable') ||
            err.includes('DNS')
          );
          process.exit(hasNetworkError ? 2 : 3); // 2=network, 3=protocol
        }
        process.exit(1); // Schema/validation failure
      }
      process.exit(0); // Success

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