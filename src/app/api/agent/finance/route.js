// ----------------------
// app/api/agent/finance/route.js
// ----------------------
// Finance Agent: Handles DeFi operations via Thirdweb MCP
// Supports token trades, swaps, and portfolio management tasks.

import { mcp } from '@/lib/mcpClient';

export async function POST(req) {
  try {
    const { task } = await req.json();

    if (!task) {
      return Response.json({ error: 'Missing "task" field' }, { status: 400 });
    }

    // Execute finance task via Thirdweb MCP
    const result = await mcp.callTool('thirdweb.executeTrade', { task });

    return Response.json({
      agent: 'finance',
      task,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Finance Agent] Error:', err);
    return Response.json(
      { error: err.message || 'Internal server error', agent: 'finance' },
      { status: 500 }
    );
  }
}
