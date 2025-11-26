import { useState } from 'react';
import { X, Mail, User, Phone, MessageSquare, Paperclip, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface SupportFormProps {
  onClose: () => void;
}

export default function SupportForm({ onClose }: SupportFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setError('File size must be less than 5MB');
        return;
      }
      setAttachment(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let attachmentInfo = '';

      // Convert attachment to base64 if provided
      if (attachment) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(attachment);
        });
        const base64Data = await base64Promise;
        attachmentInfo = `${attachment.name} (${(attachment.size / 1024).toFixed(2)} KB)`;
      }

      // Send email via edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: 'support@goflexconnect.com',
            subject: `Support Request from ${formData.name}`,
            html: `
              <h2>New Support Request</h2>
              <p><strong>Name:</strong> ${formData.name}</p>
              <p><strong>Email:</strong> ${formData.email}</p>
              ${formData.phone ? `<p><strong>Phone:</strong> ${formData.phone}</p>` : ''}
              <p><strong>Message:</strong></p>
              <p>${formData.message.replace(/\n/g, '<br>')}</p>
              ${attachmentInfo ? `<p><strong>Attachment:</strong> ${attachmentInfo}</p>` : ''}
              <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666;">
                Please reply directly to this email to respond to ${formData.name} at ${formData.email}
              </p>
            `
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send support request');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to send support request');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Thank You!</h3>
          <p className="text-slate-600">Your message has been successfully submitted. Our support team will get back to you shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">Contact Support</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Name *
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-2">
              <Phone className="w-4 h-4 inline mr-1" />
              Phone Number (Optional)
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-2">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Describe the Issue *
            </label>
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              rows={5}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 resize-none"
              placeholder="Please describe the issue you're experiencing in detail..."
            />
          </div>

          <div>
            <label htmlFor="attachment" className="block text-sm font-semibold text-slate-700 mb-2">
              <Paperclip className="w-4 h-4 inline mr-1" />
              Attach Screenshot or File (Optional)
            </label>
            <div className="relative">
              <input
                id="attachment"
                type="file"
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-goflex-blue hover:file:bg-blue-100 file:cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-2">Max file size: 5MB</p>
            </div>
            {attachment && (
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                <Paperclip className="w-4 h-4" />
                <span>{attachment.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="text-red-600 hover:text-red-700 ml-auto"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-goflex-blue to-goflex-blue-dark text-white py-3.5 px-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-goflex-blue/25 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-goflex-blue focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                Submit Support Request
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
