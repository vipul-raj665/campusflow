import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  User,
  Activity,
  FileCode,
} from 'lucide-react';

const AdminAuditLogsPage = () => {
  const { showToast } = useToast();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [targetModelFilter, setTargetModelFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      if (targetModelFilter) params.append('targetModel', targetModelFilter);
      params.append('limit', 50);

      const res = await api.get(`/audit-logs?${params.toString()}`);
      setLogs(res.data.data.auditLogs || []);
    } catch (err) {
      showToast('Failed to load audit trail', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, targetModelFilter]);

  const getActionBadgeColor = (action) => {
    if (action.includes('APPROVE') || action.includes('CREATE')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (action.includes('REJECT') || action.includes('DELETE') || action.includes('CANCEL')) return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Security & Operational Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Immutable, tamper-evident record of administrative decisions, role promotions, and facility adjustments
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card flex flex-wrap gap-3">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
        >
          <option value="">All Actions</option>
          <option value="BOOKING_CREATE">BOOKING_CREATE</option>
          <option value="BOOKING_APPROVE">BOOKING_APPROVE</option>
          <option value="BOOKING_REJECT">BOOKING_REJECT</option>
          <option value="BOOKING_CANCEL">BOOKING_CANCEL</option>
          <option value="RESOURCE_CREATE">RESOURCE_CREATE</option>
          <option value="RESOURCE_UPDATE">RESOURCE_UPDATE</option>
          <option value="MAINTENANCE_CREATE">MAINTENANCE_CREATE</option>
          <option value="MAINTENANCE_CANCEL">MAINTENANCE_CANCEL</option>
          <option value="USER_ROLE_CHANGE">USER_ROLE_CHANGE</option>
          <option value="USER_STATUS_CHANGE">USER_STATUS_CHANGE</option>
        </select>

        <select
          value={targetModelFilter}
          onChange={(e) => setTargetModelFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
        >
          <option value="">All Targets</option>
          <option value="Booking">Booking</option>
          <option value="Resource">Resource</option>
          <option value="Maintenance">Maintenance</option>
          <option value="User">User</option>
        </select>
      </div>

      {/* Logs Table */}
      {loading ? (
        <LoadingSpinner size="lg" text="Loading audit records..." />
      ) : logs.length === 0 ? (
        <p className="text-xs text-slate-400 py-12 text-center bg-white rounded-3xl border border-slate-200">
          No audit records found.
        </p>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">Actor</th>
                  <th className="py-3.5 px-6">Action</th>
                  <th className="py-3.5 px-6">Target Model / ID</th>
                  <th className="py-3.5 px-6">Non-Sensitive Details</th>
                  <th className="py-3.5 px-6 text-right">Client IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 whitespace-nowrap text-slate-500 text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-6 whitespace-nowrap font-sans">
                      <span className="font-semibold text-navy-900 block">{log.actor?.name || 'System'}</span>
                      <span className="text-slate-400 text-[10px] block">{log.actor?.email}</span>
                    </td>

                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-6 whitespace-nowrap font-sans text-slate-700">
                      <span className="font-bold">{log.targetModel}</span>
                      <span className="font-mono text-[10px] text-slate-400 block">{log.targetId}</span>
                    </td>

                    <td className="py-3.5 px-6 max-w-xs font-sans text-[11px] text-slate-600 truncate">
                      {JSON.stringify(log.details)}
                    </td>

                    <td className="py-3.5 px-6 text-right whitespace-nowrap text-slate-400 text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogsPage;
