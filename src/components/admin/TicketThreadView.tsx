import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, CheckCircle2, User, Headphones, Map as MapIcon, Zap } from 'lucide-react';
import {
  getTicketById,
  getTicketMessages,
  sendAdminReply,
  resolveTicket,
  AdminSupportTicket,
  TicketMessage,
  getCategoryLabel,
  getStatusInfo,
} from '../../services/supportService';

interface TicketThreadViewProps {
  ticketId: string;
  onClose: () => void;
  onViewProject?: (projectId: string) => void;
}

export default function TicketThreadView({ ticketId, onClose, onViewProject }: TicketThreadViewProps) {
  const [ticket, setTicket] = useState<AdminSupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadTicketData(); }, [ticketId]);
  useEffect(() => { scrollToBottom(); }, [messages]);

  const loadTicketData = async () => {
    try {
      setLoading(true);
      const [ticketData, messagesData] = await Promise.all([
        getTicketById(ticketId),
        getTicketMessages(ticketId),
      ]);
      setTicket(ticketData);
      setMessages(messagesData);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };

  const handleSendReply = async () => {
    if (!replyText.trim() || !ticket) return;
    try {
      setSending(true);
      await sendAdminReply(ticketId, replyText.trim());
      setReplyText('');
      await loadTicketData();
    } catch (e) { alert('Failed to send reply'); } finally { setSending(false); }
  };

  const handleResolve = async () => {
    try {
      setResolving(true);
      await resolveTicket(ticketId);
      await loadTicketData();
    } catch (e) { alert('Failed to resolve'); } finally { setResolving(false); }
  };

  if (loading || !ticket) return <div className="p-10 text-center animate-pulse text-[#27AAE1]">Opening Secure Line...</div>;

  const statusInfo = getStatusInfo(ticket.status);
  const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';

  return (
    <div className="space-y-6 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* MISSION CONTROL HEADER */}
      <div className="bg-slate-900 border border-[#27AAE1]/30 rounded-[2rem] p-8 shadow-[0_0_30px_rgba(39,170,225,0.1)]">
        <button onClick={onClose} className="flex items-center gap-2 text-slate-500 hover:text-[#27AAE1] mb-6 uppercase text-[10px] font-black tracking-widest transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Radar
        </button>

        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-black italic tracking-tighter text-white">
                {ticket.subject || 'Inbound Request'}
              </h2>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-${statusInfo.color}-500/10 text-${statusInfo.color}-500 border border-${statusInfo.color}-500/20`}>
                {statusInfo.label}
              </span>
            </div>
            <p className="text-[#27AAE1] font-mono text-xs font-bold mb-4">{ticket.ticketNumber || `#${ticket.id.slice(0, 8)}`}</p>
            
            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 inline-block">
              <p className="text-sm font-bold text-white">{ticket.name}</p>
              <p className="text-xs text-slate-500">{ticket.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* THE TELEPORT BUTTON */}
            {ticket.projectId && (
              <button 
                onClick={() => onViewProject?.(ticket.projectId!)}
                className="flex items-center gap-2 px-6 py-4 bg-[#27AAE1] text-white font-black rounded-2xl shadow-[0_0_20px_rgba(39,170,225,0.4)] hover:scale-105 active:scale-95 transition-all uppercase text-[10px] tracking-widest"
              >
                <Zap className="w-5 h-5 fill-white" />
                Teleport to Site Data
              </button>
            )}

            {!isResolved && (
              <button onClick={handleResolve} className="flex items-center gap-2 px-6 py-4 bg-green-600/10 border border-green-600/30 text-green-500 font-black rounded-2xl hover:bg-green-600 hover:text-white transition-all uppercase text-[10px] tracking-widest">
                <CheckCircle2 className="w-5 h-5" />
                Resolve
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-8">
        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10">
          {messages.map((msg, i) => {
            const isCustomer = msg.senderType === 'customer';
            return (
              <div key={i} className={`flex gap-4 ${isCustomer ? '' : 'flex-row-reverse'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isCustomer ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 'bg-[#27AAE1]/10 border-[#27AAE1]/20 text-[#27AAE1]'}`}>
                  {isCustomer ? <User className="w-5 h-5" /> : <Headphones className="w-5 h-5" />}
                </div>
                <div className={`max-w-[80%] ${isCustomer ? 'text-left' : 'text-right'}`}>
                   <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">{msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString()}</p>
                   <div className={`px-5 py-4 rounded-2xl text-sm ${isCustomer ? 'bg-slate-800 text-white rounded-tl-none' : 'bg-[#27AAE1] text-white rounded-tr-none'}`}>
                     {msg.message}
                   </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {!isResolved && (
        <div className="bg-slate-900 border border-white/5 rounded-[2rem] p-8">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-[#27AAE1]/50 transition-all mb-4 min-h-[120px]"
            placeholder="TYPE SUPPORT RESPONSE..."
          />
          <div className="flex justify-end">
            <button onClick={handleSendReply} disabled={sending || !replyText.trim()} className="px-10 py-4 bg-[#27AAE1] text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all uppercase text-[10px] tracking-widest">
              {sending ? 'SENDING...' : 'SEND RESPONSE'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
