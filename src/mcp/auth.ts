import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type AuthMethod = 'api_key' | 'gcloud_oauth' | 'none';

export interface AuthConfig {
  method: AuthMethod;
  apiKey?: string;
  projectId?: string;
}

/**
 * Resolve authentication for Stitch MCP.
 * Priority: env var > .env file > .forgerc.json > none
 */
export function resolveAuth(): AuthConfig {
  // 1. Environment variable
  if (process.env.STITCH_API_KEY) {
    return {
      method: 'api_key',
      apiKey: process.env.STITCH_API_KEY,
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
    };
  }

  // 2. .env file
  const envPath = join(process.cwd(), '.env');
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8');
    const apiKeyMatch = envContent.match(/^STITCH_API_KEY=(.+)$/m);
    const projectMatch = envContent.match(/^GOOGLE_CLOUD_PROJECT=(.+)$/m);
    if (apiKeyMatch?.[1]?.trim()) {
      return {
        method: 'api_key',
        apiKey: apiKeyMatch[1].trim(),
        projectId: projectMatch?.[1]?.trim(),
      };
    }
  }

  // 3. .forgerc.json
  const rcPath = join(process.cwd(), '.forgerc.json');
  if (existsSync(rcPath)) {
    try {
      const rc = JSON.parse(readFileSync(rcPath, 'utf-8'));
      if (rc.apiKey) {
        return { method: 'api_key', apiKey: rc.apiKey, projectId: rc.projectId };
      }
    } catch { /* ignore parse errors */ }
  }

  return { method: 'none' };
}

/**
 * Check if gcloud CLI is available for OAuth fallback.
 */
export async function checkGcloudAvailable(): Promise<boolean> {
  try {
    const { execSync } = await import('node:child_process');
    execSync('gcloud --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
