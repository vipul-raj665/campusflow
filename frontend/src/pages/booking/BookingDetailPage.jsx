import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  CalendarCheck,
  Building2,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Printer,
  ChevronLeft,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

const BookingDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cancellation modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of schedule');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/bookings/${id}`);
        setBooking(res.data.data.booking);
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to load booking details', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id, showToast]);

  const handleCancelBooking = async () => {
    try {
      setCancelling(true);
      const res = await api.patch(`/bookings/${id}/cancel`, {
        cancellationReason: cancelReason,
      });
      setBooking(res.data.data.booking);
      setCancelModalOpen(false);
      showToast('Booking cancelled and reserved slots released.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading booking record..." />;
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-3xl border border-slate-200">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-navy-900">Booking not found</h2>
        <Link to="/bookings" className="mt-4 inline-block text-xs font-semibold text-brand-600 hover:underline">
          Return to My Bookings
        </Link>
      </div>
    );
  }

  const canCancel =
    (user?.role === 'admin' || String(booking.user?._id) === String(user?._id)) &&
    (booking.status === 'pending' || booking.status === 'approved');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>

          {canCancel && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel Booking</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Ticket Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
        {/* Ticket Header Banner */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-850 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs text-brand-300 font-semibold uppercase tracking-wider">
                Booking Reference
              </span>
              <Badge variant={booking.status}>{booking.status}</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-white">
              {booking.bookingNumber}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Created on {new Date(booking.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-navy-800/80 border border-navy-700/80 text-right">
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">Schedule Window</span>
            <span className="text-sm font-bold text-white block mt-0.5">{booking.date}</span>
            <span className="text-xs text-brand-300 font-mono block mt-0.5">
              {booking.startTime} - {booking.endTime}
            </span>
          </div>
        </div>

        {/* Status Lifecycle Timeline */}
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Reservation Lifecycle Tracker
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-navy-900">Request Submitted</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Discrete slots atomically held</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-start gap-3">
              {booking.status === 'approved' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : booking.status === 'rejected' ? (
                <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              ) : booking.status === 'cancelled' ? (
                <XCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              ) : (
                <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
              )}
              <div>
                <p className="text-xs font-bold text-navy-900 capitalize">
                  {booking.status === 'approved'
                    ? 'Approved by Admin'
                    : booking.status === 'rejected'
                    ? 'Declined by Admin'
                    : booking.status === 'cancelled'
                    ? 'Reservation Cancelled'
                    : 'Pending Administrator Review'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {booking.reviewedAt
                    ? `Decided on ${new Date(booking.reviewedAt).toLocaleDateString()}`
                    : 'Awaiting queue evaluation'}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-start gap-3">
              <CalendarCheck
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  booking.status === 'approved' ? 'text-brand-600' : 'text-slate-300'
                }`}
              />
              <div>
                <p className="text-xs font-bold text-navy-900">Scheduled Access</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {booking.status === 'approved' ? 'Access guaranteed for session' : 'Pending final confirmation'}
                </p>
              </div>
            </div>
          </div>

          {/* Rejection or Cancellation Reason Notice */}
          {booking.rejectionReason && (
            <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Rejection Reason:</span>
              </p>
              <p className="pl-5">{booking.rejectionReason}</p>
            </div>
          )}

          {booking.cancellationReason && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 text-xs space-y-1">
              <p className="font-bold">Cancellation Notes:</p>
              <p>{booking.cancellationReason}</p>
            </div>
          )}
        </div>

        {/* Detailed Breakdown */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Facility Specifications */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Target Facility Specifications
            </h3>
            <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
              <div>
                <span className="text-[11px] font-semibold text-brand-600 uppercase">
                  {booking.resource?.type?.replace('_', ' ')}
                </span>
                <h4 className="text-base font-bold text-navy-900">{booking.resource?.name}</h4>
                <p className="text-xs text-slate-500 font-mono">{booking.resource?.code}</p>
              </div>

              <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                <p>Location: <strong>{booking.resource?.building} ({booking.resource?.roomNumber})</strong></p>
                <p>Capacity Limit: <strong>{booking.resource?.capacity} Persons</strong></p>
                <p>Operating Hours: <strong>{booking.resource?.operatingHours?.openTime} - {booking.resource?.operatingHours?.closeTime}</strong></p>
              </div>

              <Link
                to={`/resources/${booking.resource?._id}`}
                className="inline-block text-xs font-semibold text-brand-600 hover:underline pt-1"
              >
                View Full Facility Profile &rarr;
              </Link>
            </div>
          </div>

          {/* Requester & Purpose */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Requester Information
            </h3>
            <div className="p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-navy-900 text-white font-bold flex items-center justify-center">
                  {booking.user?.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-navy-900 text-sm">{booking.user?.name}</p>
                  <p className="text-slate-500">{booking.user?.email}</p>
                  <p className="text-[11px] text-slate-400">{booking.user?.department}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div>
                  <span className="font-semibold text-slate-700 block">Stated Academic Purpose:</span>
                  <p className="text-slate-600 mt-0.5 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {booking.purpose}
                  </p>
                </div>
                <div className="flex justify-between text-slate-600 pt-1">
                  <span>Expected Attendance:</span>
                  <strong className="text-navy-900">{booking.expectedAttendees} Attendees</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Reservation"
        description="Are you sure you want to cancel this booking?"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Cancelling will immediately release held discrete reservation slots for other campus users.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Cancellation Reason
            </label>
            <textarea
              rows="2"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setCancelModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
            >
              Keep
            </button>
            <button
              disabled={cancelling}
              onClick={handleCancelBooking}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
            >
              {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BookingDetailPage;
