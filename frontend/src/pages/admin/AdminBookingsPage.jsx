import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  Search,
  Filter,
  AlertTriangle,
} from 'lucide-react';

const AdminBookingsPage = () => {
  const { showToast } = useToast();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [bookingToReject, setBookingToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('Scheduling conflict or facility unavailable');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('status', statusFilter);
      params.append('page', page);
      params.append('limit', 15);

      const res = await api.get(`/bookings/admin/queue?${params.toString()}`);
      setBookings(res.data.data.bookings || []);
      setTotal(res.data.data.pagination.total || 0);
    } catch (err) {
      showToast('Failed to load booking queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [statusFilter, page]);

  const handleApprove = async (id, bookingNumber) => {
    try {
      setSubmittingAction(true);
      await api.patch(`/bookings/${id}/approve`);
      showToast(`Booking ${bookingNumber} approved successfully!`, 'success');
      fetchQueue();
    } catch (err) {
      showToast(err.response?.data?.message || 'Approval failed', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleOpenReject = (booking) => {
    setBookingToReject(booking);
    setRejectionReason('Scheduling conflict or facility reserved for academic examination');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!bookingToReject) return;
    try {
      setSubmittingAction(true);
      await api.patch(`/bookings/${bookingToReject._id}/reject`, {
        rejectionReason,
      });
      showToast(`Booking ${bookingToReject.bookingNumber} rejected and held slots released.`, 'success');
      setRejectModalOpen(false);
      setBookingToReject(null);
      fetchQueue();
    } catch (err) {
      showToast(err.response?.data?.message || 'Rejection failed', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Booking Approvals Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Evaluate pending campus reservation requests with race-safe availability revalidation
          </p>
        </div>

        {/* Status Switcher Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => {
              setStatusFilter('pending');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'pending'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-slate-500 hover:text-navy-900'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => {
              setStatusFilter('all');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'all'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-slate-500 hover:text-navy-900'
            }`}
          >
            All Bookings
          </button>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <LoadingSpinner size="lg" text="Syncing booking queue..." />
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-navy-900">Queue is Clear!</h3>
          <p className="text-xs text-slate-500">
            {statusFilter === 'pending'
              ? 'There are zero pending booking requests requiring administrator review.'
              : 'No bookings recorded.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Reference / Facility</th>
                  <th className="py-3.5 px-6">Requester</th>
                  <th className="py-3.5 px-6">Schedule Window</th>
                  <th className="py-3.5 px-6">Purpose / Attendees</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-navy-900 block">{b.bookingNumber}</span>
                      <span className="font-semibold text-slate-700 mt-0.5 block">{b.resource?.name}</span>
                      <span className="text-[11px] text-slate-400">
                        {b.resource?.building} ({b.resource?.roomNumber})
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <span className="font-semibold text-navy-900 block">{b.user?.name}</span>
                      <span className="text-slate-500 text-[11px] block">{b.user?.email}</span>
                      <span className="text-slate-400 text-[10px] block mt-0.5">{b.user?.department}</span>
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="font-semibold text-navy-900 block">{b.date}</span>
                      <span className="text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {b.startTime} - {b.endTime}
                      </span>
                    </td>

                    <td className="py-4 px-6 max-w-xs">
                      <p className="line-clamp-2 text-slate-600">{b.purpose}</p>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Expected: {b.expectedAttendees} / {b.resource?.capacity}
                      </span>
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">
                      <Badge variant={b.status}>{b.status}</Badge>
                    </td>

                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/bookings/${b._id}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {b.status === 'pending' && (
                          <>
                            <button
                              disabled={submittingAction}
                              onClick={() => handleApprove(b._id, b.bookingNumber)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-sm flex items-center gap-1"
                              title="Approve & Confirm Slots"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>

                            <button
                              disabled={submittingAction}
                              onClick={() => handleOpenReject(b)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] border border-rose-200 flex items-center gap-1"
                              title="Decline Request"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal with Reason Input */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Booking Request"
        description="Provide a clear, recorded justification for this decline."
      >
        {bookingToReject && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p>Booking Number: <strong>{bookingToReject.bookingNumber}</strong></p>
              <p>Requester: <strong>{bookingToReject.user?.name} ({bookingToReject.user?.email})</strong></p>
              <p>Facility: <strong>{bookingToReject.resource?.name}</strong></p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Rejection Reason (Sent to Requester)
              </label>
              <textarea
                rows="3"
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 outline-none"
              />
            </div>

            <p className="text-[11px] text-slate-500">
              Upon rejection, held discrete reservation slots are atomically released back to the general availability pool.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm"
              >
                {submittingAction ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminBookingsPage;
