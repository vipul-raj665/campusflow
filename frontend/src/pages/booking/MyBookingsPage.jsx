import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  CalendarCheck,
  Building2,
  Clock,
  Search,
  Filter,
  Eye,
  XCircle,
  AlertCircle,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

const statusTabs = [
  { label: 'All Bookings', value: 'all' },
  { label: 'Pending Review', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Rejected', value: 'rejected' },
];

const MyBookingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const [currentStatus, setCurrentStatus] = useState(searchParams.get('status') || 'all');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Cancel Booking Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('Change of plans');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (currentStatus && currentStatus !== 'all') params.append('status', currentStatus);
        params.append('page', page);
        params.append('limit', 10);

        const res = await api.get(`/bookings/my?${params.toString()}`);
        setBookings(res.data.data.bookings || []);
        setTotal(res.data.data.pagination.total || 0);
        setPages(res.data.data.pagination.pages || 1);
      } catch (err) {
        showToast('Failed to load your bookings', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [currentStatus, page, showToast]);

  const handleTabChange = (val) => {
    setCurrentStatus(val);
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (val !== 'all') newParams.set('status', val);
    else newParams.delete('status');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    setCancelling(true);

    try {
      await api.patch(`/bookings/${bookingToCancel._id}/cancel`, {
        cancellationReason: cancelReason,
      });

      showToast('Booking cancelled and reserved slots released.', 'success');
      setCancelModalOpen(false);
      setBookingToCancel(null);

      // Refresh list
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingToCancel._id ? { ...b, status: 'cancelled' } : b))
      );
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel booking', 'error');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            My Reservations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View booking status, access reference numbers, or cancel scheduled slots
          </p>
        </div>

        <Link
          to="/resources"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <span>Book Another Resource</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs border-b border-slate-200">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`px-4 py-2.5 font-semibold whitespace-nowrap border-b-2 -mb-px transition-all ${
              currentStatus === tab.value
                ? 'border-brand-600 text-brand-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-navy-900 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings Table / Card List */}
      {loading ? (
        <LoadingSpinner size="lg" text="Retrieving booking records..." />
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-navy-900">No reservations found</h3>
          <p className="text-xs text-slate-500">
            You don't have any reservations matching this status filter.
          </p>
          <Link
            to="/resources"
            className="inline-block px-4 py-2 rounded-xl bg-brand-50 text-brand-700 text-xs font-semibold hover:bg-brand-100 transition-colors"
          >
            Explore Resources
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Reference / Resource</th>
                  <th className="py-3.5 px-6">Date & Schedule</th>
                  <th className="py-3.5 px-6">Purpose</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => {
                  const canCancel = b.status === 'pending' || b.status === 'approved';

                  return (
                    <tr key={b._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-navy-900 block">
                          {b.bookingNumber}
                        </span>
                        <span className="font-semibold text-slate-700 mt-0.5 block">
                          {b.resource?.name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {b.resource?.building} • {b.resource?.roomNumber}
                        </span>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="font-semibold text-navy-900 block">{b.date}</span>
                        <span className="text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {b.startTime} - {b.endTime}
                        </span>
                      </td>

                      <td className="py-4 px-6 max-w-xs">
                        <p className="line-clamp-2 text-slate-600">{b.purpose}</p>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Attendees: {b.expectedAttendees}
                        </span>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <Badge variant={b.status}>{b.status}</Badge>
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/bookings/${b._id}`}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                            title="View Booking Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {canCancel && (
                            <button
                              onClick={() => {
                                setBookingToCancel(b);
                                setCancelModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Cancel Reservation"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Showing {bookings.length} of {total} records</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-medium"
                >
                  Previous
                </button>
                <span>Page {page} of {pages}</span>
                <button
                  disabled={page >= pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Reservation"
        description="Are you sure you want to release this facility?"
      >
        {bookingToCancel && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p>Booking Number: <strong>{bookingToCancel.bookingNumber}</strong></p>
              <p>Facility: <strong>{bookingToCancel.resource?.name}</strong></p>
              <p>Schedule: <strong>{bookingToCancel.date} ({bookingToCancel.startTime} - {bookingToCancel.endTime})</strong></p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Reason for cancellation
              </label>
              <textarea
                rows="2"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 outline-none"
              />
            </div>

            <p className="text-[11px] text-slate-500">
              Upon cancellation, all reserved discrete time slots will be immediately released back to the general availability pool.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyBookingsPage;
