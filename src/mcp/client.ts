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
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
      },
      body: JSON.stringify({
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: params,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Stitch MCP error (${response.status}): ${text}`);
    }

    const data = await response.json() as { result: T };
    return data.result;
  }

  async listProjects(): Promise<StitchProject[]> {
    return this.callTool<StitchProject[]>('list_projects', {});
  }

  async getProject(projectId: string): Promise<StitchProject> {
    return this.callTool<StitchProject>('get_project', { projectId });
  }

  async listScreens(projectId: string): Promise<StitchScreen[]> {
    return this.callTool<StitchScreen[]>('list_screens', { projectId });
  }

  async generateScreen(projectId: string, prompt: string, modelId?: string): Promise<GenerateScreenResult> {
    return this.callTool<GenerateScreenResult>('generate_screen_from_text', {
      projectId,
      prompt,
      modelId: modelId || 'GEMINI_2_5_FLASH',
    });
  }

  async getScreenCode(projectId: string, screenId: string): Promise<string> {
    return this.callTool<string>('get_screen_code', { projectId, screenId });
  }

  async getScreenImage(projectId: string, screenId: string): Promise<string> {
    return this.callTool<string>('get_screen_image', { projectId, screenId });
  }

  async buildSite(projectId: string, routes: BuildSiteRoute[]): Promise<BuildSiteResult> {
    return this.callTool<BuildSiteResult>('build_site', { projectId, routes });
  }
}
