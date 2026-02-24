import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  getActiveCases, getControlTowerData, attorneys, getCasesByAttorney,
  getOverSlaCases, getStalledCases, getUpcomingDeadlines,
} from '../../data/mockData';
import { calculateFirmLCI, getEscalations } from '../../data/lciEngine';
import { getSettlementForecasts, getTop20MostLikely } from '../../data/forecastUtils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTION_CHIPS = [
  'How many active cases?',
  'Which attorney has the most cases?',
  'Show me the LCI score',
  'Any upcoming deadlines?',
  'What are the current escalations?',
];

function processQuery(query: string): string {
  const q = query.toLowerCase();

  // Help
  if (q.includes('help')) {
    return 'I can answer questions about:\n• Cases & inventory\n• Attorney caseloads\n• SLA compliance\n• Stalled cases\n• Settlement forecasts\n• LCI scores\n• Escalations & alerts\n• Deadlines & SOL\n• Stage bottlenecks\n• Risk flags\n• EV & exposure\n\nJust ask a question about any of these topics!';
  }

  // Cases / inventory / active
  if (q.includes('case') || q.includes('inventory') || q.includes('active')) {
    const active = getActiveCases();
    const data = getControlTowerData();
    const preLit = active.filter(c => c.parentStage === 'pre-lit').length;
    const lit = active.filter(c => c.parentStage === 'lit').length;
    const intake = active.filter(c => c.parentStage === 'intake').length;
    return `There are ${data.totalActive.toLocaleString()} active cases:\n• Pre-Litigation: ${preLit.toLocaleString()}\n• Litigation: ${lit.toLocaleString()}\n• Intake: ${intake.toLocaleString()}\n\nTotal EV: $${(data.totalEV / 1_000_000).toFixed(1)}M across the portfolio.`;
  }

  // Attorney / caseload
  if (q.includes('attorney') || q.includes('caseload') || q.includes('lawyer')) {
    const attData = attorneys.map(a => ({
      name: a.name,
      count: getCasesByAttorney(a.name).length,
    })).sort((a, b) => b.count - a.count);
    const top = attData[0];
    const avg = Math.round(attData.reduce((s, a) => s + a.count, 0) / attData.length);
    const topThree = attData.slice(0, 3).map(a => `${a.name} (${a.count})`).join(', ');
    return `Top attorney by caseload: ${top.name} with ${top.count} cases.\nAverage caseload: ${avg} cases/attorney.\n\nTop 3: ${topThree}`;
  }

  // SLA / compliance
  if (q.includes('sla') || q.includes('compliance')) {
    const overSla = getOverSlaCases();
    const data = getControlTowerData();
    return `${overSla.length.toLocaleString()} cases (${data.overSlaPct}%) are currently over SLA.\n\nOver-SLA breakdown by stage:\n${data.stageCounts.map(sc => `• ${sc.parentStage}: ${sc.overSla} over SLA out of ${sc.count}`).join('\n')}`;
  }

  // Stall / inactive
  if (q.includes('stall') || q.includes('inactive') || q.includes('silent')) {
    const stalled = getStalledCases();
    const avgDays = stalled.length > 0
      ? Math.round(stalled.reduce((s, c) => {
          const days = Math.ceil((new Date('2026-02-19').getTime() - new Date(c.lastActivityDate).getTime()) / 86400000);
          return s + days;
        }, 0) / stalled.length)
      : 0;
    return `${stalled.length.toLocaleString()} stalled cases (no activity 21+ days).\nAverage days inactive: ${avgDays}.\n\nThese cases should be reviewed for follow-up action.`;
  }

  // Forecast / settlement
  if (q.includes('forecast') || q.includes('settlement')) {
    const forecasts = getSettlementForecasts();
    const top20 = getTop20MostLikely();
    const totalWeighted = forecasts.reduce((s, f) => s + f.weightedValue, 0);
    const top20Value = top20.reduce((s, f) => s + f.weightedValue, 0);
    return `Settlement pipeline: $${(totalWeighted / 1_000_000).toFixed(1)}M weighted value across ${forecasts.length} forecasted settlements.\n\nTop 20 most likely: $${(top20Value / 1_000_000).toFixed(1)}M weighted value.\nAverage probability: ${Math.round(top20.reduce((s, f) => s + f.probability, 0) / top20.length * 100)}%`;
  }

  // LCI / score / health
  if (q.includes('lci') || q.includes('score') || q.includes('health')) {
    const lci = calculateFirmLCI();
    const bandLabel = lci.band === 'green' ? 'Healthy' : lci.band === 'amber' ? 'Watch' : 'Critical';
    const weakest = [...lci.layers].sort((a, b) => a.score - b.score)[0];
    const strongest = [...lci.layers].sort((a, b) => b.score - a.score)[0];
    return `Firm LCI: ${lci.score} (${bandLabel})\n\nLayer scores:\n${lci.layers.map(l => `• ${l.name}: ${l.score} (${l.band})`).join('\n')}\n\nStrongest: ${strongest.name} at ${strongest.score}\nWeakest: ${weakest.name} at ${weakest.score}`;
  }

  // Escalation / alert
  if (q.includes('escalation') || q.includes('alert') || q.includes('escal')) {
    const escs = getEscalations();
    const byLevel: Record<string, number> = {};
    for (const e of escs) {
      byLevel[e.escalationLevel] = (byLevel[e.escalationLevel] || 0) + 1;
    }
    const levelSummary = Object.entries(byLevel).map(([l, c]) => `${c} ${l}`).join(', ');
    return `${escs.length} active escalations: ${levelSummary}.\n\nTop escalations:\n${escs.slice(0, 4).map(e => `• ${e.metricName} (${e.layerName}) — ${e.weeksInRed}w in red, ${e.escalationLevel} level`).join('\n')}`;
  }

  // Deadline / SOL
  if (q.includes('deadline') || q.includes('sol') || q.includes('statute')) {
    const deadlines = getUpcomingDeadlines(30);
    const sol = deadlines.filter(d => d.type === 'SOL');
    const other = deadlines.length - sol.length;
    const within7 = sol.filter(d => {
      const days = Math.ceil((new Date(d.date).getTime() - new Date('2026-02-19').getTime()) / 86400000);
      return days >= 0 && days < 7;
    }).length;
    return `${deadlines.length} deadlines in the next 30 days.\n• SOL deadlines: ${sol.length}\n• Other deadlines: ${other}\n\nUrgent: ${within7} SOL deadlines within 7 days.`;
  }

  // Stage / bottleneck
  if (q.includes('stage') || q.includes('bottleneck')) {
    const data = getControlTowerData();
    const sorted = [...data.stageCounts].sort((a, b) => b.avgAge - a.avgAge);
    const worst = sorted[0];
    const worstSlaPct = worst.count > 0 ? Math.round(worst.overSla / worst.count * 100) : 0;
    return `Stage overview:\n${data.stageCounts.map(sc => `• ${sc.parentStage}: ${sc.count} cases, avg ${sc.avgAge}d, ${sc.count > 0 ? Math.round(sc.overSla / sc.count * 100) : 0}% over SLA`).join('\n')}\n\nBottleneck: ${worst.parentStage} with avg ${worst.avgAge} days and ${worstSlaPct}% over SLA.`;
  }

  // Risk
  if (q.includes('risk')) {
    const active = getActiveCases();
    const highRisk = active.filter(c => c.riskFlags.length >= 2);
    const critical = active.filter(c => c.riskFlags.length >= 3);
    return `${highRisk.length.toLocaleString()} high-risk cases (2+ flags).\n${critical.length} critical cases (3+ flags).\n\nCommon risk flags:\n• Over SLA: ${active.filter(c => c.riskFlags.includes('Over SLA')).length}\n• Silent stall: ${active.filter(c => c.riskFlags.includes('Silent stall')).length}\n• Near SOL: ${active.filter(c => c.riskFlags.includes('Near SOL')).length}`;
  }

  // EV / value / exposure
  if (q.includes('ev') || q.includes('value') || q.includes('exposure')) {
    const data = getControlTowerData();
    const active = getActiveCases();
    const avgEv = active.length > 0 ? Math.round(data.totalEV / active.length) : 0;
    const totalExposure = active.reduce((s, c) => s + c.exposureAmount, 0);
    return `Total EV: $${(data.totalEV / 1_000_000).toFixed(1)}M\nAvg EV/case: $${(avgEv / 1_000).toFixed(0)}K\nTotal exposure: $${(totalExposure / 1_000_000).toFixed(1)}M\n\nEV confidence avg: ${Math.round(active.reduce((s, c) => s + c.evConfidence, 0) / active.length * 100)}%`;
  }

  // Fallback
  return 'I can help with questions about:\n• Cases & inventory\n• Attorney caseloads\n• SLA compliance\n• Stalled cases\n• Settlement forecasts\n• LCI health scores\n• Escalations\n• Deadlines\n• Bottlenecks\n• Risk flags\n• EV & exposure\n\nTry asking about one of these topics!';
}

