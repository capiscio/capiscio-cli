import { Command } from 'commander';
import chalk from 'chalk';
import { ValidateCommand } from './commands/validate';

const program = new Command();

program
  .name('capiscio')
  .description('The definitive CLI tool for validating A2A (Agent-to-Agent) protocol agent cards')
  .version('1.0.0');

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