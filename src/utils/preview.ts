import { execFile } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { log } from './logger.js';

export function openInBrowser(filePath: string): Promise<void> {
  const absPath = resolve(filePath);
  const cmd = process.platform === 'darwin' ? 'open'
    : process.platform === 'win32' ? 'start'
    : 'xdg-open';

  return new Promise((res, rej) => {
    execFile(cmd, [absPath], (err) => {
      if (err) {
        log.error(`Could not open browser. Open manually: ${absPath}`);
        rej(err);
      } else {
        res();
      }
    });
  });
}

export function listScreenFiles(): string[] {
  const dir = 'screens';
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith('.html'))
    .map(f => f.replace('.html', ''))
    .sort();
}

export function resolveScreenPath(screenName: string): string | null {
  const exact = join('screens', `${screenName}.html`);
  if (existsSync(exact)) return resolve(exact);

  const files = listScreenFiles();
  const match = files.find(f => f.toLowerCase() === screenName.toLowerCase());
  if (match) return resolve(join('screens', `${match}.html`));

  return null;
}

export async function openAllScreens(): Promise<void> {
  const files = listScreenFiles();
  for (const file of files) {
    const path = resolve(join('screens', `${file}.html`));
    await openInBrowser(path);
    await new Promise(r => setTimeout(r, 200));
  }
}
