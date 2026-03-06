// ----------------------
// app/api/agent/self-improver/route.js
// ----------------------
// Self-Improver Agent: AutoGPT-style agent that analyzes system logs
// and suggests improvements to the multi-agent system.

import OpenAI from 'openai';
import { mcp } from '@/lib/mcpClient';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const { logs } = await req.json();

    if (!logs) {
      return Response.json({ error: 'Missing "logs" field' }, { status: 400 });
    }

    // Fetch available MCP tools for potential self-improvement actions
    const tools = await mcp.listTools();

    const messages = [
      {
        role: 'system',
        content: `You are the Self-Improver Agent for Kai, an AI Web3 Multi-Agent System.
Your role is to:
1. Analyze system logs and identify patterns, errors, and inefficiencies
2. Suggest concrete improvements to agent prompts, workflows, and configurations
3. Identify opportunities to optimize DeFi strategies, NFT operations, and governance processes
4. Propose new capabilities or integrations that would enhance the system

Respond with a structured JSON analysis:
{
  "issues": [{ "severity": "high|medium|low", "description": "...", "agent": "..." }],
  "improvements": [{ "priority": 1-5, "action": "...", "expectedImpact": "..." }],
  "summary": "...",
  "healthScore": 0-100
}`
      },
      {
        role: 'user',
        content: `Analyze these system logs and suggest improvements:\n\n${JSON.stringify(logs, null, 2)}`
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
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      analysis = { raw: content };
    }

    return Response.json({
      agent: 'self-improver',
      analysis,
      usage: response.usage,
      model: response.model,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Self-Improver Agent] Error:', err);
    return Response.json(
      { error: err.message || 'Internal server error', agent: 'self-improver' },
      { status: 500 }
    );
  }
}