let msgCounter = 0;

export function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing, scrollToBottom]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${++msgCounter}`,
      role: 'user',
      content: text.trim(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const response = processQuery(text);
      const assistantMsg: ChatMessage = {
        id: `msg-${++msgCounter}`,
        role: 'assistant',
        content: response,
      };
      setMessages(prev => [...prev, assistantMsg]);
      setTyping(false);
    }, 500);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center"
          aria-label="Open AI chat"
        >
          <MessageCircle size={22} />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[500px] rounded-xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-primary" />
              <span className="text-sm font-semibold text-foreground">AI Assistant</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && !typing && (
              <div className="space-y-3">
                <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground/80">
                  Hi! I'm your firm analytics assistant. Ask me about cases, attorneys, SLA compliance, forecasts, and more.
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTION_CHIPS.map(chip => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => sendMessage(chip)}
                      className="text-xs px-2.5 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(msg => (
              <div
                key={msg.id}
                className={cn(
                  'max-w-[85%] rounded-lg p-2.5 text-sm whitespace-pre-line',
                  msg.role === 'user'
                    ? 'ml-auto bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-foreground',
                )}
              >
                {msg.content}
              </div>
            ))}

            {typing && (
              <div className="bg-muted/50 rounded-lg p-2.5 text-sm text-muted-foreground max-w-[85%]">
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-2 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your firm data..."
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || typing}
              className="shrink-0 w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              aria-label="Send message"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
