import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Layers, Calendar, ShieldCheck, ChevronRight, Menu, X, ArrowRight, User } from 'lucide-react';

const PublicLayout = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'faculty') return '/faculty/dashboard';
    return '/student/dashboard';
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-light text-slate-800">
      {/* Top Demo Helper Banner */}
      <div className="bg-navy-900 text-slate-300 px-4 py-1.5 text-xs font-medium border-b border-navy-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>CampusFlow v1.0 — Smart Campus Resource Booking & Management System</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-slate-400 text-xs">
            <span>Demo Admin: <code className="text-brand-300">admin@campusflow.edu</code></span>
            <span>Faculty: <code className="text-brand-300">faculty.smith@campusflow.edu</code></span>
            <span>Student: <code className="text-brand-300">student.jane@campusflow.edu</code></span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-navy-900 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-navy-900">Campus<span className="text-brand-600">Flow</span></span>
              <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Resource Cloud</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/' ? 'text-brand-600 bg-brand-50' : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/60'
              }`}
            >
              Home
            </Link>
            <Link
              to="/resources"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/resources' ? 'text-brand-600 bg-brand-50' : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/60'
              }`}
            >
              Browse Catalog
            </Link>
          </nav>

          {/* Desktop Auth CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to={getDashboardLink()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 shadow-sm shadow-brand-500/20 transition-all"
              >
                <span>Dashboard ({user.name.split(' ')[0]})</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-navy-900 hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 shadow-sm shadow-brand-500/20 transition-all"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              Home
            </Link>
            <Link
              to="/resources"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              Browse Catalog
            </Link>
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
              {isAuthenticated ? (
                <Link
                  to={getDashboardLink()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 px-4 rounded-xl bg-brand-600 text-white text-sm font-semibold"
                >
                  Open Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 px-4 rounded-xl bg-brand-600 text-white text-sm font-semibold"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-navy-950 text-slate-400 border-t border-navy-900 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold">
                  CF
                </div>
                <span className="text-lg font-bold text-white tracking-tight">CampusFlow</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Centralized campus resource scheduling, laboratory reservation, and asset utilization management platform.
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-full w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>All Engine Services Active</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Resource Types</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/resources?type=computer_lab" className="hover:text-white transition-colors">Computer & AI Labs</Link></li>
                <li><Link to="/resources?type=science_lab" className="hover:text-white transition-colors">Science & Optics Labs</Link></li>
                <li><Link to="/resources?type=seminar_hall" className="hover:text-white transition-colors">Auditoriums & Halls</Link></li>
                <li><Link to="/resources?type=classroom" className="hover:text-white transition-colors">Smart Classrooms</Link></li>
                <li><Link to="/resources?type=equipment" className="hover:text-white transition-colors">Cinema Projectors & Gear</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">System Roles</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/login" className="hover:text-white transition-colors">Student Self-Service Portal</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Faculty Department Hub</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Administrative Approval Console</Link></li>
                <li><a href="http://localhost:5000/api/docs" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Swagger API Documentation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Security & Compliance</h4>
              <p className="text-sm text-slate-400 leading-relaxed mb-3">
                Protected by compound unique indexes for race-free scheduling, short-lived JWTs, and rotating HttpOnly session credentials.
              </p>
              <div className="text-xs text-slate-500">
                Built with React, Express, MongoDB, Tailwind CSS & Socket.IO.
              </div>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-navy-900 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>&copy; {new Date().getFullYear()} CampusFlow System Architecture. All rights reserved.</p>
            <div className="flex gap-4">
              <span>Race-Safe Scheduling</span>
              <span>•</span>
              <span>Socket.IO Live Events</span>
              <span>•</span>
              <span>Audit Logging Active</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
