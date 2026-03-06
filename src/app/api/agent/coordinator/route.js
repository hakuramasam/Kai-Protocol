// ----------------------
// app/api/agent/coordinator/route.js
// ----------------------
// Coordinator Agent: Receives high-level goals and delegates tasks
// to Finance, NFT, Governance, and Self-Improver sub-agents.

import OpenAI from 'openai';
import { mcp } from '@/lib/mcpClient';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const { goal } = await req.json();

    if (!goal || typeof goal !== 'string') {
      return Response.json({ error: 'Missing or invalid "goal" field' }, { status: 400 });
    }

    // Fetch available MCP tools (may be empty if MCP servers are not configured)
    const tools = await mcp.listTools();

    const messages = [
      {
        role: 'system',
        content: `You are Kai, the Coordinator Agent for an AI Web3 Multi-Agent System.
Your job is to analyze high-level goals and delegate tasks to the appropriate sub-agents:
- Finance Agent (/api/agent/finance): Handles DeFi trades, token swaps, portfolio management
- NFT Agent (/api/agent/nft): Handles NFT minting, transfers, metadata updates
- Governance Agent (/api/agent/governance): Handles DAO proposals, voting, governance actions
- Self-Improver Agent (/api/agent/self-improver): Analyzes logs and suggests system improvements

Respond with a structured JSON plan indicating which agents to invoke and with what tasks.
Format: { "plan": [{ "agent": "finance|nft|governance|self-improver", "task": "...", "priority": 1-5 }], "summary": "..." }`
      },
      {
        role: 'user',
        content: `New goal: ${goal}`
      }
    ];

    const requestParams = {
      model: 'gpt-4o-mini',
      messages,
      response_format: { type: 'json_object' }
    };

    // Only include tools if MCP returned any
    if (tools && tools.length > 0) {
      requestParams.tools = tools;
    }

    const response = await openai.chat.completions.create(requestParams);

    const content = response.choices[0]?.message?.content;
    let plan;
    try {
      plan = JSON.parse(content);
    } catch {
      plan = { raw: content };
    }

    return Response.json({
      agent: 'coordinator',
      goal,
      plan,
      usage: response.usage,
      model: response.model
    });
  } catch (err) {
    console.error('[Coordinator] Error:', err);
    return Response.json(
      { error: err.message || 'Internal server error', agent: 'coordinator' },
      { status: 500 }
    );
  }
}
