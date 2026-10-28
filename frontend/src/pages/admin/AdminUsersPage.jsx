import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Users,
  Search,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  Edit2,
  AlertCircle,
} from 'lucide-react';

const AdminUsersPage = () => {
  const { user: currentAdmin } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Role Edit Modal State
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('student');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      params.append('limit', 50);

      const res = await api.get(`/users?${params.toString()}`);
      setUsers(res.data.data.users || []);
    } catch (err) {
      showToast('Failed to load user accounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleOpenRoleModal = (u) => {
    setTargetUser(u);
    setSelectedRole(u.role);
    setRoleModalOpen(true);
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!targetUser) return;
    setSubmitting(true);

    try {
      await api.patch(`/users/${targetUser._id}/role`, { role: selectedRole });
      showToast(`User role updated to ${selectedRole}`, 'success');
      setRoleModalOpen(false);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update role', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (u) => {
    if (String(u._id) === String(currentAdmin._id)) {
      showToast('You cannot suspend your own account', 'warning');
      return;
    }

    const nextStatus = !u.isActive;
    const confirmMsg = nextStatus
      ? `Reactivate account for ${u.name}?`
      : `Suspend account for ${u.name}? They will be immediately signed out.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.patch(`/users/${u._id}/status`, { isActive: nextStatus });
      showToast(`Account ${nextStatus ? 'reactivated' : 'suspended'}.`, 'success');
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change status', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            User Accounts & Roles
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage student, faculty, and administrator privileges and account active states
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, roll no, or department..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </form>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
        >
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="faculty">Faculty</option>
          <option value="admin">Administrators</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <LoadingSpinner size="lg" text="Loading user accounts..." />
      ) : users.length === 0 ? (
        <p className="text-xs text-slate-400 py-12 text-center bg-white rounded-3xl border border-slate-200">
          No users match the criteria.
        </p>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Name / Email</th>
                  <th className="py-3.5 px-6">Department</th>
                  <th className="py-3.5 px-6">ID Number</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-bold text-navy-900 block">{u.name}</span>
                      <span className="text-slate-400 text-[11px] block mt-0.5">{u.email}</span>
                    </td>

                    <td className="py-4 px-6 text-slate-700">{u.department}</td>

                    <td className="py-4 px-6 font-mono text-slate-500">
                      {u.studentOrEmployeeId || 'N/A'}
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">
                      <Badge variant={u.role}>{u.role}</Badge>
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenRoleModal(u)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-brand-50"
                          title="Change User Role"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.isActive
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={u.isActive ? 'Suspend Account' : 'Reactivate Account'}
                        >
                          {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      <Modal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title="Change Account Privileges"
        description="Assign a new role to this user account."
      >
        {targetUser && (
          <form onSubmit={handleUpdateRole} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p>User: <strong>{targetUser.name}</strong></p>
              <p>Email: <strong>{targetUser.email}</strong></p>
              <p>Current Role: <strong className="capitalize">{targetUser.role}</strong></p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Select New Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-brand-500/20 outline-none"
              >
                <option value="student">Student Account</option>
                <option value="faculty">Faculty Member</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>

            <p className="text-[11px] text-slate-500">
              Role changes take effect on the user's next session token refresh and are recorded in the system audit logs.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRoleModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm"
              >
                {submitting ? 'Updating...' : 'Save Role Assignment'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsersPage;
