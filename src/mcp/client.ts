/**
 * MCP Client wrapper for Stitch tools.
 * 
 * When running inside Claude Code with the Stitch MCP server configured,
 * tool calls are handled automatically by the MCP protocol.
 * 
 * This module provides typed wrappers for standalone CLI usage
 * (outside Claude Code) via direct HTTP calls to the Stitch MCP endpoint.
 */

import { getConfig } from '../utils/config.js';

export interface StitchProject {
  id: string;
  name: string;
  createdAt: string;
  screenCount: number;
}

export interface StitchScreen {
  id: string;
  name: string;
  prompt: string;
  createdAt: string;
}

export interface GenerateScreenResult {
  screenId: string;
  projectId: string;
  name: string;
}

export interface BuildSiteRoute {
  screenId: string;
  route: string;
}

export interface BuildSiteResult {
  pages: Array<{ route: string; html: string }>;
}

/**
 * Direct HTTP client for Stitch MCP endpoint.
 * Used when running as standalone CLI (not inside Claude Code).
 */
export class StitchMcpClient {
  private endpoint: string;
  private apiKey: string;

  constructor(apiKey?: string, endpoint?: string) {
    const config = getConfig();
    this.apiKey = apiKey || config.apiKey || process.env.STITCH_API_KEY || '';
    this.endpoint = endpoint || 'https://stitch.googleapis.com/mcp';

    if (!this.apiKey) {
      throw new Error(
        'No Stitch API key found. Set STITCH_API_KEY env var or run `forge init`.'
      );
    }
  }

