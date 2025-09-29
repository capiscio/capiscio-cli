import { Command } from 'commander';
import chalk from 'chalk';
import { ValidateCommand } from './commands/validate';
// Import version directly from package.json at build time
import { version } from '../package.json';

const program = new Command();

program
  .name('capiscio')
  .description('The definitive CLI tool for validating A2A (Agent-to-Agent) protocol agent cards')
  .version(version);

// Register commands
ValidateCommand.register(program);

// Global error handling
process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Unexpected error:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('❌ Unhandled rejection:'), reason);
  process.exit(1);
});

program.parse();