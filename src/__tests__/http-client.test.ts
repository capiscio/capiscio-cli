import { describe, it, expect, beforeEach, vi } from 'vitest';import { describe, it, expect, beforeEach, vi } from 'vitest';

import { FetchHttpClient } from '../validator/http-client';import { FetchHttpClient } from '../validator/http-client';

import { HttpError } from '../types';import { HttpError } from '../types';



// Mock fetch globally// Mock fetch globally

const mockFetch = vi.fn();const mockFetch = vi.fn();

global.fetch = mockFetch;global.fetch = mockFetch;



// Helper to create mock Response objects// Helper to create mock Response objects

function createMockResponse(options: {function createMockResponse(options: {

  ok?: boolean;  ok?: boolean;

  status?: number;  status?: number;

  statusText?: string;  statusText?: string;

  headers?: Map<string, string>;  headers?: Map<string, string>;

  text?: string;  text?: string;

  json?: any;  json?: any;

}): Response {}): Response {

  const {  const {

    ok = true,    ok = true,

    status = 200,    status = 200,

    statusText = 'OK',    statusText = 'OK',

    headers = new Map(),    headers = new Map(),

    text = '',    text = '',

    json = {}    json = {}

  } = options;  } = options;



  return {  return {

    ok,    ok,

    status,    status,

    statusText,    statusText,

    headers,    headers,

    redirected: false,    redirected: false,

    type: 'basic' as ResponseType,    type: 'basic' as ResponseType,

    url: 'https://example.com',    url: 'https://example.com',

    clone: vi.fn(),    clone: vi.fn(),

    body: null,    body: null,

    bodyUsed: false,    bodyUsed: false,

    arrayBuffer: vi.fn(),    arrayBuffer: vi.fn(),

    blob: vi.fn(),    blob: vi.fn(),

    formData: vi.fn(),    formData: vi.fn(),

    json: vi.fn().mockResolvedValue(json),    json: vi.fn().mockResolvedValue(json),

    text: vi.fn().mockResolvedValue(text)    text: vi.fn().mockResolvedValue(text)

  } as unknown as Response;  } as unknown as Response;

}}