  private async callTool<T>(toolName: string, params: Record<string, unknown>): Promise<T> {
    const maxRetries = 3;
    // Generation can take 60-90s; other calls are fast
    const timeout = toolName === 'generate_screen_from_text' ? 120000 : 30000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Goog-Api-Key': this.apiKey,
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            method: 'tools/call',
            params: { name: toolName, arguments: params },
          }),
          signal: AbortSignal.timeout(timeout),
        });

        if (!response.ok) {
          if (attempt < maxRetries && this.isRetryable(response.status)) {
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          throw new Error(this.formatError(response.status, await response.text()));
        }

        const data = await response.json() as Record<string, unknown>;

        // JSON-RPC error
        if (data.error) {
          const err = data.error as { message?: string; code?: number };
          throw new Error(`Stitch API error: ${err.message || 'Unknown error'} (code ${err.code || 'unknown'})`);
        }

        // MCP tool responses come in result.content[0].text
        const result = data.result as Record<string, unknown> | undefined;
        if (result && Array.isArray(result.content)) {
          const textContent = (result.content as Array<{ type: string; text?: string }>)
            .find(c => c.type === 'text');
          if (textContent?.text) {
            try {
              return JSON.parse(textContent.text) as T;
            } catch {
              return textContent.text as T;
            }
          }
        }

        return (data.result ?? data) as T;
      } catch (error) {
        if (error instanceof Error && error.name === 'TimeoutError') {
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          throw new Error('Stitch API request timed out after 30 seconds. Check your network connection.');
        }
        // Re-throw non-retryable errors (our own formatted messages)
        if (error instanceof Error && error.message.startsWith('Stitch')) {
          throw error;
        }
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw error;
      }
    }
    throw new Error('Stitch API: max retries exceeded');
  }

  private isRetryable(status: number): boolean {
    return [429, 500, 502, 503, 504].includes(status);
  }

  private formatError(status: number, body: string): string {
    switch (status) {
      case 400: return `Stitch API: Bad request. Check your parameters. (${body.slice(0, 200)})`;
      case 401: return 'Stitch API: Invalid API key. Run `forge init` to reconfigure.';
      case 403: return 'Stitch API: Access denied. Check your API key permissions.';
      case 404: return 'Stitch API: Resource not found. The project or screen may have been deleted.';
      default: return `Stitch API error (${status}): ${body.slice(0, 200)}`;
    }
  }

  async listProjects(): Promise<StitchProject[]> {
    const raw = await this.callTool<Record<string, unknown>>('list_projects', {});
    // API returns { projects: [...] } with resource-style names
    const projects = (raw as { projects?: unknown[] }).projects || (Array.isArray(raw) ? raw : []);
    return (projects as Array<Record<string, unknown>>).map(p => ({
      id: this.extractId(p.name as string),
      name: (p.title as string) || (p.name as string),
      createdAt: (p.createTime as string) || '',
      screenCount: Array.isArray(p.screenInstances) ? p.screenInstances.length : 0,
    }));
  }

  async getProject(projectId: string): Promise<StitchProject> {
    const raw = await this.callTool<Record<string, unknown>>('get_project', {
      projectId: this.toResourceName(projectId, 'projects'),
    });
    return {
      id: this.extractId((raw.name as string) || projectId),
      name: (raw.title as string) || projectId,
      createdAt: (raw.createTime as string) || '',
      screenCount: Array.isArray(raw.screenInstances) ? raw.screenInstances.length : 0,
    };
  }

  async listScreens(projectId: string): Promise<StitchScreen[]> {
    const raw = await this.callTool<Record<string, unknown>>('list_screens', {
      projectId: this.toResourceName(projectId, 'projects'),
    });
    const screens = (raw as { screens?: unknown[] }).screens || (Array.isArray(raw) ? raw : []);
    return (screens as Array<Record<string, unknown>>).map(s => ({
      id: this.extractId((s.name as string) || ''),
      name: (s.title as string) || (s.name as string) || '',
      prompt: (s.prompt as string) || '',
      createdAt: (s.createTime as string) || '',
    }));
  }

  async generateScreen(projectId: string, prompt: string, modelId?: string): Promise<GenerateScreenResult> {
    const projResource = this.toResourceName(projectId, 'projects');
    const projId = this.extractId(projResource);
    const apiModel = this.mapModelId(modelId || 'GEMINI_2_5_FLASH');

    // Snapshot current screens to detect the new one after generation
    let screensBefore: StitchScreen[] = [];
    try {
      screensBefore = await this.listScreens(projId);
    } catch { /* first generation may have no screens */ }

    await this.callTool<Record<string, unknown>>('generate_screen_from_text', {
      projectId: projId,
      prompt,
      ...(apiModel ? { modelId: apiModel } : {}),
    });

    // The API returns { projectId, sessionId, outputComponents } but no screen ID.
    // List screens again and find the new one by comparing with the snapshot.
    const screensAfter = await this.listScreens(projId);
    const beforeIds = new Set(screensBefore.map(s => s.id));
    const newScreen = screensAfter.find(s => !beforeIds.has(s.id));

    if (newScreen) {
      return { screenId: newScreen.id, projectId: projId, name: newScreen.name };
    }

    // Fallback: use the last screen in the list
    const last = screensAfter[screensAfter.length - 1];
    return {
      screenId: last?.id || '',
      projectId: projId,
      name: last?.name || 'generated-screen',
    };
  }

  async getScreenCode(projectId: string, screenId: string): Promise<string> {
    const projResource = this.toResourceName(projectId, 'projects');
    const projId = this.extractId(projResource);
    const screenResource = screenId.includes('/')
      ? screenId
      : `${projResource}/screens/${screenId}`;
    const scrId = this.extractId(screenResource);

    // Try get_screen_code first (proxy tool from @_davideast/stitch-mcp)
    try {
      const raw = await this.callTool<unknown>('get_screen_code', {
        projectId: projResource,
        screenId: screenResource,
      });
      if (typeof raw === 'string') return raw;
      const obj = raw as Record<string, unknown>;
      return (obj.html as string) || (obj.code as string) || JSON.stringify(raw);
    } catch {
      // Fall back to native get_screen which returns htmlCode.downloadUrl
    }

    // Fallback: use native get_screen and fetch HTML from downloadUrl
    const screen = await this.callTool<Record<string, unknown>>('get_screen', {
      name: screenResource,
      projectId: projId,
      screenId: scrId,
    });

    const htmlCode = screen.htmlCode as Record<string, unknown> | undefined;
    if (htmlCode?.downloadUrl) {
      const htmlRes = await fetch(htmlCode.downloadUrl as string, {
        signal: AbortSignal.timeout(30000),
      });
      if (htmlRes.ok) return htmlRes.text();
    }

    throw new Error('Could not retrieve screen HTML. Ensure get_screen_code proxy tool or native API is available.');
  }

  async getScreenImage(projectId: string, screenId: string): Promise<string> {
    return this.callTool<string>('get_screen_image', {
      projectId: this.toResourceName(projectId, 'projects'),
      screenId: this.toResourceName(screenId, `projects/${projectId}/screens`),
    });
  }

  async buildSite(projectId: string, routes: BuildSiteRoute[]): Promise<BuildSiteResult> {
    return this.callTool<BuildSiteResult>('build_site', {
      projectId: this.toResourceName(projectId, 'projects'),
      routes,
    });
  }

  /** Extract numeric ID from resource name like "projects/123" or "screens/456" */
  private extractId(resourceName: string): string {
    if (!resourceName) return '';
    const parts = resourceName.split('/');
    return parts[parts.length - 1];
  }

  /** Ensure value is a resource name; if it's just an ID, prepend the prefix */
  private toResourceName(value: string, prefix: string): string {
    if (value.includes('/')) return value;
    return `${prefix}/${value}`;
  }

  /** Map internal model names to Stitch API model IDs */
  private mapModelId(model: string): string | undefined {
    const mapping: Record<string, string> = {
      'GEMINI_2_5_FLASH': 'GEMINI_3_FLASH',
      'GEMINI_3_PRO': 'GEMINI_3_1_PRO',
      'GEMINI_3_FLASH': 'GEMINI_3_FLASH',
      'GEMINI_3_1_PRO': 'GEMINI_3_1_PRO',
    };
    return mapping[model];
  }
}
