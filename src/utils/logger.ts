import chalk from 'chalk';

export class Logger {
  private verbose: boolean;
  private startTime: number;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
    this.startTime = Date.now();
  }

  /**
   * Log verbose information - only shown when --verbose is enabled
   */
  debug(message: string, metadata?: any): void {
    if (!this.verbose) return;
    
    const timestamp = this.getRelativeTime();
    console.log(chalk.gray(`[${timestamp}] 🔍 ${message}`));
    
    if (metadata) {
      console.log(chalk.gray(`    ${JSON.stringify(metadata, null, 2)}`));
    }
  }

  /**
   * Log step information - only shown when --verbose is enabled
   */
  step(step: string, duration?: number): void {
    if (!this.verbose) return;
    
    const timestamp = this.getRelativeTime();
    const durationText = duration ? chalk.cyan(`(${duration}ms)`) : '';
    console.log(chalk.blue(`[${timestamp}] ⚡ ${step} ${durationText}`));
  }

  /**
   * Log timing information - only shown when --verbose is enabled
   */
  timing(operation: string, duration: number): void {
    if (!this.verbose) return;
    
    const timestamp = this.getRelativeTime();
    console.log(chalk.yellow(`[${timestamp}] ⏱️  ${operation}: ${duration}ms`));
  }

  /**
   * Log error details - only shown when --verbose is enabled
   */
  error(message: string, error?: any): void {
    if (!this.verbose) return;
    
    const timestamp = this.getRelativeTime();
    console.log(chalk.red(`[${timestamp}] ❌ ${message}`));
    
    if (error) {
      if (error.stack) {
        console.log(chalk.red(`    Stack: ${error.stack}`));
      } else {
        console.log(chalk.red(`    Error: ${JSON.stringify(error, null, 2)}`));
      }
    }
  }

  /**
   * Log network request details - only shown when --verbose is enabled
   */
  network(method: string, url: string, status?: number, duration?: number): void {
    if (!this.verbose) return;
    
    const timestamp = this.getRelativeTime();
    const statusText = status ? chalk.green(`${status}`) : '';
    const durationText = duration ? chalk.cyan(`${duration}ms`) : '';
    console.log(chalk.magenta(`[${timestamp}] 🌐 ${method} ${url} ${statusText} ${durationText}`));
  }

  /**
   * Get time elapsed since logger creation
   */
  private getRelativeTime(): string {
    const elapsed = Date.now() - this.startTime;
    return `+${elapsed}ms`;
  }

  /**
   * Create a timer function for measuring operation duration
   */
  timer(): () => number {
    const start = Date.now();
    return () => Date.now() - start;
  }
}