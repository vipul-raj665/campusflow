import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import {
  Building2,
  CalendarCheck,
  ShieldCheck,
  Zap,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  Clock,
  Layers,
  ChevronRight,
} from 'lucide-react';

const LandingPage = () => {
  const { login, isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [featuredResources, setFeaturedResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [demoLoggingIn, setDemoLoggingIn] = useState(false);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const res = await api.get('/resources?limit=4');
        setFeaturedResources(res.data.data.resources || []);
      } catch (err) {
        console.warn('Failed to load featured resources:', err.message);
      } finally {
        setLoadingResources(false);
      }
    };
    fetchResources();
  }, []);

  const handleQuickDemoLogin = async (email, password, role) => {
    try {
      setDemoLoggingIn(true);
      await login(email, password);
      showToast(`Logged in successfully as Demo ${role}!`, 'success');
      const targetDashboard =
        role === 'Admin'
          ? '/admin/dashboard'
          : role === 'Faculty'
          ? '/faculty/dashboard'
          : '/student/dashboard';
      navigate(targetDashboard);
    } catch (err) {
      showToast(err.response?.data?.message || 'Login failed', 'error');
    } finally {
      setDemoLoggingIn(false);
    }
  };

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 bg-gradient-to-b from-brand-50/50 via-white to-surface-light border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100/70 text-brand-700 text-xs font-semibold mb-6 shadow-sm border border-brand-200/60">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>Next-Generation Academic Resource Infrastructure</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-navy-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Smart Campus Resource Booking &{' '}
            <span className="bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">
              Conflict-Free Management
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Eliminate double bookings, manual logs, and scheduling friction. Centralized reservations for computer laboratories, science research facilities, auditoriums, and smart classrooms.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/resources"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-brand-600 text-white font-semibold text-base hover:bg-brand-700 shadow-lg shadow-brand-500/25 transition-all hover:scale-[1.02]"
            >
              <span>Explore Resource Catalog</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            {isAuthenticated ? (
              <Link
                to={user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard'}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-navy-900 font-semibold text-base hover:bg-slate-50 border border-slate-200 shadow-sm transition-all"
              >
                <span>Go to My Dashboard</span>
                <ChevronRight className="w-5 h-5" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-navy-900 font-semibold text-base hover:bg-slate-50 border border-slate-200 shadow-sm transition-all"
              >
                <span>Sign In to Account</span>
              </Link>
            )}
          </div>

          {/* Live System Stats */}
          <div className="mt-14 pt-8 border-t border-slate-200/80 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-3xl font-extrabold text-navy-900">100%</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Race-Safe Concurrency</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-brand-600">30 Min</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Normalized Discrete Slots</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-navy-900">&lt;50 ms</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Real-Time Socket Alerts</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-emerald-600">3-Tier</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Role-Based Security</p>
            </div>
          </div>
        </div>
      </section>

      {/* Instant Demo Quick-Access Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-850 rounded-3xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden border border-navy-800">
          <div className="relative z-10 max-w-3xl mb-8">
            <span className="text-xs font-bold text-brand-400 uppercase tracking-widest">Instant Demonstration Mode</span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-1 text-white">
              Test Any Role with One Click
            </h2>
            <p className="text-sm text-slate-300 mt-2">
              Select a pre-seeded account below to automatically log in and explore full platform functionality with real data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
            {/* Admin Demo Card */}
            <div className="bg-navy-800/80 border border-navy-700/80 rounded-2xl p-5 hover:border-brand-500/50 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="admin">Administrator</Badge>
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-base font-semibold text-white">Campus IT Operations</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Full control: Analytics dashboard, pending approvals queue, resource inventory, maintenance scheduler, audit trail, and CSV exports.
                </p>
                <div className="mt-3 p-2 rounded-lg bg-navy-900/80 text-[11px] font-mono text-slate-300">
                  admin@campusflow.edu
                </div>
              </div>
              <button
                disabled={demoLoggingIn}
                onClick={() => handleQuickDemoLogin('admin@campusflow.edu', 'Admin@CampusFlow2026', 'Admin')}
                className="mt-5 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Launch Admin Console</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Faculty Demo Card */}
            <div className="bg-navy-800/80 border border-navy-700/80 rounded-2xl p-5 hover:border-brand-500/50 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="faculty">Faculty Member</Badge>
                  <Building2 className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-base font-semibold text-white">Prof. Rajesh Rajan</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Department faculty access: Book priority research labs, conference suites, extended multi-hour exams, and track departmental schedules.
                </p>
                <div className="mt-3 p-2 rounded-lg bg-navy-900/80 text-[11px] font-mono text-slate-300">
                  faculty.rajan@campusflow.edu
                </div>
              </div>
              <button
                disabled={demoLoggingIn}
                onClick={() => handleQuickDemoLogin('faculty.rajan@campusflow.edu', 'Faculty@CampusFlow2026', 'Faculty')}
                className="mt-5 w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Launch Faculty Hub</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Student Demo Card */}
            <div className="bg-navy-800/80 border border-navy-700/80 rounded-2xl p-5 hover:border-brand-500/50 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="student">Student Account</Badge>
                  <Users className="w-5 h-5 text-sky-400" />
                </div>
                <h3 className="text-base font-semibold text-white">Manan Sharma</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Student self-service: Search open facilities, request computer lab slots, reserve seminar auditoriums for club events, and get live alerts.
                </p>
                <div className="mt-3 p-2 rounded-lg bg-navy-900/80 text-[11px] font-mono text-slate-300">
                  student.manan@campusflow.edu
                </div>
              </div>
              <button
                disabled={demoLoggingIn}
                onClick={() => handleQuickDemoLogin('student.manan@campusflow.edu', 'Student@CampusFlow2026', 'Student')}
                className="mt-5 w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Launch Student Portal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Campus Resources Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Campus Catalog</span>
            <h2 className="text-3xl font-bold text-navy-900 mt-1">
              Featured Laboratories & Facilities
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              High-specification computer clusters, research auditoriums, and smart classrooms available for booking.
            </p>
          </div>
          <Link
            to="/resources"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            <span>View All Resources</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredResources.map((resource) => (
            <Link
              key={resource._id}
              to={`/resources/${resource._id}`}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col group"
            >
              <div className="h-44 w-full bg-slate-100 relative overflow-hidden">
                <img
                  src={resource.imageUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80'}
                  alt={resource.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <Badge variant={resource.status}>{resource.status}</Badge>
                </div>
                <div className="absolute top-3 right-3 bg-navy-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md">
                  {resource.code}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">{resource.type.replace('_', ' ')}</p>
                  <h3 className="text-base font-bold text-navy-900 mt-1 group-hover:text-brand-600 transition-colors line-clamp-1">
                    {resource.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {resource.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span className="font-medium">{resource.building}</span>
                  <span className="font-bold text-navy-900">Cap: {resource.capacity}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Enterprise Reliability</span>
          <h2 className="text-3xl font-bold text-navy-900 mt-1">
            Engineered for Campus-Scale Operations
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            CampusFlow replaces unreliable paper registers and informal email chains with mathematical booking guarantees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-card">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-navy-900">Discrete Slot Concurrency</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Requested time spans are sliced into normalized 30-minute intervals backed by compound unique MongoDB indexes, rendering concurrent double-booking mathematically impossible.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-card">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-navy-900">Hardened Multi-Role RBAC</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Every endpoint is guarded server-side by role authorization middleware. Students, faculty, and administrative staff operate within strictly enforced boundary permissions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-card">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-navy-900">Real-Time WebSocket Sync</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Socket.IO authenticated private rooms dispatch instantaneous status notifications upon approval, rejection, or maintenance rescheduling with zero polling overhead.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
