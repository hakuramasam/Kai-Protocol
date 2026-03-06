'use client';
import { useState } from 'react';

type AgentTab = 'coordinator' | 'finance' | 'nft' | 'governance' | 'self-improver';

interface LogEntry {
  timestamp: string;
  agent: AgentTab;
  input: string;
  output: unknown;
  error?: string;
}

const AGENT_CONFIG: Record<AgentTab, { label: string; icon: string; color: string; inputLabel: string; inputKey: string; placeholder: string }> = {
  coordinator: {
    label: 'Coordinator',
    icon: '🧠',
    color: 'from-violet-600 to-purple-700',
    inputLabel: 'High-Level Goal',
    inputKey: 'goal',
    placeholder: 'e.g. Maximize yield on ETH holdings while minting commemorative NFTs for top contributors'
  },
  finance: {
    label: 'Finance',
    icon: '💰',
    color: 'from-emerald-600 to-green-700',
    inputLabel: 'Finance Task',
    inputKey: 'task',
    placeholder: 'e.g. Swap 1 ETH for USDC on Uniswap at best rate'
  },
  nft: {
    label: 'NFT',
    icon: '🖼️',
    color: 'from-pink-600 to-rose-700',
    inputLabel: 'NFT Task',
    inputKey: 'task',
    placeholder: 'e.g. Mint NFT with name "Kai Genesis #1", description "First Kai Agent NFT", to address 0x...'
  },
  governance: {
    label: 'Governance',
    icon: '🏛️',
    color: 'from-blue-600 to-indigo-700',
    inputLabel: 'Proposal',
    inputKey: 'proposal',
    placeholder: 'e.g. Allocate 10% of treasury to liquidity mining rewards for Q2 2025'
  },
  'self-improver': {
    label: 'Self-Improver',
    icon: '🔄',
    color: 'from-orange-600 to-amber-700',
    inputLabel: 'System Logs (JSON)',
    inputKey: 'logs',
    placeholder: '[{"agent":"finance","status":"error","message":"Trade failed: insufficient liquidity"},{"agent":"nft","status":"success","txHash":"0x..."}]'
  }
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<AgentTab>('coordinator');
  const [inputs, setInputs] = useState<Record<AgentTab, string>>({
    coordinator: '',
    finance: '',
    nft: '',
    governance: '',
    'self-improver': ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const config = AGENT_CONFIG[activeTab];

  const handleSend = async () => {
    const inputValue = inputs[activeTab].trim();
    if (!inputValue) return;

    setLoading(true);
    setError(null);
    setResult(null);

    let body: Record<string, unknown>;

    // Parse JSON for self-improver logs
    if (activeTab === 'self-improver') {
      try {
        body = { logs: JSON.parse(inputValue) };
      } catch {
        body = { logs: inputValue };
      }
    } else if (activeTab === 'governance') {
      try {
        body = { proposal: JSON.parse(inputValue) };
      } catch {
        body = { proposal: inputValue };
      }
    } else {
      body = { [config.inputKey]: inputValue };
    }

    try {
      const res = await fetch(`/api/agent/${activeTab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `HTTP ${res.status}`);
        setLogs(prev => [{
          timestamp: new Date().toISOString(),
          agent: activeTab,
          input: inputValue,
          output: data,
          error: data.error
        }, ...prev]);
      } else {
        setResult(data);
        setLogs(prev => [{
          timestamp: new Date().toISOString(),
          agent: activeTab,
          input: inputValue,
          output: data
        }, ...prev]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-lg font-bold shadow-lg">
              K
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Kai Agent</h1>
              <p className="text-xs text-neutral-400">AI Web3 Multi-Agent System</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Agent Panel */}
        <div className="lg:col-span-2 space-y-5">
          {/* Agent Tabs */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(AGENT_CONFIG) as AgentTab[]).map(tab => {
              const c = AGENT_CONFIG[tab];
              return (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setResult(null); setError(null); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                    activeTab === tab
                      ? `bg-gradient-to-r ${c.color} border-transparent text-white shadow-lg`
                      : 'bg-neutral-800/60 border-neutral-700 text-neutral-300 hover:bg-neutral-700/60'
                  }`}
                >
                  <span>{c.icon}</span>
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Input Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center text-base`}>
                {config.icon}
              </div>
              <div>
                <h2 className="font-semibold text-sm">{config.label} Agent</h2>
                <p className="text-xs text-neutral-400">{config.inputLabel}</p>
              </div>
            </div>

            <textarea
              value={inputs[activeTab]}
              onChange={e => setInputs(prev => ({ ...prev, [activeTab]: e.target.value }))}
              onKeyDown={handleKeyDown}
              placeholder={config.placeholder}
              rows={4}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-neutral-100 placeholder-neutral-500 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition"
            />

            <div className="flex items-center justify-between">
              <p className="text-xs text-neutral-500">⌘ + Enter to send</p>
              <button
                onClick={handleSend}
                disabled={loading || !inputs[activeTab].trim()}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all bg-gradient-to-r ${config.color} text-white shadow-md hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing…
                  </>
                ) : (
                  <>
                    <span>Send to {config.label}</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Result */}
          {(result || error) && (
            <div className={`bg-neutral-900 border rounded-2xl p-5 space-y-3 ${error ? 'border-red-500/40' : 'border-neutral-800'}`}>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${error ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {error ? '✗ Error' : '✓ Response'}
                </span>
                <span className="text-xs text-neutral-500">{config.label} Agent</span>
              </div>
              {error ? (
                <p className="text-sm text-red-400">{error}</p>
              ) : (
                <pre className="text-xs text-neutral-300 overflow-auto max-h-96 bg-neutral-800/60 rounded-xl p-4 leading-relaxed">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Right: Activity Log */}
        <div className="space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Activity Log</h3>
              {logs.length > 0 && (
                <button
                  onClick={() => setLogs([])}
                  className="text-xs text-neutral-500 hover:text-neutral-300 transition"
                >
                  Clear
                </button>
              )}
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-8 text-neutral-600">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-xs">No activity yet</p>
                <p className="text-xs mt-1">Send a goal to get started</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {logs.map((log, i) => {
                  const c = AGENT_CONFIG[log.agent];
                  return (
                    <div key={i} className="bg-neutral-800/60 rounded-xl p-3 space-y-1.5 border border-neutral-700/50">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{c.icon}</span>
                        <span className="text-xs font-medium text-neutral-300">{c.label}</span>
                        {log.error ? (
                          <span className="ml-auto text-xs text-red-400">✗ Error</span>
                        ) : (
                          <span className="ml-auto text-xs text-emerald-400">✓ OK</span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 truncate">{log.input}</p>
                      <p className="text-xs text-neutral-600">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Agent Architecture Info */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-3">System Architecture</h3>
            <div className="space-y-2">
              {(Object.keys(AGENT_CONFIG) as AgentTab[]).map(tab => {
                const c = AGENT_CONFIG[tab];
                return (
                  <div key={tab} className="flex items-center gap-2.5 text-xs text-neutral-400">
                    <span>{c.icon}</span>
                    <span className="font-medium text-neutral-300">{c.label}</span>
                    <span className="ml-auto text-neutral-600 font-mono">/api/agent/{tab}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-800 space-y-1.5 text-xs text-neutral-500">
              <p>🔗 <span className="text-neutral-400">MCP:</span> Thirdweb · Supabase · AutoGPT</p>
              <p>🤖 <span className="text-neutral-400">LLM:</span> GPT-4o-mini</p>
              <p>⚡ <span className="text-neutral-400">Runtime:</span> Next.js 16 · Vercel Edge</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
