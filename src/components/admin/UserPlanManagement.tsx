import { useState, useEffect } from 'react';
import { Search, Shield, Calendar, CheckCircle, XCircle, Edit2, Save, X, AlertTriangle } from 'lucide-react';
import { resolveUserPlan, ResolvedPlan } from '../../services/planService';
import { PlanId } from '../../config/planLimits';
import { adminFetchUsersWithPlans, adminUpdatePlanOverride, adminClearPlanOverride } from '../../services/adminUserService';

interface UserProfile {
  id: string;
  email: string;
  plan_override: PlanId | null;
  plan_override_reason: string | null;
  plan_override_expires_at: string | null;
  created_at: string;
  resolvedPlan?: ResolvedPlan;
}

export default function UserPlanManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    plan_override: '' as '' | 'FREE' | 'PRO',
    plan_override_reason: '',
    plan_override_expires_at: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use admin RPC to fetch users with plan data
      const adminUsers = await adminFetchUsersWithPlans();

      // Resolve effective plan for each user
      const usersWithPlans: UserProfile[] = await Promise.all(
        adminUsers.map(async (user) => {
          const resolvedPlan = await resolveUserPlan(user.id);

          return {
            id: user.id,
            email: user.email || 'No email',
            plan_override: user.plan_override || null,
            plan_override_reason: user.plan_override_reason || null,
            plan_override_expires_at: user.plan_override_expires_at || null,
            created_at: user.created_at,
            resolvedPlan,
          };
        })
      );

      setUsers(usersWithPlans);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (user: UserProfile) => {
    setEditingUserId(user.id);
    setEditForm({
      plan_override: user.plan_override || '',
      plan_override_reason: user.plan_override_reason || '',
      plan_override_expires_at: user.plan_override_expires_at
        ? new Date(user.plan_override_expires_at).toISOString().slice(0, 16)
        : '',
    });
    setError(null);
    setSuccessMessage(null);
  };

  const cancelEditing = () => {
    setEditingUserId(null);
    setEditForm({ plan_override: '', plan_override_reason: '', plan_override_expires_at: '' });
    setError(null);
  };

  const saveOverride = async (userId: string) => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      await adminUpdatePlanOverride(userId, {
        plan_override: editForm.plan_override || null,
        plan_override_reason: editForm.plan_override_reason || null,
        plan_override_expires_at: editForm.plan_override_expires_at || null,
      });

      setSuccessMessage('Plan override updated successfully');
      setEditingUserId(null);

      await loadUsers();
    } catch (err) {
      console.error('Error updating plan override:', err);
      setError(err instanceof Error ? err.message : 'Failed to update plan override');
    } finally {
      setSaving(false);
    }
  };

  const clearOverride = async (userId: string) => {
    if (!confirm('Are you sure you want to clear this plan override?')) return;

    try {
      setSaving(true);
      setError(null);

      await adminClearPlanOverride(userId);

      setSuccessMessage('Plan override cleared successfully');
      await loadUsers();
    } catch (err) {
      console.error('Error clearing plan override:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear plan override');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'None';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-goflex-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-goflex-blue" />
            User Plan Management
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Grant manual PRO access for beta testers and internal users
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 dark:text-red-200 font-semibold">Error</p>
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <p className="text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-goflex-blue/20 focus:border-goflex-blue"
        />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Effective Plan
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Override Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredUsers.map((user) => {
                const isEditing = editingUserId === user.id;
                const expired = isExpired(user.plan_override_expires_at);

                return (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        user.resolvedPlan?.plan === 'pro'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {user.resolvedPlan?.plan === 'pro' ? 'PRO' : 'FREE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isEditing ? (
                        <select
                          value={editForm.plan_override}
                          onChange={(e) => setEditForm({ ...editForm, plan_override: e.target.value as '' | 'FREE' | 'PRO' })}
                          className="px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                        >
                          <option value="">No override (Default)</option>
                          <option value="FREE">Force FREE</option>
                          <option value="PRO">Force PRO (Comp/Beta)</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1 text-xs ${
                          user.plan_override
                            ? expired
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-green-600 dark:text-green-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {user.plan_override ? (
                            <>
                              {expired ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                              Override: {user.plan_override} {expired && '(Expired)'}
                            </>
                          ) : (
                            'None (Default)'
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.plan_override_reason}
                          onChange={(e) => setEditForm({ ...editForm, plan_override_reason: e.target.value })}
                          placeholder="e.g., Beta tester"
                          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400"
                        />
                      ) : (
                        user.plan_override_reason || '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="datetime-local"
                            value={editForm.plan_override_expires_at}
                            onChange={(e) => setEditForm({ ...editForm, plan_override_expires_at: e.target.value })}
                            className="px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => setEditForm({ ...editForm, plan_override_expires_at: '' })}
                            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                          >
                            Clear
                          </button>
                        </div>
                      ) : (
                        <span className={expired ? 'text-red-600 dark:text-red-400' : ''}>
                          {formatDate(user.plan_override_expires_at)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => saveOverride(user.id)}
                            disabled={saving}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-goflex-blue text-white rounded-lg hover:bg-goflex-blue-dark transition-colors disabled:opacity-50"
                          >
                            <Save className="w-3 h-3" />
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            disabled={saving}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEditing(user)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                            Manage
                          </button>
                          {user.plan_override && (
                            <button
                              onClick={() => clearOverride(user.id)}
                              disabled={saving}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                            >
                              <XCircle className="w-3 h-3" />
                              Clear
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">No users found</p>
          </div>
        )}
      </div>

      <div className="text-sm text-slate-500 dark:text-slate-400">
        Showing {filteredUsers.length} of {users.length} users
      </div>
    </div>
  );
}
