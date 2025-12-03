import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, CheckCircle2, Sparkles, User, Headphones } from 'lucide-react';
import {
  getTicketById,
  getTicketMessages,
  sendAdminReply,
  resolveTicket,
  AdminSupportTicket,
  TicketMessage,
  getCategoryLabel,
  getStatusInfo,
  SupportStatus,
} from '../../services/supportService';

interface TicketThreadViewProps {
  ticketId: string;
  onClose: () => void;
}

export default function TicketThreadView({ ticketId, onClose }: TicketThreadViewProps) {
  const [ticket, setTicket] = useState<AdminSupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTicketData();
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadTicketData = async () => {
    try {
      setLoading(true);
      const [ticketData, messagesData] = await Promise.all([
        getTicketById(ticketId),
        getTicketMessages(ticketId),
      ]);
      setTicket(ticketData);
      setMessages(messagesData);
    } catch (error) {
      console.error('Error loading ticket data:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !ticket) return;

    try {
      setSending(true);
      await sendAdminReply(ticketId, replyText.trim());
      setReplyText('');
      await loadTicketData();
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    if (!ticket) return;

    try {
      setResolving(true);
      await resolveTicket(ticketId);

      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);

      await loadTicketData();
    } catch (error) {
      console.error('Error resolving ticket:', error);
      alert('Failed to resolve ticket');
    } finally {
      setResolving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#27AAE1]"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 dark:text-slate-400">Ticket not found</p>
      </div>
    );
  }

  const statusInfo = getStatusInfo(ticket.status);
  const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';

  return (
    <div className="space-y-6 pb-6">
      {showConfetti && <ConfettiAnimation />}

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Inbox
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {ticket.subject || 'Support Ticket'}
              </h2>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                  statusInfo.color === 'blue'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    : statusInfo.color === 'yellow'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : statusInfo.color === 'green'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {statusInfo.label}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
              <span className="font-mono text-[#27AAE1] font-semibold">
                {ticket.ticketNumber || `#${ticket.id.slice(0, 8)}`}
              </span>
              <span>•</span>
              <span>{getCategoryLabel(ticket.category)}</span>
              <span>•</span>
              <span>{formatDate(ticket.createdAt)}</span>
            </div>

            <div className="mt-3">
              <p className="text-slate-700 dark:text-slate-300">
                <strong>{ticket.name}</strong> ({ticket.email})
              </p>
              {ticket.phone && (
                <p className="text-sm text-slate-600 dark:text-slate-400">{ticket.phone}</p>
              )}
            </div>
          </div>

          {!isResolved && (
            <button
              onClick={handleResolve}
              disabled={resolving}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {resolving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Resolving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Resolve Ticket</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Messages Thread */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Conversation</h3>

        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {messages.map((message, index) => {
            const isCustomer = message.senderType === 'customer';
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isCustomer ? 'flex-row' : 'flex-row-reverse'}`}
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    isCustomer
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  }`}
                >
                  {isCustomer ? (
                    <User className="w-5 h-5" />
                  ) : (
                    <Headphones className="w-5 h-5" />
                  )}
                </div>

                <div className={`flex-1 ${isCustomer ? 'text-left' : 'text-right'}`}>
                  <div className="flex items-center gap-2 mb-1" style={{ justifyContent: isCustomer ? 'flex-start' : 'flex-end' }}>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {message.senderName}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(message.createdAt)}
                    </span>
                  </div>

                  <div
                    className={`inline-block max-w-[80%] rounded-2xl px-4 py-3 ${
                      isCustomer
                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-tl-none'
                        : 'bg-[#27AAE1] text-white rounded-tr-none'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Reply Box */}
      {!isResolved && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Send Reply</h3>
          <div className="space-y-4">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={5}
              placeholder="Type your reply here... (Cmd+Enter to send)"
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#27AAE1]/40 resize-none"
              disabled={sending}
            />

            <div className="flex justify-end">
              <button
                onClick={handleSendReply}
                disabled={sending || !replyText.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-[#27AAE1] hover:bg-[#0178B7] disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Send Reply</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfettiAnimation() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10%',
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: ['#27AAE1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][
                Math.floor(Math.random() * 5)
              ],
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        </div>
      ))}
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
}
