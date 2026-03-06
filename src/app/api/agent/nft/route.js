// ----------------------
// app/api/agent/nft/route.js
// ----------------------
// NFT Agent: Handles NFT minting, transfers, and metadata operations
// via Thirdweb MCP.

import { mcp } from '@/lib/mcpClient';

export async function POST(req) {
  try {
    const { task } = await req.json();

    if (!task) {
      return Response.json({ error: 'Missing "task" field' }, { status: 400 });
    }

    // Execute NFT minting via Thirdweb MCP
    const result = await mcp.callTool('thirdweb.mintNFT', task);

    return Response.json({
      agent: 'nft',
      task,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[NFT Agent] Error:', err);
    return Response.json(
      { error: err.message || 'Internal server error', agent: 'nft' },
      { status: 500 }
    );
  }
}
