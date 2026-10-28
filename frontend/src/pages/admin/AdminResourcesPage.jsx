import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Building2,
  PlusCircle,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Clock,
  Users,
} from 'lucide-react';

const initialForm = {
  name: '',
  code: '',
  type: 'computer_lab',
  building: '',
  roomNumber: '',
  capacity: 30,
  openTime: '08:00',
  closeTime: '20:00',
  minDurationMinutes: 30,
  maxDurationMinutes: 240,
  advanceBookingDaysLimit: 14,
  amenitiesStr: 'Gigabit LAN, Air Conditioning, 4K Projector',
  imageUrl: '',
  description: '',
  status: 'active',
};

const AdminResourcesPage = () => {
  const { showToast } = useToast();

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', 50);

      const res = await api.get(`/resources?${params.toString()}`);
      setResources(res.data.data.resources || []);
    } catch (err) {
      showToast('Failed to load resource inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [typeFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchResources();
  };

  const handleOpenCreate = () => {
    setFormData(initialForm);
    setIsEditing(false);
    setEditingId(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (res) => {
    setFormData({
      name: res.name,
      code: res.code,
      type: res.type,
      building: res.building,
      roomNumber: res.roomNumber,
      capacity: res.capacity,
      openTime: res.operatingHours?.openTime || '08:00',
      closeTime: res.operatingHours?.closeTime || '20:00',
      minDurationMinutes: res.minDurationMinutes || 30,
      maxDurationMinutes: res.maxDurationMinutes || 240,
      advanceBookingDaysLimit: res.advanceBookingDaysLimit || 14,
      amenitiesStr: (res.amenities || []).join(', '),
      imageUrl: res.imageUrl || '',
      description: res.description || '',
      status: res.status || 'active',
    });
    setIsEditing(true);
    setEditingId(res._id);
    setModalOpen(true);
  };

  const handleSaveResource = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: formData.name,
      code: formData.code.toUpperCase(),
      type: formData.type,
      building: formData.building,
      roomNumber: formData.roomNumber,
      capacity: Number(formData.capacity),
      operatingHours: {
        openTime: formData.openTime,
        closeTime: formData.closeTime,
      },
      minDurationMinutes: Number(formData.minDurationMinutes),
      maxDurationMinutes: Number(formData.maxDurationMinutes),
      advanceBookingDaysLimit: Number(formData.advanceBookingDaysLimit),
      amenities: formData.amenitiesStr.split(',').map((s) => s.trim()).filter(Boolean),
      imageUrl: formData.imageUrl,
      description: formData.description,
      status: formData.status,
    };

    try {
      if (isEditing) {
        await api.put(`/resources/${editingId}`, payload);
        showToast('Resource updated successfully', 'success');
      } else {
        await api.post('/resources', payload);
        showToast('New resource created successfully', 'success');
      }
      setModalOpen(false);
      fetchResources();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save resource', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteResource = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate ${name}?`)) return;
    try {
      await api.delete(`/resources/${id}`);
      showToast(`Resource ${name} deactivated.`, 'success');
      fetchResources();
    } catch (err) {
      showToast(err.response?.data?.message || 'Deactivation failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Campus Resource Inventory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure laboratories, auditoriums, equipment, capacity limits, and operating rules
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Facility</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources by name, code, or building..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
          >
            <option value="">All Types</option>
            <option value="computer_lab">Computer Lab</option>
            <option value="science_lab">Science Lab</option>
            <option value="seminar_hall">Seminar Hall</option>
            <option value="classroom">Classroom</option>
            <option value="conference_room">Conference Room</option>
            <option value="equipment">Equipment</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <LoadingSpinner size="lg" text="Loading resource inventory..." />
      ) : resources.length === 0 ? (
        <p className="text-xs text-slate-400 py-12 text-center bg-white rounded-3xl border border-slate-200">
          No resources found.
        </p>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Code / Name</th>
                  <th className="py-3.5 px-6">Type & Location</th>
                  <th className="py-3.5 px-6">Capacity</th>
                  <th className="py-3.5 px-6">Operating Hours</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resources.map((res) => (
                  <tr key={res._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-navy-900 block">{res.code}</span>
                      <span className="font-semibold text-slate-700 mt-0.5 block">{res.name}</span>
                    </td>

                    <td className="py-4 px-6">
                      <span className="font-medium text-brand-600 block capitalize">
                        {res.type.replace('_', ' ')}
                      </span>
                      <span className="text-slate-400 text-[11px] block mt-0.5">
                        {res.building} ({res.roomNumber})
                      </span>
                    </td>

                    <td className="py-4 px-6 font-semibold text-navy-900 whitespace-nowrap">
                      {res.capacity} Persons
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap font-mono text-slate-600">
                      {res.operatingHours?.openTime} - {res.operatingHours?.closeTime}
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">
                      <Badge variant={res.status}>{res.status}</Badge>
                    </td>

                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(res)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-brand-50"
                          title="Edit Specifications"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {res.status !== 'inactive' && (
                          <button
                            onClick={() => handleDeleteResource(res._id, res.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Deactivate Facility"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Resource Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Edit Facility Specifications' : 'Add New Campus Facility'}
        description="Configure operational hours, capacity, and booking constraints."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveResource} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Resource Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Artificial Intelligence Lab"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Identifier Code (Unique)
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. LAB-AI-201"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono uppercase focus:ring-2 focus:ring-brand-500/20 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Resource Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-brand-500/20 outline-none"
              >
                <option value="computer_lab">Computer Lab</option>
                <option value="science_lab">Science Lab</option>
                <option value="seminar_hall">Seminar Hall</option>
                <option value="classroom">Classroom</option>
                <option value="conference_room">Conference Room</option>
                <option value="equipment">Equipment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Building
              </label>
              <input
                type="text"
                required
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                placeholder="Technology Tower"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Room Number
              </label>
              <input
                type="text"
                required
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                placeholder="Room 304"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Capacity
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Open Time
              </label>
              <input
                type="time"
                required
                value={formData.openTime}
                onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Close Time
              </label>
              <input
                type="time"
                required
                value={formData.closeTime}
                onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Min Duration (m)
              </label>
              <input
                type="number"
                min="15"
                value={formData.minDurationMinutes}
                onChange={(e) => setFormData({ ...formData, minDurationMinutes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Max Duration (m)
              </label>
              <input
                type="number"
                max="720"
                value={formData.maxDurationMinutes}
                onChange={(e) => setFormData({ ...formData, maxDurationMinutes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Advance Limit (Days)
              </label>
              <input
                type="number"
                min="1"
                value={formData.advanceBookingDaysLimit}
                onChange={(e) => setFormData({ ...formData, advanceBookingDaysLimit: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Amenities & Equipment (Comma-separated)
            </label>
            <input
              type="text"
              value={formData.amenitiesStr}
              onChange={(e) => setFormData({ ...formData, amenitiesStr: e.target.value })}
              placeholder="e.g. Gigabit LAN, Dual 4K Projectors, Surround Sound Audio"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Image URL
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Description
            </label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              {submitting ? 'Saving...' : isEditing ? 'Update Facility' : 'Create Facility'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminResourcesPage;
