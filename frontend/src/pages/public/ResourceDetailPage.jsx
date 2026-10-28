import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  Building2,
  Users,
  Clock,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Info,
  CalendarDays,
  Lock,
} from 'lucide-react';

const ResourceDetailPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [resource, setResource] = useState(null);
  const [loadingResource, setLoadingResource] = useState(true);

  // Availability Date & Slots State
  const getDefaultDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };

  const [selectedDate, setSelectedDate] = useState(getDefaultDate());
  const [availability, setAvailability] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Booking Form State
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expectedAttendees, setExpectedAttendees] = useState(1);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Booking Confirmation Modal
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // 1. Fetch Resource Details
  useEffect(() => {
    const fetchResource = async () => {
      try {
        setLoadingResource(true);
        const res = await api.get(`/resources/${id}`);
        setResource(res.data.data.resource);
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to load facility', 'error');
      } finally {
        setLoadingResource(false);
      }
    };
    fetchResource();
  }, [id, showToast]);

  // 2. Fetch Availability Slots for Date
  const fetchAvailability = useCallback(async () => {
    if (!id || !selectedDate) return;
    try {
      setLoadingSlots(true);
      const res = await api.get(`/resources/${id}/availability?date=${selectedDate}`);
      setAvailability(res.data.data);
    } catch (err) {
      console.warn('Failed to load slots:', err.message);
    } finally {
      setLoadingSlots(false);
    }
  }, [id, selectedDate]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Handle slot click to automatically set start/end times
  const handleSlotClick = (slot) => {
    if (!slot.available) return;
    if (!startTime || (startTime && endTime)) {
      setStartTime(slot.time);
      // Auto-set 60-min window by default
      const [h, m] = slot.time.split(':').map(Number);
      const endH = String(h + 1).padStart(2, '0');
      const endM = String(m).padStart(2, '0');
      setEndTime(`${endH}:${endM}`);
    } else if (startTime && !endTime) {
      if (slot.time > startTime) {
        setEndTime(slot.time);
      } else {
        setStartTime(slot.time);
      }
    }
    setBookingError('');
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingError('');

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!startTime || !endTime) {
      setBookingError('Please choose a valid start time and end time.');
      return;
    }

    if (endTime <= startTime) {
      setBookingError('End time must be after start time.');
      return;
    }

    setBookingSubmitting(true);

    try {
      const res = await api.post('/bookings', {
        resource: id,
        date: selectedDate,
        startTime,
        endTime,
        purpose,
        expectedAttendees: Number(expectedAttendees),
      });

      setConfirmedBooking(res.data.data.booking);
      setSuccessModalOpen(true);
      showToast('Booking request submitted successfully!', 'success');
      // Refresh availability visualizer
      fetchAvailability();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit booking request.';
      setBookingError(msg);
      showToast(msg, 'error');
    } finally {
      setBookingSubmitting(false);
    }
  };

  if (loadingResource) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <LoadingSpinner size="lg" text="Loading facility details..." />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-2xl border border-slate-200">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-navy-900">Resource not found</h2>
        <Link to="/resources" className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Return to Catalog
        </Link>
      </div>
    );
  }

  // Calculate advance booking date bounds
  const todayStr = new Date().toISOString().slice(0, 10);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + (resource.advanceBookingDaysLimit || 14));
  const maxDateStr = maxDate.toISOString().slice(0, 10);

  const isRoleAllowed = user && resource.allowedRoles?.includes(user.role);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link to="/" className="hover:text-navy-900">Home</Link>
        <span>/</span>
        <Link to="/resources" className="hover:text-navy-900">Catalog</Link>
        <span>/</span>
        <span className="text-navy-900 font-semibold">{resource.name}</span>
      </nav>

      {/* Hero Facility Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Photo Gallery Column */}
        <div className="lg:col-span-5 h-72 lg:h-auto min-h-[300px] relative bg-slate-100 overflow-hidden">
          <img
            src={
              resource.imageUrl ||
              'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80'
            }
            alt={resource.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge variant={resource.status}>{resource.status}</Badge>
            <span className="bg-navy-900/80 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-lg">
              {resource.code}
            </span>
          </div>
        </div>

        {/* Specifications Column */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                {resource.type.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              {resource.name}
            </h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {resource.description || 'Modern facility equipped for academic teaching, research experiments, and collaborative student seminars.'}
            </p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Location</span>
                <p className="text-xs font-bold text-navy-900 mt-0.5 truncate">{resource.building}</p>
                <p className="text-[10px] text-slate-500">{resource.roomNumber}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Capacity</span>
                <p className="text-xs font-bold text-navy-900 mt-0.5">{resource.capacity} Attendees</p>
                <p className="text-[10px] text-slate-500">Maximum limit</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Hours</span>
                <p className="text-xs font-bold text-navy-900 mt-0.5">
                  {resource.operatingHours?.openTime} - {resource.operatingHours?.closeTime}
                </p>
                <p className="text-[10px] text-slate-500">Daily schedule</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Duration</span>
                <p className="text-xs font-bold text-navy-900 mt-0.5">
                  {resource.minDurationMinutes} - {resource.maxDurationMinutes} m
                </p>
                <p className="text-[10px] text-slate-500">Per reservation</p>
              </div>
            </div>

            {/* Amenities Grid */}
            {resource.amenities?.length > 0 && (
              <div className="mt-6">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Installed Facilities & Amenities
                </h4>
                <div className="flex flex-wrap gap-2">
                  {resource.amenities.map((amenity, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-50/70 border border-brand-200/60 text-xs font-medium text-brand-800"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
                      <span>{amenity}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Rules Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
              <span>Allowed Roles: <strong className="capitalize">{resource.allowedRoles?.join(', ')}</strong></span>
            </div>
            <span>Advance Limit: <strong>{resource.advanceBookingDaysLimit} Days</strong></span>
          </div>
        </div>
      </div>

      {/* Main Reservation Engine Grid: Visualizer + Booking Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Slot Visualizer */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-brand-600" />
                <span>Real-Time Slot Availability</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click an open slot to automatically set your reservation window
              </p>
            </div>

            {/* Date Picker Input */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700">Date:</label>
              <input
                type="date"
                min={todayStr}
                max={maxDateStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Utilization Progress Bar */}
          {availability?.summary && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-slate-600">Day Schedule Utilization</span>
                <span className="font-bold text-navy-900">
                  {availability.summary.bookedSlotsCount} / {availability.summary.totalSlots} Slots Booked (
                  {availability.summary.utilizationPercentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-brand-600 h-full transition-all duration-500"
                  style={{ width: `${availability.summary.utilizationPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Slot Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-500" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-rose-500" />
              <span>Reserved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-amber-500" />
              <span>Held / Review</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-orange-500" />
              <span>Maintenance</span>
            </div>
          </div>

          {/* Slots Interactive Grid */}
          {loadingSlots ? (
            <div className="py-12">
              <LoadingSpinner size="md" text="Syncing slot schedules..." />
            </div>
          ) : !availability?.slots || availability.slots.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No operating slots on this date.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-2">
              {availability.slots.map((slot) => {
                const isSelected =
                  startTime && endTime && slot.time >= startTime && slot.time < endTime;

                let slotColor = 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 cursor-pointer';

                if (slot.status === 'confirmed') {
                  slotColor = 'bg-rose-50 text-rose-700 border-rose-200 opacity-80 cursor-not-allowed';
                } else if (slot.status === 'held') {
                  slotColor = 'bg-amber-50 text-amber-700 border-amber-200 opacity-90 cursor-not-allowed';
                } else if (slot.status === 'maintenance') {
                  slotColor = 'bg-orange-50 text-orange-700 border-orange-200 opacity-90 cursor-not-allowed';
                }

                if (isSelected && slot.available) {
                  slotColor = 'bg-brand-600 text-white border-brand-700 shadow-md scale-105 font-bold';
                }

                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => handleSlotClick(slot)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${slotColor}`}
                  >
                    <div>{slot.time}</div>
                    <div className="text-[10px] font-normal uppercase opacity-80 mt-0.5">
                      {isSelected ? 'Selected' : slot.status}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Booking Request Form */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-card space-y-6">
          <div>
            <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-600" />
              <span>Reserve This Facility</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Selected Date: <strong>{selectedDate}</strong>
            </p>
          </div>

          {!isAuthenticated ? (
            <div className="p-6 rounded-2xl bg-brand-50 border border-brand-200 text-center space-y-3">
              <Lock className="w-8 h-8 text-brand-600 mx-auto" />
              <h3 className="text-sm font-bold text-navy-900">Authentication Required</h3>
              <p className="text-xs text-slate-600">
                You must be logged in to reserve campus laboratories, auditoriums, and smart classrooms.
              </p>
              <Link
                to="/login"
                className="inline-block px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 shadow-sm transition-all"
              >
                Sign In to Reserve
              </Link>
            </div>
          ) : user && !isRoleAllowed ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
              <p className="font-bold">Role Restriction</p>
              <p>
                Your account role ({user.role}) is not authorized to reserve this resource. Allowed roles are: {resource.allowedRoles?.join(', ')}.
              </p>
            </div>
          ) : (
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              {bookingError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}

              {/* Time Window Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 outline-none"
                  />
                </div>
              </div>

              {/* Expected Attendees */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Expected Attendees (Max: {resource.capacity})
                </label>
                <input
                  type="number"
                  min="1"
                  max={resource.capacity}
                  required
                  value={expectedAttendees}
                  onChange={(e) => setExpectedAttendees(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 outline-none"
                />
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Purpose / Event Details
                </label>
                <textarea
                  rows="3"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Provide an academic or event summary (min 5 characters)..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={bookingSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {bookingSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Confirm & Hold Discrete Slots</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">Race-Safe Concurrency Guarantee:</p>
                <p>
                  Upon submission, your slots are atomically claimed via MongoDB unique compound indexes. If conflicting requests arrive simultaneously, only one will be allocated.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Booking Confirmation Success Modal */}
      <Modal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        title="Booking Request Confirmed! 🎉"
        description="Your reservation has been recorded and discrete slots are safely held."
      >
        {confirmedBooking && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800">Booking Reference</span>
                <span className="text-sm font-mono font-bold text-emerald-900">
                  {confirmedBooking.bookingNumber}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-emerald-700">
                <span>Facility:</span>
                <span className="font-semibold">{resource.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-emerald-700">
                <span>Schedule:</span>
                <span className="font-semibold">
                  {confirmedBooking.date} ({confirmedBooking.startTime} - {confirmedBooking.endTime})
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-emerald-700">
                <span>Status:</span>
                <Badge variant={confirmedBooking.status}>{confirmedBooking.status}</Badge>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Your request is now in the administrative review queue. You will receive an instantaneous in-app and WebSocket notification once evaluated.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSuccessModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <Link
                to={`/bookings/${confirmedBooking._id}`}
                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 shadow-sm"
              >
                Track Booking Status
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ResourceDetailPage;
