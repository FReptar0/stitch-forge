import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(
  readFileSync(join(__dirname, '../fixtures/stitch-response.json'), 'utf-8')
);

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function mockResponse(data: unknown) {
  return {
    ok: true,
    json: async () => ({
      jsonrpc: '2.0',
      id: 1,
      result: { content: [{ type: 'text', text: JSON.stringify(data) }] },
    }),
    text: async () => JSON.stringify(data),
  };
}

describe('StitchMcpClient', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.STITCH_API_KEY = 'test-key';
  });

  it('lists projects', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(fixtures.listProjects));

    const { StitchMcpClient } = await import('../../src/mcp/client.js');
    const client = new StitchMcpClient('test-key');
    const projects = await client.listProjects();

    expect(projects).toHaveLength(2);
    expect(projects[0].name).toBe('Acme Website');
    expect(projects[0].id).toBe('proj-001');
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it('generates a screen and extracts from outputComponents', async () => {
    // generateScreen now parses outputComponents directly from the response
    mockFetch.mockResolvedValueOnce(mockResponse(fixtures.generateScreen));

    const { StitchMcpClient } = await import('../../src/mcp/client.js');
    const client = new StitchMcpClient('test-key');
    const result = await client.generateScreen('proj-001', 'A landing page for Acme');

    expect(result.screenId).toBe('scr-new-001');
    expect(result.name).toBe('pricing');
    expect(result.htmlCodeUrl).toBe('https://example.com/html/scr-new-001');
    expect(result.screenshotUrl).toBe('https://example.com/screenshot/scr-new-001');
    expect(mockFetch).toHaveBeenCalledOnce(); // Only 1 call, no listScreens needed
  });

  it('retrieves screen HTML', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(fixtures.getScreenCode));

    const { StitchMcpClient } = await import('../../src/mcp/client.js');
    const client = new StitchMcpClient('test-key');
    const html = await client.getScreenCode('proj-001', 'scr-001');

    expect(html).toContain('<h1>Plans</h1>');
  });

  it('builds a site', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(fixtures.buildSite));

    const { StitchMcpClient } = await import('../../src/mcp/client.js');
    const client = new StitchMcpClient('test-key');
    const result = await client.buildSite('proj-001', [
      { screenId: 'scr-001', route: '/' },
      { screenId: 'scr-002', route: '/about' },
    ]);

    expect(result.pages).toHaveLength(3);
    expect(result.pages[0].route).toBe('/');
  });

  it('throws when no API key', async () => {
    delete process.env.STITCH_API_KEY;

    const { StitchMcpClient } = await import('../../src/mcp/client.js');
    expect(() => new StitchMcpClient()).toThrow('No Stitch API key');
  });
});
