import React, { useState } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

const AdminReportsPage = () => {
  const { showToast } = useToast();

  const [bookingStatus, setBookingStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [downloadingBookings, setDownloadingBookings] = useState(false);
  const [downloadingUtilization, setDownloadingUtilization] = useState(false);

  const handleDownloadBookings = async () => {
    try {
      setDownloadingBookings(true);
      const params = new URLSearchParams();
      if (bookingStatus && bookingStatus !== 'all') params.append('status', bookingStatus);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`/analytics/export/bookings?${params.toString()}`, {
        responseType: 'blob',
      });

      // Trigger browser file download
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campusflow_bookings_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      showToast('Bookings report downloaded successfully!', 'success');
    } catch (err) {
      showToast('Failed to download bookings CSV report', 'error');
    } finally {
      setDownloadingBookings(false);
    }
  };

  const handleDownloadUtilization = async () => {
    try {
      setDownloadingUtilization(true);
      const response = await api.get('/analytics/export/utilization', {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campusflow_utilization_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      showToast('Utilization report downloaded successfully!', 'success');
    } catch (err) {
      showToast('Failed to download utilization CSV report', 'error');
    } finally {
      setDownloadingUtilization(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
          CSV Analytics & Data Reports
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Generate and export certified operational reports for academic institutional auditing and capacity planning
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bookings Ledger Export Card */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-card flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy-900">Reservations Ledger Report</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Export complete booking records including booking reference, facility code, requester identity, department, time window, status, and purpose.
              </p>
            </div>

            {/* Filter Options */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Filter by Status
                </label>
                <select
                  value={bookingStatus}
                  onChange={(e) => setBookingStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-brand-500/20 outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="approved">Approved Only</option>
                  <option value="pending">Pending Only</option>
                  <option value="cancelled">Cancelled Only</option>
                  <option value="rejected">Rejected Only</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadBookings}
            disabled={downloadingBookings}
            className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingBookings ? 'Compiling CSV...' : 'Export Bookings CSV'}</span>
          </button>
        </div>

        {/* Resource Utilization Export Card */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-card flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy-900">Facility Utilization Audit</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Export aggregated utilization metrics across all campus computing centers, physics laboratories, and lecture auditoriums.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs text-slate-600">
              <p className="font-semibold text-navy-900">Report Fields Included:</p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
                <li>Facility Name, Unique Code, and Room Specification</li>
                <li>Resource Category & Maximum Seat Capacity</li>
                <li>Designated Operating Schedules</li>
                <li>Lifetime Cumulative Approved Bookings</li>
                <li>Operational Status & Maintenance Blackouts</li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleDownloadUtilization}
            disabled={downloadingUtilization}
            className="w-full py-3 px-4 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingUtilization ? 'Compiling CSV...' : 'Export Utilization CSV'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
