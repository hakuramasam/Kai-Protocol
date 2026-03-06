// ----------------------
// app/api/agent/governance/route.js
// ----------------------
// Governance Agent: Handles DAO proposals, voting, and governance actions
// via Thirdweb MCP.

import { mcp } from '@/lib/mcpClient';

export async function POST(req) {
  try {
    const { proposal } = await req.json();

    if (!proposal) {
      return Response.json({ error: 'Missing "proposal" field' }, { status: 400 });
    }

    // Submit governance proposal via Thirdweb MCP
    const result = await mcp.callTool('thirdweb.submitProposal', proposal);

    return Response.json({
      agent: 'governance',
      proposal,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Governance Agent] Error:', err);
    return Response.json(
      { error: err.message || 'Internal server error', agent: 'governance' },
      { status: 500 }
    );
  }
}
