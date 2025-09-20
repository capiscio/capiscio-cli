import { ValidationResult, CLIOptions } from '../types';

export class JsonOutput {
  display(result: ValidationResult, _input: string, _options: CLIOptions): void {
    console.log(JSON.stringify(result, null, 2));
  }
}