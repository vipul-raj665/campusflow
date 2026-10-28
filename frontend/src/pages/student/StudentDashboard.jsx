import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  Bell,
  ArrowRight,
  Building2,
  Calendar,
  AlertCircle,
  PlusCircle,
  Sparkles,
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [stats, setStats] = useState(null);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/analytics/user-stats');
        setStats(res.data.data.stats);
        setUpcomingBookings(res.data.data.upcomingBookings || []);
        setRecentBookings(res.data.data.recentBookings || []);
      } catch (err) {
        console.warn('Dashboard stats error:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading your dashboard..." />;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-850 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-navy-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={user?.role}>{user?.role} Portal</Badge>
            <span className="text-xs text-slate-400">• {user?.department}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Track your laboratory and room reservations, check approval states, and discover campus facilities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/resources"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/25 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Book New Facility</span>
          </Link>
          <Link
            to="/bookings"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-200 text-xs font-semibold border border-navy-700 transition-all"
          >
            <span>My Bookings</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-navy-900 mt-2">{stats?.approvedCount || 0}</p>
          <p className="text-xs text-slate-400 mt-1">Confirmed reservations</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-navy-900 mt-2">{stats?.pendingCount || 0}</p>
          <p className="text-xs text-slate-400 mt-1">Awaiting admin review</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Bookings</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-navy-900 mt-2">{stats?.totalBookings || 0}</p>
          <p className="text-xs text-slate-400 mt-1">Lifetime requests</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notifications</span>
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-navy-900 mt-2">{stats?.unreadNotificationsCount || 0}</p>
          <p className="text-xs text-slate-400 mt-1">Unread status alerts</p>
        </div>
      </div>

      {/* Two Column Layout: Upcoming Reservations + Recent Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Upcoming Active Reservations */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-navy-900">Upcoming Confirmed Bookings</h2>
              <p className="text-xs text-slate-400">Approved facilities scheduled for your use</p>
            </div>
            <Link to="/bookings?status=approved" className="text-xs font-semibold text-brand-600 hover:underline">
              View All
            </Link>
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">You have no upcoming confirmed reservations.</p>
              <Link
                to="/resources"
                className="inline-block px-4 py-2 rounded-xl bg-brand-50 text-brand-700 text-xs font-semibold hover:bg-brand-100 transition-colors"
              >
                Browse & Reserve Labs
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((b) => (
                <Link
                  key={b._id}
                  to={`/bookings/${b._id}`}
                  className="p-4 rounded-2xl border border-slate-100 hover:border-brand-200 bg-slate-50/50 hover:bg-brand-50/30 transition-all flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {b.resource?.code?.slice(0, 3) || 'FAC'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-navy-900 truncate group-hover:text-brand-600 transition-colors">
                        {b.resource?.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {b.date} • {b.startTime} - {b.endTime} ({b.resource?.building})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={b.status}>{b.status}</Badge>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: Recent Booking Activity */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-navy-900">Recent Activity</h2>
              <p className="text-xs text-slate-400">Latest reservation requests</p>
            </div>
            <Link to="/bookings" className="text-xs font-semibold text-brand-600 hover:underline">
              History
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No bookings initiated yet.</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div
                  key={b._id}
                  className="p-3.5 rounded-xl border border-slate-100 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-navy-900 truncate">{b.resource?.name}</p>
                    <p className="text-[11px] text-slate-400">{b.bookingNumber} • {b.date}</p>
                  </div>
                  <Badge variant={b.status}>{b.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
