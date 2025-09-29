import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FetchHttpClient } from '../validator/http-client';
import { HttpError } from '../types';
import { Logger } from '../utils/logger';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock AbortController
const mockAbort = vi.fn();
const mockAbortController = {
  abort: mockAbort,
  signal: { aborted: false }
};
global.AbortController = vi.fn(() => mockAbortController) as any;

// Mock setTimeout and clearTimeout
const mockSetTimeout = vi.fn();
const mockClearTimeout = vi.fn();
global.setTimeout = mockSetTimeout as any;
global.clearTimeout = mockClearTimeout as any;

describe('FetchHttpClient', () => {
  let httpClient: FetchHttpClient;
  let mockLogger: Logger;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogger = {
      debug: vi.fn(),
      network: vi.fn(),
      error: vi.fn(),
    } as any;
    
    // Default timeout behavior
    mockSetTimeout.mockReturnValue('timeout-id');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should create instance without logger', () => {
      const client = new FetchHttpClient();
      expect(client).toBeInstanceOf(FetchHttpClient);
    });

    it('should create instance with logger', () => {
      const client = new FetchHttpClient(mockLogger);
      expect(client).toBeInstanceOf(FetchHttpClient);
    });
  });

  describe('Successful GET requests', () => {
    beforeEach(() => {
      httpClient = new FetchHttpClient(mockLogger);
    });

    it('should make successful GET request and return data', async () => {
      const mockResponseData = { name: 'Test Agent', version: '1.0.0' };
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockResponseData),
        headers: new Map([['content-type', 'application/json']])
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      const result = await httpClient.get('https://example.com/agent-card.json');

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/agent-card.json', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'capiscio-cli/1.1.0'
        },
        signal: mockAbortController.signal
      });

      expect(result.status).toBe(200);
      expect(result.data).toEqual(mockResponseData);
      expect(result.headers).toEqual({ 'content-type': 'application/json' });
      expect(mockClearTimeout).toHaveBeenCalledWith('timeout-id');
    });

    it('should include custom headers in request', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}),
        headers: new Map()
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      await httpClient.get('https://example.com/test', {
        headers: { 'Authorization': 'Bearer token123' }
      });

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/test', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'capiscio-cli/1.1.0',
          'Authorization': 'Bearer token123'
        },
        signal: mockAbortController.signal
      });
    });

    it('should use custom timeout', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}),
        headers: new Map()
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      await httpClient.get('https://example.com/test', { timeout: 5000 });

      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);
    });

    it('should use default timeout when not specified', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}),
        headers: new Map()
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      await httpClient.get('https://example.com/test');

      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 10000);
    });

    it('should use custom abort signal when provided', async () => {
      const customController = new AbortController();
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}),
        headers: new Map()
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      await httpClient.get('https://example.com/test', { 
        signal: customController.signal 
      });

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/test', 
        expect.objectContaining({
          signal: customController.signal
        })
      );
    });

    it('should log debug and network information', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}),
        headers: new Map()
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      await httpClient.get('https://example.com/test');

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Initiating HTTP GET request to https://example.com/test'
      );
      expect(mockLogger.network).toHaveBeenCalledWith(
        'GET', 
        'https://example.com/test', 
        200, 
        expect.any(Number)
      );
    });
  });

  describe('HTTP Error responses', () => {
    beforeEach(() => {
      httpClient = new FetchHttpClient(mockLogger);
    });

    it('should handle 404 Not Found', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found'
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      await expect(httpClient.get('https://example.com/missing')).rejects.toThrow(
        expect.objectContaining({
          message: 'HTTP 404: Not Found',
          status: 404,
          code: 'NOT_FOUND'
        })
      );

      expect(mockLogger.error).toHaveBeenCalledWith('HTTP request failed: 404 Not Found');
    });

    it('should handle 401 Unauthorized', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      await expect(httpClient.get('https://example.com/protected')).rejects.toThrow(
        expect.objectContaining({
          status: 401,
          code: 'UNAUTHORIZED'
        })
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      await expect(httpClient.get('https://example.com/error')).rejects.toThrow(
        expect.objectContaining({
          status: 500,
          code: 'INTERNAL_SERVER_ERROR'
        })
      );
    });

    it('should handle 429 Rate Limited', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      await expect(httpClient.get('https://example.com/rate-limited')).rejects.toThrow(
        expect.objectContaining({
          status: 429,
          code: 'RATE_LIMITED'
        })
      );
    });

    it('should handle unknown HTTP status codes', async () => {
      const mockResponse = {
        ok: false,
        status: 418,
        statusText: "I'm a teapot"
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      await expect(httpClient.get('https://example.com/teapot')).rejects.toThrow(
        expect.objectContaining({
          status: 418,
          code: 'HTTP_ERROR'
        })
      );
    });
  });

  describe('Network and timeout errors', () => {
    beforeEach(() => {
      httpClient = new FetchHttpClient(mockLogger);
    });

    it('should handle timeout errors', async () => {
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      await expect(httpClient.get('https://example.com/slow')).rejects.toThrow(
        expect.objectContaining({
          message: 'Request timeout',
          status: 408,
          code: 'TIMEOUT'
        })
      );
    });

    it('should handle DNS resolution errors', async () => {
      const dnsError = new Error('getaddrinfo ENOTFOUND invalid-domain.com');
      mockFetch.mockRejectedValue(dnsError);

      await expect(httpClient.get('https://invalid-domain.com/test')).rejects.toThrow(
        expect.objectContaining({
          message: 'Domain not found - check the URL',
          status: 0,
          code: 'ENOTFOUND'
        })
      );
    });

    it('should handle connection refused errors', async () => {
      const connError = new Error('connect ECONNREFUSED 127.0.0.1:8080');
      mockFetch.mockRejectedValue(connError);

      await expect(httpClient.get('https://localhost:8080/test')).rejects.toThrow(
        expect.objectContaining({
          message: 'Connection refused - agent endpoint not accessible',
          status: 0,
          code: 'ECONNREFUSED'
        })
      );
    });

    it('should handle generic fetch errors', async () => {
      const fetchError = new Error('fetch failed');
      mockFetch.mockRejectedValue(fetchError);

      await expect(httpClient.get('https://example.com/fetch-error')).rejects.toThrow(
        expect.objectContaining({
          message: 'Network error',
          status: 0,
          code: 'NETWORK_ERROR'
        })
      );
    });

    it('should handle unknown errors', async () => {
      const unknownError = new Error('Something unexpected happened');
      mockFetch.mockRejectedValue(unknownError);

      await expect(httpClient.get('https://example.com/unknown')).rejects.toThrow(
        expect.objectContaining({
          message: 'Something unexpected happened',
          status: 0,
          code: 'UNKNOWN'
        })
      );
    });

    it('should handle non-Error exceptions', async () => {
      mockFetch.mockRejectedValue('string error');

      await expect(httpClient.get('https://example.com/weird')).rejects.toThrow(
        expect.objectContaining({
          message: 'Unknown error',
          status: 0,
          code: 'UNKNOWN'
        })
      );
    });

    it('should handle HttpError exceptions passthrough', async () => {
      const httpError = new HttpError('Custom HTTP error', 403, 'CUSTOM_ERROR');
      mockFetch.mockRejectedValue(httpError);

      await expect(httpClient.get('https://example.com/custom')).rejects.toThrow(httpError);
    });
  });

  describe('Timeout handling', () => {
    beforeEach(() => {
      httpClient = new FetchHttpClient();
    });

    it('should set up timeout and clear it on success', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}),
        headers: new Map()
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      await httpClient.get('https://example.com/test');

      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 10000);
      expect(mockClearTimeout).toHaveBeenCalledWith('timeout-id');
    });

    it('should clear timeout on error', async () => {
      const error = new Error('Network error');
      mockFetch.mockRejectedValue(error);

      try {
        await httpClient.get('https://example.com/error');
      } catch (e) {
        // Expected error
      }

      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 10000);
      expect(mockClearTimeout).toHaveBeenCalledWith('timeout-id');
    });

    it('should call abort when timeout fires', async () => {
      // Simulate timeout firing
      let timeoutCallback: Function;
      mockSetTimeout.mockImplementation((callback) => {
        timeoutCallback = callback;
        return 'timeout-id';
      });

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}),
        headers: new Map()
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      const promise = httpClient.get('https://example.com/test');
      
      // Fire the timeout
      timeoutCallback!();
      
      await promise;

      expect(mockAbort).toHaveBeenCalled();
    });
  });

  describe('Client without logger', () => {
    beforeEach(() => {
      httpClient = new FetchHttpClient(); // No logger
    });

    it('should work without logger', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ test: 'data' }),
        headers: new Map()
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      const result = await httpClient.get('https://example.com/test');

      expect(result.status).toBe(200);
      expect(result.data).toEqual({ test: 'data' });
      // Should not throw when logger methods are called
    });

    it('should handle errors without logger', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found'
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      await expect(httpClient.get('https://example.com/missing')).rejects.toThrow(
        expect.objectContaining({
          status: 404,
          code: 'NOT_FOUND'
        })
      );
    });
  });

  describe('Error code mapping', () => {
    beforeEach(() => {
      httpClient = new FetchHttpClient();
    });

    const statusCodeTests = [
      { status: 400, code: 'BAD_REQUEST' },
      { status: 401, code: 'UNAUTHORIZED' },
      { status: 403, code: 'FORBIDDEN' },
      { status: 404, code: 'NOT_FOUND' },
      { status: 408, code: 'TIMEOUT' },
      { status: 429, code: 'RATE_LIMITED' },
      { status: 500, code: 'INTERNAL_SERVER_ERROR' },
      { status: 502, code: 'BAD_GATEWAY' },
      { status: 503, code: 'SERVICE_UNAVAILABLE' },
      { status: 504, code: 'GATEWAY_TIMEOUT' }
    ];

    statusCodeTests.forEach(({ status, code }) => {
      it(`should map ${status} to ${code}`, async () => {
        const mockResponse = {
          ok: false,
          status,
          statusText: 'Error'
        };
        
        mockFetch.mockResolvedValue(mockResponse);

        await expect(httpClient.get('https://example.com/test')).rejects.toThrow(
          expect.objectContaining({
            status,
            code
          })
        );
      });
    });
  });
});