import { useState, useEffect } from 'react';
import { Search, MessageSquare, X, Save, RefreshCw, Mail, Phone, Calendar, AlertCircle } from 'lucide-react';
import {
  adminFetchSupportTickets,
  adminUpdateSupportTicket,
  AdminSupportTicket,
  SupportCategory,
  SupportStatus,
  SupportPriority,
  getCategoryLabel,
  getStatusInfo,
} from '../../services/supportService';

export default function AdminSupportInbox() {
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<AdminSupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<AdminSupportTicket | null>(null);
  const [saving, setSaving] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<SupportStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<SupportCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit state
  const [editStatus, setEditStatus] = useState<SupportStatus>('open');
  const [editPriority, setEditPriority] = useState<SupportPriority | null>(null);
  const [editNote, setEditNote] = useState('');

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tickets, statusFilter, categoryFilter, searchQuery]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await adminFetchSupportTickets();
      setTickets(data);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tickets];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((t) => t.category === categoryFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.email.toLowerCase().includes(query) ||
          t.name.toLowerCase().includes(query) ||
          t.subject?.toLowerCase().includes(query) ||
          t.message.toLowerCase().includes(query)
      );
    }

    setFilteredTickets(filtered);
  };

  const openTicketDetail = (ticket: AdminSupportTicket) => {
    setSelectedTicket(ticket);
    setEditStatus(ticket.status);
    setEditPriority(ticket.priority);
    setEditNote(ticket.lastAdminNote || '');
  };

  const closeDetail = () => {
    setSelectedTicket(null);
  };

  const handleSave = async () => {
    if (!selectedTicket) return;

    try {
      setSaving(true);

      await adminUpdateSupportTicket(selectedTicket.id, {
        status: editStatus,
        priority: editPriority,
        last_admin_note: editNote.trim() || null,
      });

      // Reload tickets
      await loadTickets();

      // Close detail
      closeDetail();
    } catch (error) {
      console.error('Error updating ticket:', error);
      alert('Failed to update ticket');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusCounts = {
    all: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    closed: tickets.filter((t) => t.status === 'closed').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#27AAE1]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#27AAE1]" />
            Support Inbox
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Manage user support requests and tickets
          </p>
        </div>
        <button
          onClick={loadTickets}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === 'all'
              ? 'bg-[#27AAE1] text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          All ({statusCounts.all})
        </button>
        <button
          onClick={() => setStatusFilter('open')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === 'open'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Open ({statusCounts.open})
        </button>
        <button
          onClick={() => setStatusFilter('in_progress')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === 'in_progress'
              ? 'bg-yellow-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          In Progress ({statusCounts.in_progress})
        </button>
        <button
          onClick={() => setStatusFilter('resolved')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === 'resolved'
              ? 'bg-green-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Resolved ({statusCounts.resolved})
        </button>
      </div>

      {/* Category & Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Category
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as SupportCategory | 'all')}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#27AAE1]/40"
          >
            <option value="all">All Categories</option>
            <option value="technical">Technical Support</option>
            <option value="account">Account Support</option>
            <option value="billing">Billing</option>
            <option value="feature_request">Feature Request</option>
            <option value="feedback">Feedback</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by email, name, or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#27AAE1]/40"
            />
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No tickets found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredTickets.map((ticket) => {
              const statusInfo = getStatusInfo(ticket.status);
              const categoryLabel = getCategoryLabel(ticket.category);

              return (
                <div
                  key={ticket.id}
                  onClick={() => openTicketDetail(ticket)}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
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
                        <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                          {categoryLabel}
                        </span>
                        {ticket.priority === 'high' && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded font-semibold">
                            <AlertCircle className="w-3 h-3" />
                            High Priority
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                        {ticket.subject || 'No subject'}
                      </h3>

                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-2">
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {ticket.email}
                        </span>
                        <span>{ticket.name}</span>
                      </div>

                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {ticket.message}
                      </p>
                    </div>

                    <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1 mb-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(ticket.createdAt)}
                      </div>
                      <div className="text-xs font-mono text-slate-400 dark:text-slate-500">
                        #{ticket.id.slice(0, 8)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Ticket Details
              </h3>
              <button
                onClick={closeDetail}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Ticket ID:</span>
                    <p className="font-mono font-semibold text-slate-900 dark:text-white">
                      {selectedTicket.id}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Created:</span>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formatDate(selectedTicket.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Name
                  </label>
                  <p className="text-slate-900 dark:text-white">{selectedTicket.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Email
                    </label>
                    <p className="text-slate-900 dark:text-white">{selectedTicket.email}</p>
                  </div>
                  {selectedTicket.phone && (
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Phone
                      </label>
                      <p className="text-slate-900 dark:text-white">{selectedTicket.phone}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <p className="text-slate-900 dark:text-white">
                    {getCategoryLabel(selectedTicket.category)}
                  </p>
                </div>

                {selectedTicket.subject && (
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Subject
                    </label>
                    <p className="text-slate-900 dark:text-white">{selectedTicket.subject}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Message
                  </label>
                  <p className="text-slate-900 dark:text-white whitespace-pre-wrap mt-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    {selectedTicket.message}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as SupportStatus)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#27AAE1]/40"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Priority
                    </label>
                    <select
                      value={editPriority || ''}
                      onChange={(e) =>
                        setEditPriority(e.target.value ? (e.target.value as SupportPriority) : null)
                      }
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#27AAE1]/40"
                    >
                      <option value="">Normal</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Admin Note
                  </label>
                  <textarea
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    rows={4}
                    placeholder="Add internal notes about this ticket..."
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#27AAE1]/40 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#27AAE1] hover:bg-[#0178B7] disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
                <button
                  onClick={closeDetail}
                  disabled={saving}
                  className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
