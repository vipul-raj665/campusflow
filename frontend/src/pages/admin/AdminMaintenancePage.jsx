import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Wrench,
  PlusCircle,
  AlertTriangle,
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
  XCircle,
  ShieldAlert,
} from 'lucide-react';

const AdminMaintenancePage = () => {
  const { showToast } = useToast();

  const [maintenanceBlocks, setMaintenanceBlocks] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    resource: '',
    title: '',
    reason: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    startTime: '08:00',
    endTime: '18:00',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [maintRes, resourceRes] = await Promise.all([
        api.get('/maintenance?limit=50'),
        api.get('/resources?limit=100'),
      ]);
      setMaintenanceBlocks(maintRes.data.data.maintenanceBlocks || []);
      const allRes = resourceRes.data.data.resources || [];
      setResources(allRes);
      if (allRes.length > 0 && !formData.resource) {
        setFormData((prev) => ({ ...prev, resource: allRes[0]._id }));
      }
    } catch (err) {
      showToast('Failed to load maintenance records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScheduleMaintenance = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await api.post('/maintenance', formData);
      const affected = res.data.data.affectedBookingsCount;
      showToast(
        `Maintenance scheduled! ${affected} conflicting booking(s) were notified and released.`,
        'success'
      );
      setModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to schedule maintenance', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelMaintenance = async (id, title) => {
    if (!window.confirm(`Cancel maintenance period "${title}" and unlock resource slots?`)) return;

    try {
      await api.patch(`/maintenance/${id}/cancel`);
      showToast('Maintenance cancelled and resource slots unlocked.', 'success');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel maintenance', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Resource Maintenance Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Mark campus laboratories & equipment under maintenance with automated conflict detection & slot blackouts
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Schedule Maintenance Period</span>
        </button>
      </div>

      {/* Policy Notice Box */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-800 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Automated Conflict Resolution Policy:</p>
          <p className="mt-0.5 leading-relaxed text-amber-900">
            When maintenance is scheduled, the engine automatically checks for overlapping approved or pending bookings. Affected students and faculty are immediately notified with your recorded reason, and their reservations are cancelled with documented audit entries.
          </p>
        </div>
      </div>

      {/* Maintenance Blocks Table */}
      {loading ? (
        <LoadingSpinner size="lg" text="Loading maintenance schedule..." />
      ) : maintenanceBlocks.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-navy-900">No Active Maintenance Periods</h3>
          <p className="text-xs text-slate-500">
            All campus facilities and equipment are currently operational and available for normal reservations.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Facility / Code</th>
                  <th className="py-3.5 px-6">Maintenance Details</th>
                  <th className="py-3.5 px-6">Date & Window</th>
                  <th className="py-3.5 px-6">Affected Bookings</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {maintenanceBlocks.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-semibold text-navy-900 block">{m.resource?.name}</span>
                      <span className="font-mono text-[11px] text-slate-400 block mt-0.5">
                        {m.resource?.code} ({m.resource?.building})
                      </span>
                    </td>

                    <td className="py-4 px-6 max-w-xs">
                      <p className="font-bold text-navy-900">{m.title}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-2">{m.reason}</p>
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="font-semibold text-navy-900 block">
                        {m.startDate} {m.startDate !== m.endDate ? `to ${m.endDate}` : ''}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px] block mt-0.5">
                        {m.startTime} - {m.endTime}
                      </span>
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap font-medium text-slate-700">
                      {m.affectedBookingsCount > 0 ? (
                        <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          {m.affectedBookingsCount} Cancelled & Notified
                        </span>
                      ) : (
                        <span className="text-slate-400">Zero conflicts</span>
                      )}
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">
                      <Badge variant={m.status}>{m.status}</Badge>
                    </td>

                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      {m.status !== 'cancelled' && m.status !== 'completed' && (
                        <button
                          onClick={() => handleCancelMaintenance(m._id, m.title)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                        >
                          Cancel Block
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Maintenance Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Schedule Resource Maintenance"
        description="Mark a campus facility unavailable and trigger automatic conflict cancellation."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleScheduleMaintenance} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Select Campus Facility
            </label>
            <select
              required
              value={formData.resource}
              onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-orange-500/20 outline-none"
            >
              {resources.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name} ({r.code} - {r.building})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Maintenance Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Electrical Transformer Upgrades & Wiring"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500/20 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Detailed Reason / Scope of Work
            </label>
            <textarea
              rows="3"
              required
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Explain the scheduled maintenance procedure (sent to any affected booking holders)..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500/20 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                End Date
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Start Time
              </label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                End Time
              </label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-[11px] text-orange-800">
            ⚠️ Any existing reservations during this window will be cancelled with an alert delivered to the user.
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm"
            >
              {submitting ? 'Applying Maintenance...' : 'Schedule & Block Slots'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminMaintenancePage;
