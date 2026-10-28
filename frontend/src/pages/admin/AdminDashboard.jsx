import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Building2,
  CalendarCheck,
  Clock,
  Users,
  Wrench,
  TrendingUp,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  PlusCircle,
} from 'lucide-react';

const COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#475569'];

const AdminDashboard = () => {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get('/analytics/dashboard');
        setData(res.data.data);
      } catch (err) {
        showToast('Failed to load system analytics', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [showToast]);

  if (loading) {
    return <LoadingSpinner size="lg" text="Aggregating campus analytics..." />;
  }

  const { summary, bookingsByType, bookingsByDepartment, topResources, dailyTrends } = data || {};

  return (
    <div className="space-y-8">
      {/* Executive Header Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-850 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-navy-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="admin">System Operations</Badge>
            <span className="text-xs text-slate-400">• Institutional Infrastructure</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Campus Operations & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Real-time telemetry, pending reservation approvals, facility utilization, and system-wide audit records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/bookings"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/25 transition-all"
          >
            <Clock className="w-4 h-4" />
            <span>Review Pending Queue ({summary?.pendingCount || 0})</span>
          </Link>
          <Link
            to="/admin/reports"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-200 text-xs font-semibold border border-navy-700 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Active Facilities */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Facilities</span>
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-navy-900 mt-2">{summary?.activeResources || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">{summary?.totalResources || 0} Total in Inventory</p>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-navy-900 mt-2">{summary?.pendingCount || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Requires review</p>
        </div>

        {/* Approved Bookings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-navy-900 mt-2">{summary?.approvedCount || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">{summary?.totalBookings || 0} Total Submissions</p>
        </div>

        {/* Total Users */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Users</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-navy-900 mt-2">{summary?.totalUsers || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Registered accounts</p>
        </div>

        {/* Active Maintenance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Maintenance</span>
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-navy-900 mt-2">{summary?.activeMaintenanceCount || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Active / scheduled blocks</p>
        </div>
      </div>

      {/* Charts Section 1: Daily Booking Trends */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-navy-900">Reservation Activity Trends (Last 14 Days)</h2>
            <p className="text-xs text-slate-400">Total submitted requests versus approved confirmed reservations</p>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          {dailyTrends && dailyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1220',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="total" name="Total Requests" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="approved" name="Approved" stroke="#059669" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No daily trend data available yet.
            </div>
          )}
        </div>
      </div>

      {/* Charts Section 2: Resource Types & Department Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Resource Types Bar Chart */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <div>
            <h2 className="text-base font-bold text-navy-900">Bookings by Resource Type</h2>
            <p className="text-xs text-slate-400">Demand distribution across facility categories</p>
          </div>

          <div className="h-64 w-full pt-4">
            {bookingsByType && bookingsByType.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingsByType} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="type" stroke="#94A3B8" fontSize={10} tickFormatter={(val) => val.replace('_', ' ')} />
                  <YAxis stroke="#94A3B8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B1220',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" name="Bookings" fill="#2563EB" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No categorical bookings yet.
              </div>
            )}
          </div>
        </div>

        {/* Right: Departmental Volume */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <div>
            <h2 className="text-base font-bold text-navy-900">Reservations by Academic Department</h2>
            <p className="text-xs text-slate-400">Volume breakdown by student & faculty department</p>
          </div>

          <div className="h-64 w-full pt-4">
            {bookingsByDepartment && bookingsByDepartment.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingsByDepartment} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis type="number" stroke="#94A3B8" fontSize={11} />
                  <YAxis dataKey="department" type="category" stroke="#94A3B8" fontSize={10} tickFormatter={(v) => v.slice(0, 15) + '...'} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B1220',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" name="Total Bookings" fill="#7C3AED" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No departmental data yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Most Booked Facilities */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-navy-900">Most Utilized Campus Resources</h2>
            <p className="text-xs text-slate-400">Facilities with highest confirmed booking volumes</p>
          </div>
          <Link to="/admin/resources" className="text-xs font-semibold text-brand-600 hover:underline">
            Manage Catalog
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topResources && topResources.length > 0 ? (
            topResources.map((item, idx) => (
              <div key={item._id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-bold text-brand-600 uppercase font-mono bg-brand-50 px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-500">{item.code}</span>
                  </div>
                  <h4 className="text-sm font-bold text-navy-900 truncate">{item.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.building}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-lg font-extrabold text-navy-900 block leading-tight">{item.totalBookings}</span>
                  <span className="text-[10px] text-slate-400">Reservations</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 col-span-3 py-4 text-center">No bookings recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
