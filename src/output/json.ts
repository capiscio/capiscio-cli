import { ValidationResult, CLIOptions } from '../types';

export class JsonOutput {
  display(result: ValidationResult, input: string, options: CLIOptions): void {
    console.log(JSON.stringify(result, null, 2));
  }
}