import { HttpClient, HttpResponse, HttpError, RequestOptions } from '../types';
import { Logger } from '../utils/logger';

export class FetchHttpClient implements HttpClient {
  private logger?: Logger;

  constructor(logger?: Logger) {
    if (logger) {
      this.logger = logger;
    }
  }

  async get(url: string, options: RequestOptions = {}): Promise<HttpResponse> {
    const startTime = Date.now();
    this.logger?.debug(`Initiating HTTP GET request to ${url}`);
    
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(), 
      options.timeout || 10000
    );

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'capiscio-cli/1.1.0',
          ...options.headers
        },
        signal: options.signal || controller.signal
      });

      clearTimeout(timeout);
      const duration = Date.now() - startTime;
      
      this.logger?.network('GET', url, response.status, duration);

      if (!response.ok) {
        this.logger?.error(`HTTP request failed: ${response.status} ${response.statusText}`);
        throw new HttpError(
          `HTTP ${response.status}: ${response.statusText}`, 
          response.status,
          this.getErrorCode(response.status)
        );
      }

      const data = await response.json();
      return {
        status: response.status,
        data,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error) {
      clearTimeout(timeout);
      throw this.normalizeError(error);
    }
  }

  private normalizeError(error: unknown): HttpError {
    if (error instanceof HttpError) {
      return error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return new HttpError('Request timeout', 408, 'TIMEOUT');
      }
      
      if (error.message.includes('fetch')) {
        return new HttpError('Network error', 0, 'NETWORK_ERROR');
      }

      if (error.message.includes('ENOTFOUND')) {
        return new HttpError('Domain not found - check the URL', 0, 'ENOTFOUND');
      }

      if (error.message.includes('ECONNREFUSED')) {
        return new HttpError('Connection refused - agent endpoint not accessible', 0, 'ECONNREFUSED');
      }

      return new HttpError(error.message, 0, 'UNKNOWN');
    }

    return new HttpError('Unknown error', 0, 'UNKNOWN');
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case 400: return 'BAD_REQUEST';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 408: return 'TIMEOUT';
      case 429: return 'RATE_LIMITED';
      case 500: return 'INTERNAL_SERVER_ERROR';
      case 502: return 'BAD_GATEWAY';
      case 503: return 'SERVICE_UNAVAILABLE';
      case 504: return 'GATEWAY_TIMEOUT';
      default: return 'HTTP_ERROR';
    }
  }
}