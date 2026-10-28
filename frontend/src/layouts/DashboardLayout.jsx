import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Badge from '../components/common/Badge';
import {
  LayoutDashboard,
  CalendarCheck,
  Building2,
  Bell,
  Wrench,
  Users,
  ShieldAlert,
  FileSpreadsheet,
  LogOut,
  Menu,
  X,
  PlusCircle,
  CheckCircle,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { unreadCount, notifications, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (user?.role === 'admin') return '/admin/dashboard';
    if (user?.role === 'faculty') return '/faculty/dashboard';
    return '/student/dashboard';
  };

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20 font-semibold'
        : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
    }`;

  return (
    <div className="min-h-screen flex bg-surface-light">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-0 -translate-x-full'
        }`}
      >
        <div>
          {/* Logo Header */}
          <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-navy-900 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-navy-900 tracking-tight">
                Campus<span className="text-brand-600">Flow</span>
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Role Banner */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Access Scope</p>
              <p className="text-sm font-medium text-navy-900 capitalize">{user?.role} Portal</p>
            </div>
            <Badge variant={user?.role}>{user?.role}</Badge>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
            <NavLink to={getDashboardPath()} className={navItemClass}>
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Overview</span>
            </NavLink>

            <NavLink to="/resources" className={navItemClass}>
              <Building2 className="w-4 h-4 shrink-0" />
              <span>Campus Catalog</span>
            </NavLink>

            <NavLink to="/bookings" className={navItemClass}>
              <CalendarCheck className="w-4 h-4 shrink-0" />
              <span>My Bookings</span>
            </NavLink>

            <NavLink to="/notifications" className={navItemClass}>
              <div className="relative shrink-0">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500" />
                )}
              </div>
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="ml-auto bg-brand-100 text-brand-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </NavLink>

            {/* Admin Management Section */}
            {user?.role === 'admin' && (
              <>
                <div className="pt-4 pb-1.5 px-3">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Administration</p>
                </div>

                <NavLink to="/admin/resources" className={navItemClass}>
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>Manage Resources</span>
                </NavLink>

                <NavLink to="/admin/bookings" className={navItemClass}>
                  <CalendarCheck className="w-4 h-4 shrink-0" />
                  <span>Approvals Queue</span>
                </NavLink>

                <NavLink to="/admin/maintenance" className={navItemClass}>
                  <Wrench className="w-4 h-4 shrink-0" />
                  <span>Maintenance Engine</span>
                </NavLink>

                <NavLink to="/admin/users" className={navItemClass}>
                  <Users className="w-4 h-4 shrink-0" />
                  <span>User Accounts</span>
                </NavLink>

                <NavLink to="/admin/audit-logs" className={navItemClass}>
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Audit Logs</span>
                </NavLink>

                <NavLink to="/admin/reports" className={navItemClass}>
                  <FileSpreadsheet className="w-4 h-4 shrink-0" />
                  <span>Export Reports</span>
                </NavLink>
              </>
            )}
          </nav>
        </div>

        {/* User Profile Card & Logout */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-brand-600 text-white font-semibold flex items-center justify-center shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-navy-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.department}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-slate-500 hidden sm:inline">
              Campus Management / <span className="text-navy-900 font-semibold capitalize">{location.pathname.split('/')[1] || 'Dashboard'}</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Action: New Reservation */}
            <Link
              to="/resources"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 shadow-sm transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Book Resource</span>
            </Link>

            {/* Real-time Notification Bell with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-navy-900 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Quick Notification Dropdown */}
              {notificationDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 animate-slide-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="font-semibold text-sm text-navy-900">Notifications</span>
                    <Link
                      to="/notifications"
                      onClick={() => setNotificationDropdownOpen(false)}
                      className="text-xs text-brand-600 font-medium hover:underline"
                    >
                      View All
                    </Link>
                  </div>

                  <div className="py-2 max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No notifications yet.</p>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n._id}
                          onClick={() => {
                            if (!n.isRead) markAsRead(n._id);
                            if (n.link) navigate(n.link);
                            setNotificationDropdownOpen(false);
                          }}
                          className={`p-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
                            n.isRead ? 'bg-slate-50 hover:bg-slate-100 text-slate-600' : 'bg-brand-50/60 hover:bg-brand-50 text-navy-900 font-medium'
                          }`}
                        >
                          <p className="font-semibold">{n.title}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Account Role Tag */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-navy-900 text-white text-xs font-bold flex items-center justify-center">
                {user?.name?.charAt(0)}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-navy-900 leading-tight">{user?.name}</p>
                <p className="text-[10px] text-slate-400 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
