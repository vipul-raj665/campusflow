import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Bell,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  CalendarCheck,
  CheckCheck,
  Wrench,
  ExternalLink,
} from 'lucide-react';

const NotificationsPage = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [filterUnread, setFilterUnread] = useState(false);

  const displayedNotifications = filterUnread
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const getIcon = (type) => {
    switch (type) {
      case 'booking_approved':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'booking_rejected':
        return <XCircle className="w-5 h-5 text-rose-500 shrink-0" />;
      case 'booking_cancelled':
        return <XCircle className="w-5 h-5 text-slate-400 shrink-0" />;
      case 'maintenance_scheduled':
        return <Wrench className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'booking_created':
        return <CalendarCheck className="w-5 h-5 text-brand-500 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-blue-500 shrink-0" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Notifications Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time status updates on your booking requests and campus maintenance notices
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-brand-600" />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-3 text-xs border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilterUnread(false)}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            !filterUnread ? 'bg-navy-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilterUnread(true)}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            filterUnread ? 'bg-navy-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {loading && notifications.length === 0 ? (
        <LoadingSpinner size="lg" text="Loading notifications..." />
      ) : displayedNotifications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <Bell className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-navy-900">All caught up!</h3>
          <p className="text-xs text-slate-500">
            {filterUnread
              ? 'You have zero unread notifications.'
              : 'You have not received any notifications yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedNotifications.map((n) => (
            <div
              key={n._id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                n.isRead
                  ? 'bg-white border-slate-200 text-slate-700'
                  : 'bg-brand-50/50 border-brand-200/80 text-navy-900 shadow-sm'
              }`}
            >
              <div className="mt-0.5">{getIcon(n.type)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-navy-900 truncate">{n.title}</h4>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>

                <div className="flex items-center gap-3 mt-3 pt-2 border-t border-slate-100">
                  {n.link && (
                    <Link
                      to={n.link}
                      onClick={() => !n.isRead && markAsRead(n._id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
                    >
                      <span>View Details</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  {!n.isRead && (
                    <button
                      onClick={() => markAsRead(n._id)}
                      className="text-xs text-slate-500 hover:text-navy-900 font-medium"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
