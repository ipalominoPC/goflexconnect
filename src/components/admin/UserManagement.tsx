/**
 * User Management Component
 *
 * Allows admins to view all users and manage manual PRO access
 */

import { useState, useEffect } from 'react';
import { Users, Search, Award, X, Check, AlertCircle } from 'lucide-react';
import {
  listUsersWithPlans,
  updatePlanOverride,
  UserWithPlan,
} from '../../services/adminPlanService';
import { PlanId } from '../../config/planLimits';

export default function UserManagement() {
  const [users, setUsers] = useState<UserWithPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithPlan | null>(null);
  const [editingPlan, setEditingPlan] = useState<PlanId | null>(null);
  const [editingReason, setEditingReason] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const usersData = await listUsersWithPlans();
      setUsers(usersData);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPlan = (user: UserWithPlan) => {
    setSelectedUser(user);
    setEditingPlan(user.effective_plan);
    setEditingReason(user.override?.reason || '');
  };

  const handleSavePlan = async () => {
    if (!selectedUser || !editingPlan) return;

    setUpdating(true);
    setError(null);

    const result = await updatePlanOverride(
      selectedUser.id,
      editingPlan.toUpperCase() as 'FREE' | 'PRO',
      editingReason || undefined
    );

    setUpdating(false);

    if (result.success) {
      setSelectedUser(null);
      setEditingPlan(null);
      setEditingReason('');
      loadUsers();
    } else {
      setError(result.error || 'Failed to update plan');
    }
  };

  const handleCancelEdit = () => {
    setSelectedUser(null);
    setEditingPlan(null);
    setEditingReason('');
    setError(null);
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#27AAE1]/10 dark:bg-[#27AAE1]/20 rounded-xl flex items-center justify-center">
          <Users className="w-6 h-6 text-[#27AAE1]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            User Management
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage manual PRO access and beta testers
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search users by email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#27AAE1] focus:border-transparent"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-800 dark:text-red-300">{error}</div>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-[#27AAE1] rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading users...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Override
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      {searchQuery ? 'No users found matching your search' : 'No users yet'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            user.effective_plan === 'pro'
                              ? 'bg-[#27AAE1]/10 text-[#27AAE1]'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {user.effective_plan === 'pro' ? 'PRO' : 'FREE'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.override ? (
                          <div className="flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-[#27AAE1]" />
                            <span className="text-xs text-slate-600 dark:text-slate-400">
                              {user.override.reason || 'Manual access'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">–</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEditPlan(user)}
                          className="text-sm font-semibold text-[#27AAE1] hover:text-[#1d8bb8] transition-colors"
                        >
                          Edit Plan
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                Total users: <strong className="text-slate-900 dark:text-slate-100">{users.length}</strong>
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                PRO users: <strong className="text-[#27AAE1]">{users.filter((u) => u.effective_plan === 'pro').length}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Edit Plan
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {selectedUser.email}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Plan Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Plan
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setEditingPlan('free')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      editingPlan === 'free'
                        ? 'border-[#27AAE1] bg-[#27AAE1]/5'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-900 dark:text-slate-100">FREE</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Default plan</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setEditingPlan('pro')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      editingPlan === 'pro'
                        ? 'border-[#27AAE1] bg-[#27AAE1]/5'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold text-[#27AAE1]">PRO</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Unlimited</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Reason (only for PRO) */}
              {editingPlan === 'pro' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Reason (optional)
                  </label>
                  <input
                    type="text"
                    value={editingReason}
                    onChange={(e) => setEditingReason(e.target.value)}
                    placeholder="e.g., Beta tester, Comped access"
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#27AAE1] focus:border-transparent"
                  />
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={handleCancelEdit}
                disabled={updating}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlan}
                disabled={updating}
                className="px-6 py-2 bg-[#27AAE1] hover:bg-[#1d8bb8] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {updating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Changes
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
