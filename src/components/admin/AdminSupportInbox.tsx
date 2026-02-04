import { useState, useEffect } from 'react';
import { Search, MessageSquare, RefreshCw, Zap, Clock, User, ChevronRight, AlertCircle, ExternalLink, Send, CheckCircle2, Loader2, CheckSquare, X, ShieldAlert, Bot, FileText, UserCircle } from 'lucide-react';
import { getAllTickets, updateTicketStatus, addAdminReply, createRemediationQuote, getChatTranscript, AdminTicketListItem, AuditMessage } from '../../services/adminSupportService';

export default function AdminSupportInbox({ onViewProject }: { onViewProject?: (id: string) => void }) {
  const [tickets, setTickets] = useState<AdminTicketListItem[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<AdminTicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // REPLY ENGINE STATE
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // AUDIT & RESOLVE STATE
  const [confirmResolve, setConfirmResolve] = useState<string | null>(null);
  const [activeAudit, setActiveAudit] = useState<AdminTicketListItem | null>(null);
  const [auditTranscript, setAuditTranscript] = useState<AuditMessage[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    let filtered = [...tickets];
    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.user_email?.toLowerCase().includes(query) ||
          t.message?.toLowerCase().includes(query) ||
          t.ticket_number?.toLowerCase().includes(query) ||
          t.subject?.toLowerCase().includes(query)
      );
    }
    setFilteredTickets(filtered);
  }, [tickets, statusFilter, searchQuery]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await getAllTickets();
      setTickets(data);
    } catch (error) {
      console.error('[AdminSupport] Load failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAudit = async (ticket: AdminTicketListItem) => {
    if (!ticket.conversation_id) return;
    setActiveAudit(ticket);
    setLoadingAudit(true);
    try {
      const transcript = await getChatTranscript(ticket.conversation_id);
      setAuditTranscript(transcript);
    } catch (e) {
      console.error('[Truth] Audit fetch failed', e);
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleSendReply = async (ticketId: string) => {
    if (!replyText.trim()) return;
    const ticket = tickets.find(t => t.id === ticketId);
    setSubmittingReply(true);
    
    try {
      // 1. Submit the technical reply
      const { success } = await addAdminReply(ticketId, replyText, ticket?.conversation_id || undefined);
      
      // 2. TASK 3: Automate Sales Lead if it's a Remediation "Zap"
      if (success && ticket?.priority === 'REMEDIATION') {
        await createRemediationQuote(ticket, 2499.00); // Default Baseline Hardware Quote
      }

      if (success) {
        setReplyText('');
        setReplyingTo(null);
        await loadTickets();
      }
    } catch (e) {
      console.error('[Truth] Mission Action Failed', e);
    } finally {
      setSubmittingReply(false);
    }
  };

  const executeResolve = async () => {
    if (!confirmResolve) return;
    try {
      await updateTicketStatus(confirmResolve, 'resolved');
      setConfirmResolve(null);
      await loadTickets();
    } catch (e) {
      console.error('[Truth] Resolve Failed', e);
    }
  };

  const getPriorityStyle = (priority: string | null) => {
    const p = priority?.toUpperCase();
    if (p === 'REMEDIATION' || p === 'CRITICAL' || p === 'ZAP') {
        return 'border-red-600 text-red-500 bg-red-600/10 animate-[burning_1.5s_infinite] shadow-[0_0_15px_rgba(220,38,38,0.4)]';
    }
    if (p === 'TECHNICAL' || p === 'HIGH') return 'border-[#27AAE1] text-[#27AAE1] bg-[#27AAE1]/5';
    return 'border-slate-500 text-slate-500 bg-slate-500/5';
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
      <RefreshCw className="w-8 h-8 text-[#27AAE1] animate-spin mb-4" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Syncing Intelligence Logs...</p>
    </div>
  );

  return (
    <div className="space-y-6 relative">
      <style>{`
        @keyframes burning { 
          0%, 100% { border-color: rgba(220, 38, 38, 0.8); box-shadow: 0 0 5px rgba(220, 38, 38, 0.4); } 
          50% { border-color: rgba(239, 68, 68, 1); box-shadow: 0 0 20px rgba(239, 68, 68, 0.8); transform: scale(1.05); } 
        }
      `}</style>

      {/* FILTER BAR */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex gap-1.5">
          {['all', 'new', 'in-review', 'resolved'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${
                statusFilter === s 
                ? 'bg-[#27AAE1] text-black shadow-[0_0_10px_#27AAE1]' 
                : 'bg-white/5 text-slate-500 border border-white/5'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* MISSION LOG CARDS */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTickets.map((ticket) => (
          <div 
            key={ticket.id} 
            className={`group bg-black/40 border border-white/5 rounded-[1.5rem] p-5 transition-all hover:bg-white/[0.02] ${
              ticket.status === 'resolved' ? 'opacity-30 grayscale' : ''
            }`}
          >
            {/* CARD HEADER */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-tighter transition-all ${getPriorityStyle(ticket.priority)}`}>
                  {ticket.priority || 'General'}
                </div>
                <span className="font-mono text-[9px] text-slate-600">
                  {ticket.ticket_number || `#${ticket.id.slice(0, 5)}`}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {ticket.status !== 'resolved' && (
                  <button onClick={() => setConfirmResolve(ticket.id)} className="p-1.5 text-slate-600 hover:text-green-500 transition-colors" title="Resolve">
                    <CheckSquare size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-white font-bold text-xs mb-1.5 uppercase tracking-tight">{ticket.subject}</h3>
              <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                <p className="text-slate-400 text-[11px] leading-relaxed italic truncate-2-lines">
                  "{ticket.message || 'No telemetry message.'}"
                </p>
              </div>
            </div>

            {ticket.admin_reply && (
              <div className="mb-4 ml-4 pl-4 border-l-2 border-[#27AAE1]/30">
                <p className="text-[8px] font-black text-[#27AAE1] uppercase tracking-widest mb-1 flex items-center gap-1">
                  <CheckCircle2 size={10} /> HQ Instruction
                </p>
                <p className="text-white text-[11px] font-medium leading-relaxed bg-[#27AAE1]/5 p-2 rounded-lg">
                  {ticket.admin_reply}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-white/5 shadow-inner">
                    <User size={12} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white truncate max-w-[120px]">
                      {ticket.user_email?.split('@')[0] || 'Tech'}
                    </p>
                    <p className="text-[8px] text-slate-600 lowercase">{new Date(ticket.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* TASK 1: Intelligence Audit Button */}
                  {ticket.conversation_id && (
                    <button 
                      onClick={() => handleOpenAudit(ticket)}
                      className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/20 transition-all shadow-[0_0_10px_rgba(168,85,247,0.1)]"
                      title="Intelligence Audit"
                    >
                      <Bot size={16} />
                    </button>
                  )}
                  {ticket.project_id && ticket.project_id !== '00000000-0000-0000-0000-000000000000' && (
                    <button 
                      onClick={() => onViewProject && onViewProject(ticket.project_id!)}
                      className="px-3 py-1.5 bg-[#27AAE1]/10 border border-[#27AAE1]/30 rounded-lg text-[#27AAE1] text-[9px] font-black uppercase tracking-widest hover:bg-[#27AAE1]/20 transition-all flex items-center gap-2"
                    >
                      <ExternalLink size={10} /> Spectate
                    </button>
                  )}
                  {ticket.status !== 'resolved' && (
                    <button 
                      onClick={() => setReplyingTo(replyingTo === ticket.id ? null : ticket.id)}
                      className={`p-2 rounded-lg transition-all ${replyingTo === ticket.id ? 'bg-[#27AAE1] text-black shadow-lg' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                    >
                      <MessageSquare size={16} />
                    </button>
                  )}
                </div>
              </div>

              {replyingTo === ticket.id && (
                <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Enter deployment instructions..."
                    className="w-full h-20 bg-black border border-[#27AAE1]/30 rounded-xl p-3 text-[11px] text-white placeholder:text-slate-800 outline-none focus:border-[#27AAE1] shadow-inner"
                  />
                  <div className="flex justify-end">
                    <button 
                      disabled={submittingReply || !replyText.trim()}
                      onClick={() => handleSendReply(ticket.id)}
                      className="px-4 py-2 bg-[#27AAE1] text-black rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-xl"
                    >
                      {submittingReply ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                      Deploy Response
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* INTELLIGENCE AUDIT OVERLAY (TASK 1 - REAL-TIME) */}
      {activeAudit && (
        <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in">
           <div className="w-full max-w-lg bg-[#0A0F1A] border-2 border-purple-500/30 rounded-[2rem] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(168,85,247,0.2)] animate-in zoom-in-95">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-purple-500/5">
                 <div className="flex items-center gap-3">
                    <Bot className="text-purple-400" size={20} />
                    <div>
                       <h2 className="text-xs font-black uppercase tracking-widest text-white">Intelligence Audit</h2>
                       <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Ref: {activeAudit.conversation_id}</p>
                    </div>
                 </div>
                 <button onClick={() => { setActiveAudit(null); setAuditTranscript([]); }} className="p-2 text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
              </div>
              
              <div className="p-6 h-[450px] overflow-y-auto space-y-4 scrollbar-hide">
                 {loadingAudit ? (
                   <div className="h-full flex flex-col items-center justify-center gap-4">
                      <Loader2 className="animate-spin text-purple-500" size={32} />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Decrypting Field Logs...</p>
                   </div>
                 ) : auditTranscript.length > 0 ? (
                   auditTranscript.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-center gap-2 mb-1.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                           {msg.role === 'assistant' ? <Bot size={10} className="text-purple-400" /> : <UserCircle size={10} className="text-slate-500" />}
                           <span className="text-[8px] font-black uppercase tracking-tighter text-slate-600">
                             {msg.role === 'assistant' ? 'Flux Engine' : (activeAudit.user_email?.split('@')[0] || 'Tech')}
                           </span>
                        </div>
                        <div className={`max-w-[90%] p-4 rounded-2xl border text-[11px] leading-relaxed ${
                          msg.role === 'assistant' 
                          ? 'bg-purple-500/5 border-purple-500/20 text-slate-300 italic' 
                          : 'bg-white/5 border-white/5 text-white font-medium'
                        }`}>
                          {msg.content}
                        </div>
                    </div>
                   ))
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                      <ShieldAlert size={40} className="mb-4 text-slate-600" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No Transcript Ledger Found</p>
                   </div>
                 )}
              </div>
              
              <div className="p-6 bg-black/40 border-t border-white/5 flex justify-end">
                 <button onClick={() => { setActiveAudit(null); setAuditTranscript([]); }} className="px-6 py-2 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Close Audit</button>
              </div>
           </div>
        </div>
      )}

      {/* RESOLVE MODAL (UNCHANGED) */}
      {confirmResolve && (
        <div className="fixed inset-0 z-[10005] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-sm bg-slate-900 border-2 border-green-600/40 rounded-[2.5rem] p-8 shadow-[0_0_80px_rgba(22,163,74,0.3)] text-center animate-in zoom-in-95">
             <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldAlert className="text-green-500" size={32} />
             </div>
             <h2 className="text-xl font-black italic uppercase text-white mb-2">Finalize Mission</h2>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-8">Mark this remediation as resolved in the HQ database?</p>
             <div className="flex flex-col gap-3">
                <button onClick={executeResolve} className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg active:scale-95 transition-all">Archive & Resolve</button>
                <button onClick={() => setConfirmResolve(null)} className="w-full py-4 text-slate-500 font-black uppercase tracking-widest text-[10px]">Abort Action</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}