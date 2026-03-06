// ----------------------
// lib/mcpClient.js
// ----------------------
// MCP (Model Context Protocol) client for connecting to Web3 and AI services.
// Uses mcp-use MCPClient to interface with Thirdweb, Supabase, and AutoGPT MCP servers.
//
// The MCPClient manages server configurations and creates MCPSession instances
// that expose listTools() and callTool() for each connected server.

let mcpClientInstance = null;

/**
 * Lazy-initialize the MCPClient to avoid issues during build time
 * when environment variables may not be available.
 * @returns {import('mcp-use').MCPClient}
 */
function getMCPClient() {
  if (mcpClientInstance) return mcpClientInstance;

  const { MCPClient } = require('mcp-use');

  mcpClientInstance = new MCPClient({
    mcpServers: {
      thirdweb: {
        url: 'https://api.thirdweb.com/mcp',
        transport: 'http',
        headers: { 'x-client-id': process.env.THIRDWEB_CLIENT_ID || '' }
      },
      supabase: {
        url: (process.env.SUPABASE_URL || 'https://placeholder.supabase.co') + '/functions/v1/mcp-server/mcp',
        transport: 'http',
        headers: { apikey: process.env.SUPABASE_KEY || '' }
      },
      autoGPT: {
        url: process.env.AUTOGPT_MCP || 'https://placeholder-autogpt.example.com/mcp',
        transport: 'http'
      }
    }
  });

  return mcpClientInstance;
}

/**
 * Get an MCPSession for a specific server, with error handling.
 * @param {string} serverName - 'thirdweb' | 'supabase' | 'autoGPT'
 * @returns {Promise<import('mcp-use').MCPSession|null>}
 */
async function getSession(serverName) {
  try {
    const client = getMCPClient();
    const session = await client.createSession(serverName);
    return session;
  } catch (err) {
    console.warn(`[MCP] Failed to create session for "${serverName}":`, err.message);
    return null;
  }
}

/**
 * List all available tools across all configured MCP servers.
 * Returns an empty array if no servers are reachable.
 * @returns {Promise<Array>}
 */
async function listTools() {
  const servers = ['thirdweb', 'supabase', 'autoGPT'];
  const allTools = [];

  for (const serverName of servers) {
    try {
      const session = await getSession(serverName);
      if (!session) continue;
      const result = await session.listTools();
      const tools = result?.tools || result || [];
      allTools.push(...tools.map(t => ({ ...t, server: serverName })));
    } catch (err) {
      console.warn(`[MCP] listTools failed for "${serverName}":`, err.message);
    }
  }

  return allTools;
}

/**
 * Call a specific MCP tool by its fully-qualified name (e.g. 'thirdweb.mintNFT').
 * The server prefix is used to route to the correct MCP session.
 * @param {string} toolName - Format: 'serverName.toolMethod' or just 'toolMethod'
 * @param {object} params - Tool parameters
 * @returns {Promise<object>}
 */
async function callTool(toolName, params = {}) {
  // Parse server prefix from tool name (e.g. 'thirdweb.mintNFT' → server='thirdweb', tool='mintNFT')
  const dotIndex = toolName.indexOf('.');
  let serverName = 'thirdweb'; // default server
  let actualToolName = toolName;

  if (dotIndex !== -1) {
    serverName = toolName.substring(0, dotIndex);
    actualToolName = toolName.substring(dotIndex + 1);
  }

  try {
    const session = await getSession(serverName);
    if (!session) {
      return {
        error: `MCP server "${serverName}" is not available`,
        toolName,
        params,
        note: 'Configure the MCP server URL and credentials in .env.local'
      };
    }

    const result = await session.callTool(actualToolName, params);
    return result;
  } catch (err) {
    console.warn(`[MCP] callTool(${toolName}) failed:`, err.message);
    return {
      error: err.message,
      toolName,
      params,
      note: 'Ensure MCP server is running and credentials are configured'
    };
  }
}

// Named export object matching the original BrowserMCPClient interface
export const mcp = { listTools, callTool };
