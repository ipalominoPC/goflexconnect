import { useState, useEffect } from 'react';
import { ArrowLeft, Ticket, Clock, CheckCircle2, AlertCircle, RefreshCw, Shield } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { isAdminEmail } from '../config/admin';

interface TicketListItem {
  id: string;
  ticket_number: string;
  category: string;
  subject: string | null;
  message?: string;
  status: string;
  created_at: string;
  name: string;
  email: string;
}

interface MyTicketsProps {
  onBack: () => void;
}

export default function MyTickets({ onBack }: MyTicketsProps) {
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[MyTickets] No user found');
        setLoading(false);
        return;
      }

      const adminEmails = ['ipalomino@gmail.com', 'isaac@goflexconnect.com', 'dev@goflexconnect.com'];
      const adminStatus = adminEmails.includes(user.email || '');
      setIsAdmin(adminStatus);

      console.log('[MyTickets] User:', user.email, 'ID:', user.id, 'Admin:', adminStatus);

      // Build query
      const query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filter for non-admin users only
      if (!adminStatus) {
        console.log('[MyTickets] Non-admin - filtering by user_id:', user.id);
        const { data: tickets, error } = await query.eq('user_id', user.id);

        if (error) {
          console.error('[MyTickets] Query error:', error);
          throw error;
        }

        console.log('[MyTickets] Non-admin loaded:', tickets?.length || 0, 'tickets');
        setTickets(tickets || []);
      } else {
        console.log('[MyTickets] Admin mode - loading ALL tickets');
        const { data: tickets, error } = await query;

        if (error) {
          console.error('[MyTickets] Query error:', error);
          throw error;
        }

        console.log('[MyTickets] Admin loaded:', tickets?.length || 0, 'tickets');
        console.log('[MyTickets] First ticket:', tickets?.[0]);
        setTickets(tickets || []);
      }
    } catch (err: any) {
      console.error('[MyTickets] Fatal error:', err);
      alert('Failed to load tickets. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      open: { label: 'Open', icon: AlertCircle, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
      in_progress: { label: 'In Progress', icon: Clock, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
      resolved: { label: 'Resolved', icon: CheckCircle2, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
      closed: { label: 'Closed', icon: CheckCircle2, color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
    };

    const config = statusMap[status as keyof typeof statusMap] || statusMap.open;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    const categoryMap = {
      technical: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      account: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      billing: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      feature_request: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      feedback: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    };

    const color = categoryMap[category as keyof typeof categoryMap] || 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
        {category.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Support Tickets</h1>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-full shadow-sm">
                    <Shield className="w-3.5 h-3.5" />
                    Admin Mode
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Track your support requests</p>
            </div>
          </div>
          <button
            onClick={loadTickets}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#27AAE1] hover:bg-[#0178B7] text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading && tickets.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-spin" />
            <p className="text-slate-600 dark:text-slate-400">Loading your tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
            <Ticket className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Support Tickets Yet</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              When you submit a support request, it will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-mono font-bold text-[#27AAE1]">
                      #{ticket.ticket_number}
                    </span>
                    {getCategoryBadge(ticket.category)}
                  </div>
                  {getStatusBadge(ticket.status)}
                </div>

                {ticket.subject && (
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {ticket.subject}
                  </h3>
                )}

                <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                  {ticket.message}
                </p>

                <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-4">
                    <span>Submitted {formatDate(ticket.created_at)}</span>
                    {isAdmin && (
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {ticket.name} ({ticket.email})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
