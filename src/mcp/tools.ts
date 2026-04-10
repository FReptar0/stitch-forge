/**
 * Tool call builders for Stitch MCP.
 *
 * These are used by the standalone CLI (not Claude Code).
 * Inside Claude Code, the MCP protocol handles tool calls automatically —
 * Claude Code just calls the tools directly via the MCP server.
 *
 * This module builds the JSON-RPC payloads for direct HTTP usage.
 */

export interface McpToolCall {
  method: 'tools/call';
  params: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

export function listProjects(): McpToolCall {
  return { method: 'tools/call', params: { name: 'list_projects', arguments: {} } };
}

export function getProject(projectId: string): McpToolCall {
  return { method: 'tools/call', params: { name: 'get_project', arguments: { projectId } } };
}

export function listScreens(projectId: string): McpToolCall {
  return { method: 'tools/call', params: { name: 'list_screens', arguments: { projectId } } };
}

export function generateScreen(
  projectId: string,
  prompt: string,
  modelId = 'GEMINI_2_5_FLASH',
): McpToolCall {
  return {
    method: 'tools/call',
    params: {
      name: 'generate_screen_from_text',
      arguments: { projectId, prompt, modelId },
    },
  };
}

export function getScreenCode(projectId: string, screenId: string): McpToolCall {
  return {
    method: 'tools/call',
    params: { name: 'get_screen_code', arguments: { projectId, screenId } },
  };
}

export function getScreenImage(projectId: string, screenId: string): McpToolCall {
  return {
    method: 'tools/call',
    params: { name: 'get_screen_image', arguments: { projectId, screenId } },
  };
}

export function buildSite(
  projectId: string,
  routes: Array<{ screenId: string; route: string }>,
): McpToolCall {
  return {
    method: 'tools/call',
    params: { name: 'build_site', arguments: { projectId, routes } },
  };
}
