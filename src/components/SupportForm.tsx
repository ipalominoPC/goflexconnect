import { useState, useEffect } from 'react';
import { X, Send, CheckCircle, AlertTriangle, MessageSquare } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { createSupportTicket, SupportCategory, getCategoryLabel } from '../services/supportService';

interface SupportFormProps {
  onClose: () => void;
}

export default function SupportForm({ onClose }: SupportFormProps) {
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'technical' as SupportCategory,
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      setUser(authUser);
      setFormData((prev) => ({
        ...prev,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || '',
        email: authUser.email || '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Support][UI] Submitting support request');
    console.log('[Support][UI] User authenticated:', !!user, 'User ID:', user?.id);
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      if (!formData.name.trim()) {
        throw new Error('Name is required');
      }
      if (!formData.email.trim()) {
        throw new Error('Email is required');
      }
      if (!formData.message.trim()) {
        throw new Error('Message is required');
      }

      console.log('[Support][UI] Form data valid, calling createSupportTicket...');

      const result = await createSupportTicket(
        {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          category: formData.category,
          subject: formData.subject.trim() || undefined,
          message: formData.message.trim(),
        },
        user?.id
      );

      console.log('[Support] Ticket created successfully:', result);
      setTicketNumber(result.ticketNumber);
      setSuccess(true);

      setFormData((prev) => ({
        ...prev,
        subject: '',
        message: '',
      }));

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error('[Support][UI] Failed to create ticket:', err);

      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Error: ${errorMessage}. If this persists, email support@goflexconnect.com`);
    } finally {
      setSubmitting(false);
    }
  };

  const categories: { value: SupportCategory; label: string }[] = [
    { value: 'technical', label: 'Technical Support' },
    { value: 'account', label: 'Account Support' },
    { value: 'billing', label: 'Billing' },
    { value: 'feature_request', label: 'Feature Request' },
    { value: 'feedback', label: 'Feedback' },
  ];

  if (success && ticketNumber) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Ticket Submitted!
            </h3>
            <p className="text-xl font-mono font-bold text-white">
              #{ticketNumber}
            </p>
          </div>
          <div className="p-6 text-center">
            <p className="text-base text-slate-700 dark:text-slate-300 mb-4">
              We've received your request and will respond within 24 hours
            </p>
            <button
              onClick={() => {
                setSuccess(false);
                onClose();
              }}
              className="w-full px-6 py-3 bg-[#27AAE1] hover:bg-[#0178B7] text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-4 z-50 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl lg:rounded-2xl shadow-xl w-full max-w-lg my-0 lg:my-8 max-h-[95vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-4">
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-slate-200 dark:border-slate-700 pt-safe">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#27AAE1]/20 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-[#27AAE1]" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Contact Support</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 dark:text-red-200 font-semibold">Error</p>
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-4 lg:space-y-5 pb-safe">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 lg:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#27AAE1]/40 focus:border-[#27AAE1] text-base touch-target"
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 lg:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#27AAE1]/40 focus:border-[#27AAE1] text-base touch-target"
                placeholder="your@email.com"
                inputMode="email"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Phone (optional)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 lg:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#27AAE1]/40 focus:border-[#27AAE1] text-base touch-target"
                placeholder="(555) 123-4567"
                inputMode="tel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as SupportCategory })}
                className="w-full px-4 py-3 lg:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#27AAE1]/40 focus:border-[#27AAE1] text-base touch-target"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Subject (optional)
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-3 lg:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#27AAE1]/40 focus:border-[#27AAE1] text-base touch-target"
              placeholder="Brief description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#27AAE1]/40 focus:border-[#27AAE1] resize-none text-base"
              placeholder="Please describe your issue or request in detail..."
              required
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Include as much detail as possible to help us assist you faster.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#27AAE1] hover:bg-[#0178B7] active:scale-95 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold py-4 lg:py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[#27AAE1]/25 flex items-center justify-center gap-2 touch-target"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Submit Support Request</span>
              </>
            )}
          </button>

          <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Powered by <span className="font-semibold text-[#27AAE1]">GoFlexConnect</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
