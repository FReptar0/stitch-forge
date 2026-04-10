import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
}));

// Mock the logger to avoid console output in tests
vi.mock('../../src/utils/logger.js', () => ({
  log: {
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    step: vi.fn(),
    quota: vi.fn(),
  },
}));

import { existsSync, readdirSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { resolve, join } from 'node:path';

const mockedExistsSync = vi.mocked(existsSync);
const mockedReaddirSync = vi.mocked(readdirSync);
const mockedExecFile = vi.mocked(execFile);

describe('preview utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listScreenFiles', () => {
    it('returns sorted html filenames without extension', async () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReaddirSync.mockReturnValue(
        ['homepage.html', 'about.html', 'readme.txt'] as unknown as ReturnType<typeof readdirSync>
      );

      const { listScreenFiles } = await import('../../src/utils/preview.js');
      const result = listScreenFiles();
      expect(result).toEqual(['about', 'homepage']);
    });

    it('returns empty array when screens directory does not exist', async () => {
      mockedExistsSync.mockReturnValue(false);

      const { listScreenFiles } = await import('../../src/utils/preview.js');
      const result = listScreenFiles();
      expect(result).toEqual([]);
    });
  });

  describe('resolveScreenPath', () => {
    it('returns absolute path for exact match', async () => {
      mockedExistsSync.mockImplementation((p) => {
        return String(p) === join('screens', 'homepage.html');
      });

      const { resolveScreenPath } = await import('../../src/utils/preview.js');
      const result = resolveScreenPath('homepage');
      expect(result).toBe(resolve(join('screens', 'homepage.html')));
    });

    it('resolves case-insensitive match', async () => {
      mockedExistsSync.mockImplementation((p) => {
        const s = String(p);
        // Exact path does not exist (Homepage.html), but directory exists
        if (s === join('screens', 'Homepage.html')) return false;
        if (s === 'screens') return true;
        return false;
      });
      mockedReaddirSync.mockReturnValue(
        ['homepage.html'] as unknown as ReturnType<typeof readdirSync>
      );

      const { resolveScreenPath } = await import('../../src/utils/preview.js');
      const result = resolveScreenPath('Homepage');
      expect(result).toBe(resolve(join('screens', 'homepage.html')));
    });

    it('returns null for nonexistent screen', async () => {
      mockedExistsSync.mockReturnValue(false);

      const { resolveScreenPath } = await import('../../src/utils/preview.js');
      const result = resolveScreenPath('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('openInBrowser', () => {
    it('calls execFile with correct platform command', async () => {
      mockedExecFile.mockImplementation((_cmd, _args, cb) => {
        (cb as (err: Error | null) => void)(null);
        return {} as ReturnType<typeof execFile>;
      });

      const { openInBrowser } = await import('../../src/utils/preview.js');
      await openInBrowser('screens/test.html');

      expect(mockedExecFile).toHaveBeenCalledTimes(1);
      const call = mockedExecFile.mock.calls[0];
      // On macOS the command should be 'open'
      const expectedCmd = process.platform === 'darwin' ? 'open'
        : process.platform === 'win32' ? 'start'
        : 'xdg-open';
      expect(call[0]).toBe(expectedCmd);
      expect(call[1]).toEqual([resolve('screens/test.html')]);
    });
  });
});
