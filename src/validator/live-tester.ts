import { validateRuntimeMessage } from './runtime-validators';
import { AgentCard } from '../types';

export interface LiveTestResult {
  success: boolean;
  endpoint: string;
  responseTime: number;
  errors: string[];
  request?: any;
  response?: any;
  timestamp: string;
}

export interface LiveTestOptions {
  timeout?: number;
  verbose?: boolean;
  testMessage?: string;
}

export class LiveTester {
  private timeout: number;
  private verbose: boolean;

  constructor(options: LiveTestOptions = {}) {
    this.timeout = options.timeout || 10000;
    this.verbose = options.verbose || false;
  }

  /**
   * Test a live agent by sending a test message and validating the response
   */
  async testAgent(agentCard: AgentCard, options: LiveTestOptions = {}): Promise<LiveTestResult> {
    const startTime = Date.now();
    const endpoint = agentCard.url;
    const testMessage = options.testMessage || 'Hello, are you available?';
    const transport = agentCard.preferredTransport || 'JSONRPC';

    // Validate endpoint exists
    if (!endpoint) {
      return {
        success: false,
        endpoint: 'undefined',
        responseTime: 0,
        errors: ['Agent card does not specify a valid endpoint URL'],
        timestamp: new Date().toISOString()
      };
    }

    // Check if transport is supported
    if (transport === 'GRPC') {
      return {
        success: false,
        endpoint,
        responseTime: 0,
        errors: ['GRPC transport is not yet supported for live testing'],
        timestamp: new Date().toISOString()
      };
    }

    try {
      // Build A2A message
      const a2aMessage = {
        role: 'user',
        parts: [
          {
            type: 'text',
            text: testMessage
          }
        ]
      };

      // Format request based on transport protocol
      let request: any;
      let requestBody: any;

      if (transport === 'JSONRPC') {
        // JSON-RPC wraps the message in an RPC envelope
        request = {
          jsonrpc: '2.0',
          id: this.generateRequestId(),
          method: 'message/send',
          params: {
            message: a2aMessage,
            configuration: {
              accepted_output_modes: ['text/plain']
            }
          }
        };
        requestBody = request;
      } else {
        // HTTP+JSON and REST send the message directly
        request = {
          message: a2aMessage,
          configuration: {
            accepted_output_modes: ['text/plain']
          }
        };
        requestBody = request;
      }

      if (this.verbose) {
        console.log(`[Live Test] Transport: ${transport}`);
        console.log('[Live Test] Request:', JSON.stringify(requestBody, null, 2));
      }

      // Call the agent endpoint
      const response = await this.callEndpoint(endpoint, requestBody);
      const responseTime = Date.now() - startTime;

      if (this.verbose) {
        console.log('[Live Test] Response:', JSON.stringify(response, null, 2));
      }

      // Extract the result based on transport protocol
      let resultData: any;

      if (transport === 'JSONRPC') {
        // JSON-RPC response has result field
        resultData = response.result;
        
        if (!resultData) {
          return {
            success: false,
            endpoint,
            responseTime,
            errors: ['JSON-RPC response missing result field'],
            request: requestBody,
            response,
            timestamp: new Date().toISOString()
          };
        }
      } else {
        // HTTP+JSON response is the result directly
        resultData = response;
      }

      // Validate the response using runtime validators
      const validation = validateRuntimeMessage(resultData);

      if (!validation.valid) {
        return {
          success: false,
          endpoint,
          responseTime,
          errors: validation.errors.map(err => err.message),
          request: requestBody,
          response: resultData,
          timestamp: new Date().toISOString()
        };
      }

      // Success!
      return {
        success: true,
        endpoint,
        responseTime,
        errors: [],
        request: requestBody,
        response: resultData,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        success: false,
        endpoint,
        responseTime,
        errors: [this.formatError(error)],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Call the agent endpoint with timeout handling
   */
  private async callEndpoint(url: string, requestBody: any): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error(`Expected JSON response, got ${contentType || 'unknown'}`);
      }

      return await response.json();

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Format error messages for better readability
   */
  private formatError(error: unknown): string {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return `Request timed out after ${this.timeout}ms`;
      }
      
      // Network errors
      if (error.message.includes('ECONNREFUSED')) {
        return 'Connection refused - endpoint unreachable';
      }
      if (error.message.includes('ENOTFOUND')) {
        return 'DNS resolution failed - host not found';
      }
      if (error.message.includes('ETIMEDOUT')) {
        return 'Connection timed out';
      }
      if (error.message.includes('certificate')) {
        return `TLS certificate error: ${error.message}`;
      }

      return error.message;
    }

    return 'Unknown error occurred';
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