describe('FetchHttpClient', () => {

  let httpClient: FetchHttpClient;

describe('FetchHttpClient', () => {

  beforeEach(() => {  let httpClient: FetchHttpClient;

    vi.clearAllMocks();

    httpClient = new FetchHttpClient();  beforeEach(() => {

  });    vi.clearAllMocks();

    httpClient = new FetchHttpClient();

  describe('GET requests', () => {  });

    it('should make successful GET request', async () => {

      const mockData = { test: 'data' };  describe('GET requests', () => {

      const mockResponse = createMockResponse({    it('should make successful GET request', async () => {

        ok: true,      const mockData = { test: 'data' };

        status: 200,      const mockResponse = createMockResponse({

        statusText: 'OK',        ok: true,

        json: mockData,        status: 200,

        headers: new Map([['content-type', 'application/json']])        statusText: 'OK',

      });        json: mockData,

        headers: new Map([['content-type', 'application/json']])

      mockFetch.mockResolvedValueOnce(mockResponse);      });



      const result = await httpClient.get('https://example.com/test');      mockFetch.mockResolvedValueOnce(mockResponse);



      expect(result.status).toBe(200);      const result = await httpClient.get('https://example.com/test');

      expect(result.data).toEqual(mockData);

      expect(result.headers['content-type']).toBe('application/json');      expect(result.status).toBe(200);

    });      expect(result.data).toEqual(mockData);

      expect(result.headers['content-type']).toBe('application/json');

    it('should handle custom headers', async () => {      expect(mockFetch).toHaveBeenCalledWith(

      const mockResponse = createMockResponse({        'https://example.com/test',

        ok: true,        expect.objectContaining({

        status: 200,          method: 'GET',

        json: { success: true }          headers: expect.objectContaining({

      });            'Accept': 'application/json',

            'User-Agent': 'capiscio-cli/1.0.0'

      mockFetch.mockResolvedValueOnce(mockResponse);          })

        })

      await httpClient.get('https://example.com/test', {      );

        headers: { 'Authorization': 'Bearer token' }    });

      });

    it('should handle custom headers', async () => {

      expect(mockFetch).toHaveBeenCalledWith(      const mockResponse = createMockResponse({

        'https://example.com/test',        ok: true,

        expect.objectContaining({        status: 200,

          headers: expect.objectContaining({        json: { success: true }

            'Authorization': 'Bearer token'      });

          })

        })      mockFetch.mockResolvedValueOnce(mockResponse);

      );        status: 200,

    });        json: () => Promise.resolve({}),

        headers: new Map()

    it('should handle custom timeout', async () => {      };

      const mockResponse = createMockResponse({

        ok: true,      mockFetch.mockResolvedValueOnce(mockResponse);

        status: 200,

        json: {}      await httpClient.get('https://example.com/test', {

      });        headers: { 'Authorization': 'Bearer token' }

      });

      mockFetch.mockResolvedValueOnce(mockResponse);

      expect(mockFetch).toHaveBeenCalledWith(

      await httpClient.get('https://example.com/test', {        'https://example.com/test',

        timeout: 5000        expect.objectContaining({

      });          headers: expect.objectContaining({

            'Accept': 'application/json',

      expect(mockFetch).toHaveBeenCalledWith(            'User-Agent': 'capiscio-cli/1.0.0',

        'https://example.com/test',            'Authorization': 'Bearer token'

        expect.objectContaining({          })

          signal: expect.any(AbortSignal)        })

        })      );

      );    });

    });

  });    it('should handle custom timeout', async () => {

      const mockResponse = createMockResponse({

  describe('Error handling', () => {        ok: true,

    it('should throw HttpError for 404 responses', async () => {        status: 200,

      const mockResponse = createMockResponse({        json: {}

        ok: false,      });

        status: 404,

        statusText: 'Not Found'      mockFetch.mockResolvedValueOnce(mockResponse);

      });

      await httpClient.get('https://example.com/test', {

      mockFetch.mockResolvedValue(mockResponse);        timeout: 5000

      });

      await expect(httpClient.get('https://example.com/notfound'))

        .rejects.toThrow(HttpError);      expect(mockFetch).toHaveBeenCalledWith(

              'https://example.com/test',

      await expect(httpClient.get('https://example.com/notfound'))        expect.objectContaining({

        .rejects.toThrow('HTTP 404: Not Found');          signal: expect.any(AbortSignal)

    });        })

      );

    it('should throw HttpError for 500 responses', async () => {    });

      const mockResponse = createMockResponse({  });

        ok: false,

        status: 500,  describe('Error handling', () => {

        statusText: 'Internal Server Error'    it('should throw HttpError for 404 responses', async () => {

      });      const mockResponse = createMockResponse({

        ok: false,

      mockFetch.mockResolvedValueOnce(mockResponse);        status: 404,

        statusText: 'Not Found'

      await expect(httpClient.get('https://example.com/error'))      });

        .rejects.toThrow(HttpError);

    });      mockFetch.mockResolvedValue(mockResponse);



    it('should handle network errors', async () => {      await expect(httpClient.get('https://example.com/notfound'))

      mockFetch.mockRejectedValueOnce(new Error('Network error'));        .rejects.toThrow(HttpError);

      

      await expect(httpClient.get('https://example.com/test'))      await expect(httpClient.get('https://example.com/notfound'))

        .rejects.toThrow('Network error');        .rejects.toThrow('HTTP 404: Not Found');

    });    });



    it('should handle timeout errors', async () => {    it('should throw HttpError for 500 responses', async () => {

      mockFetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));      const mockResponse = {

        ok: false,

      await expect(httpClient.get('https://example.com/test'))        status: 500,

        .rejects.toThrow('Request timeout');        statusText: 'Internal Server Error',

    });        headers: new Map()

      };

    it('should handle ENOTFOUND errors', async () => {

      const error = new Error('fetch failed');      mockFetch.mockResolvedValueOnce(mockResponse);

      (error as any).code = 'ENOTFOUND';

      mockFetch.mockRejectedValueOnce(error);      await expect(httpClient.get('https://example.com/error'))

        .rejects.toThrow('HTTP 500: Internal Server Error');

      await expect(httpClient.get('https://nonexistent.com'))    });

        .rejects.toThrow('Domain not found');

    });    it('should handle network errors', async () => {

      const networkError = new Error('Network error');

    it('should handle ECONNREFUSED errors', async () => {      mockFetch.mockRejectedValueOnce(networkError);

      const error = new Error('fetch failed');

      (error as any).code = 'ECONNREFUSED';      await expect(httpClient.get('https://example.com/test'))

      mockFetch.mockRejectedValueOnce(error);        .rejects.toThrow(HttpError);

    });

      await expect(httpClient.get('https://example.com'))

        .rejects.toThrow('Connection refused');    it('should handle timeout errors', async () => {

    });      const timeoutError = new Error('Timeout');

  });      timeoutError.name = 'AbortError';

      mockFetch.mockRejectedValueOnce(timeoutError);

  describe('Response processing', () => {

    it('should process JSON response', async () => {      await expect(httpClient.get('https://example.com/test'))

      const mockData = { message: 'success' };        .rejects.toThrow('Request timeout');

      const mockResponse = createMockResponse({    });

        ok: true,

        status: 200,    it('should handle ENOTFOUND errors', async () => {

        json: mockData,      const dnsError = new Error('getaddrinfo ENOTFOUND');

        headers: new Map([['content-type', 'application/json']])      mockFetch.mockRejectedValueOnce(dnsError);

      });

      await expect(httpClient.get('https://nonexistent.com'))

      mockFetch.mockResolvedValueOnce(mockResponse);        .rejects.toThrow('Domain not found');

    });

      const result = await httpClient.get('https://example.com/api');

    it('should handle ECONNREFUSED errors', async () => {

      expect(result.data).toEqual(mockData);      const connectionError = new Error('connect ECONNREFUSED');

      expect(result.status).toBe(200);      mockFetch.mockRejectedValueOnce(connectionError);

      expect(result.headers['content-type']).toBe('application/json');

    });      await expect(httpClient.get('https://example.com'))

        .rejects.toThrow('Connection refused');

    it('should process text response when JSON parsing fails', async () => {    });

      const textContent = 'Plain text response';  });

      const mockResponse = createMockResponse({

        ok: true,  describe('Response processing', () => {

        status: 200,    it('should parse JSON responses', async () => {

        text: textContent      const mockData = { message: 'success', data: [1, 2, 3] };

      });      const mockResponse = {

        ok: true,

      // Make json() throw an error to simulate non-JSON response        status: 200,

      mockResponse.json = vi.fn().mockRejectedValue(new Error('Invalid JSON'));        json: () => Promise.resolve(mockData),

        headers: new Map([['content-type', 'application/json']])

      mockFetch.mockResolvedValueOnce(mockResponse);      };



      const result = await httpClient.get('https://example.com/empty');      mockFetch.mockResolvedValueOnce(mockResponse);



      expect(result.data).toBe(textContent);      const result = await httpClient.get('https://example.com/api');

      expect(result.status).toBe(200);

    });      expect(result.data).toEqual(mockData);

    });

    it('should handle empty responses', async () => {

      const mockResponse = createMockResponse({    it('should handle empty responses', async () => {

        ok: true,      const mockResponse = {

        status: 204,        ok: true,

        text: ''        status: 200,

      });        json: () => Promise.resolve(null),

        headers: new Map()

      mockResponse.json = vi.fn().mockRejectedValue(new Error('Invalid JSON'));      };



      mockFetch.mockResolvedValueOnce(mockResponse);      mockFetch.mockResolvedValueOnce(mockResponse);



      await expect(httpClient.get('https://example.com/malformed'))      const result = await httpClient.get('https://example.com/empty');

        .resolves.toBeDefined();

    });      expect(result.data).toBeNull();

  });      expect(result.status).toBe(200);

    });

  describe('HTTP status codes', () => {

    const statusCodes = [    it('should handle malformed JSON', async () => {

      { code: 200, text: 'OK', shouldThrow: false },      const mockResponse = {

      { code: 201, text: 'Created', shouldThrow: false },        ok: true,

      { code: 204, text: 'No Content', shouldThrow: false },        status: 200,

      { code: 400, text: 'Bad Request', shouldThrow: true },        json: () => Promise.reject(new SyntaxError('Unexpected token')),

      { code: 401, text: 'Unauthorized', shouldThrow: true },        headers: new Map()

      { code: 403, text: 'Forbidden', shouldThrow: true },      };

      { code: 404, text: 'Not Found', shouldThrow: true },

      { code: 429, text: 'Too Many Requests', shouldThrow: true },      mockFetch.mockResolvedValueOnce(mockResponse);

      { code: 500, text: 'Internal Server Error', shouldThrow: true },

      { code: 502, text: 'Bad Gateway', shouldThrow: true }      await expect(httpClient.get('https://example.com/malformed'))

    ];        .rejects.toThrow();

    });

    statusCodes.forEach(({ code, text, shouldThrow }) => {  });

      it(`should ${shouldThrow ? 'throw' : 'handle'} ${code} ${text}`, async () => {

        const mockResponse = createMockResponse({  describe('HTTP status codes', () => {

          ok: !shouldThrow,    const testCases = [

          status: code,      { status: 400, code: 'BAD_REQUEST' },

          statusText: text,      { status: 401, code: 'UNAUTHORIZED' },

          json: shouldThrow ? undefined : { status: text }      { status: 403, code: 'FORBIDDEN' },

        });      { status: 404, code: 'NOT_FOUND' },

      { status: 408, code: 'TIMEOUT' },

        mockFetch.mockResolvedValueOnce(mockResponse);      { status: 429, code: 'RATE_LIMITED' },

      { status: 500, code: 'INTERNAL_SERVER_ERROR' },

        if (shouldThrow) {      { status: 502, code: 'BAD_GATEWAY' },

          await expect(httpClient.get('https://example.com/test'))      { status: 503, code: 'SERVICE_UNAVAILABLE' },

            .rejects.toThrow(HttpError);      { status: 504, code: 'GATEWAY_TIMEOUT' }

        } else {    ];

          const result = await httpClient.get('https://example.com/test');

          expect(result.status).toBe(code);    testCases.forEach(({ status, code }) => {

        }      it(`should handle ${status} status with ${code} code`, async () => {

      });        const mockResponse = {

    });          ok: false,

  });          status,

          statusText: 'Error',

  describe('Headers processing', () => {          headers: new Map()

    it('should convert Headers to plain object', async () => {        };

      const headers = new Map([

        ['content-type', 'application/json'],        mockFetch.mockResolvedValueOnce(mockResponse);

        ['x-custom', 'value']

      ]);        try {

                await httpClient.get('https://example.com/test');

      const mockResponse = createMockResponse({          expect.fail('Should have thrown an error');

        ok: true,        } catch (error) {

        status: 200,          expect(error).toBeInstanceOf(HttpError);

        json: {},          expect((error as HttpError).code).toBe(code);

        headers          expect((error as HttpError).status).toBe(status);

      });        }

      });

      mockFetch.mockResolvedValueOnce(mockResponse);    });

  });

      const result = await httpClient.get('https://example.com/test');

  describe('Headers processing', () => {

      expect(result.headers).toEqual({    it('should convert Headers object to plain object', async () => {

        'content-type': 'application/json',      const headers = new Map([

        'x-custom': 'value'        ['content-type', 'application/json'],

      });        ['x-custom-header', 'custom-value'],

    });        ['cache-control', 'no-cache']

  });      ]);



  describe('Abort signal handling', () => {      const mockResponse = {

    it('should use provided abort signal', async () => {        ok: true,

      const controller = new AbortController();        status: 200,

      const mockResponse = createMockResponse({        json: () => Promise.resolve({}),

        ok: true,        headers

        status: 200,      };

        json: {}

      });      mockFetch.mockResolvedValueOnce(mockResponse);



      mockFetch.mockResolvedValueOnce(mockResponse);      const result = await httpClient.get('https://example.com/test');



      await httpClient.get('https://example.com/test', {      expect(result.headers).toEqual({

        signal: controller.signal        'content-type': 'application/json',

      });        'x-custom-header': 'custom-value',

        'cache-control': 'no-cache'

      expect(mockFetch).toHaveBeenCalledWith(      });

        'https://example.com/test',    });

        expect.objectContaining({  });

          signal: controller.signal

        })  describe('Abort signal handling', () => {

      );    it('should use provided abort signal', async () => {

    });      const controller = new AbortController();

      const mockResponse = {

    it('should create internal abort signal when none provided', async () => {        ok: true,

      const mockResponse = createMockResponse({        status: 200,

        ok: true,        json: () => Promise.resolve({}),

        status: 200,        headers: new Map()

        json: {}      };

      });

      mockFetch.mockResolvedValueOnce(mockResponse);

      mockFetch.mockResolvedValueOnce(mockResponse);

      await httpClient.get('https://example.com/test', {

      await httpClient.get('https://example.com/test');        signal: controller.signal

      });

      expect(mockFetch).toHaveBeenCalledWith(

        'https://example.com/test',      expect(mockFetch).toHaveBeenCalledWith(

        expect.objectContaining({        'https://example.com/test',

          signal: expect.any(AbortSignal)        expect.objectContaining({

        })          signal: controller.signal

      );        })

    });      );

  });    });

});
    it('should create abort signal for timeout', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        headers: new Map()
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await httpClient.get('https://example.com/test', {
        timeout: 1000
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/test',
        expect.objectContaining({
          signal: expect.any(AbortSignal)
        })
      );
    });
  });
});