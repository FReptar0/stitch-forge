import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function mockResponse(status: number, data?: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({ result: data }),
    text: async () => data ? JSON.stringify(data) : `Error ${status}`,
  };
}

describe('StitchMcpClient retry logic', { timeout: 15000 }, () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
    process.env.STITCH_API_KEY = 'test-key';
  });

  it('retries on 500 and succeeds', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse(500))
      .mockResolvedValueOnce(mockResponse(200, [{ id: 'p1', name: 'Test' }]));

    const { StitchMcpClient } = await import('../../src/mcp/client.js');
    const client = new StitchMcpClient('test-key');
    const result = await client.listProjects();
    expect(result).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('retries on 429 and succeeds', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse(429))
      .mockResolvedValueOnce(mockResponse(200, []));

    const { StitchMcpClient } = await import('../../src/mcp/client.js');
    const client = new StitchMcpClient('test-key');
    const result = await client.listProjects();
    expect(result).toEqual([]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('does not retry on 401', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(401));

    const { StitchMcpClient } = await import('../../src/mcp/client.js');
    const client = new StitchMcpClient('test-key');
    await expect(client.listProjects()).rejects.toThrow('Invalid API key');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('does not retry on 404', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(404));

    const { StitchMcpClient } = await import('../../src/mcp/client.js');
    const client = new StitchMcpClient('test-key');
    await expect(client.listProjects()).rejects.toThrow('not found');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('gives up after max retries on persistent 500', async () => {
    mockFetch
      .mockResolvedValue(mockResponse(500));

    const { StitchMcpClient } = await import('../../src/mcp/client.js');
    const client = new StitchMcpClient('test-key');
    await expect(client.listProjects()).rejects.toThrow();
    expect(mockFetch).toHaveBeenCalledTimes(4); // initial + 3 retries
  });

  it('provides user-friendly error for 403', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(403));

    const { StitchMcpClient } = await import('../../src/mcp/client.js');
    const client = new StitchMcpClient('test-key');
    await expect(client.listProjects()).rejects.toThrow('Access denied');
  });
});
