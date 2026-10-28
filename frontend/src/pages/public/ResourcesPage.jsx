import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Search,
  Filter,
  Building2,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  Layers,
  CheckCircle2,
} from 'lucide-react';

const typeOptions = [
  { label: 'All Resources', value: '' },
  { label: 'Computer Labs', value: 'computer_lab' },
  { label: 'Science Labs', value: 'science_lab' },
  { label: 'Seminar Halls', value: 'seminar_hall' },
  { label: 'Classrooms', value: 'classroom' },
  { label: 'Conference Suites', value: 'conference_room' },
  { label: 'Equipment & AV Gear', value: 'equipment' },
];

const ResourcesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  // Search & Filter state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');
  const [minCapacity, setMinCapacity] = useState(searchParams.get('minCapacity') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (selectedType) params.append('type', selectedType);
        if (minCapacity) params.append('minCapacity', minCapacity);
        params.append('page', page);
        params.append('limit', 8);

        const res = await api.get(`/resources?${params.toString()}`);
        setResources(res.data.data.resources || []);
        setTotal(res.data.data.pagination.total || 0);
        setPages(res.data.data.pagination.pages || 1);
      } catch (err) {
        console.warn('Failed to load resources:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [search, selectedType, minCapacity, page]);

  const handleTypeChange = (val) => {
    setSelectedType(val);
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (val) newParams.set('type', val);
    else newParams.delete('type');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (search) newParams.set('search', search);
    else newParams.delete('search');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Campus Resource Catalog</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
          Campus Facilities & Laboratories
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Browse specialized computing centers, research auditoriums, classrooms, and gear. Check live availability and submit reservations.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-card space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by facility name, room, building, or code..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all text-slate-800"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold shadow-sm transition-colors"
          >
            Search
          </button>
        </form>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleTypeChange(opt.value)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
                selectedType === opt.value
                  ? 'bg-brand-600 text-white font-semibold shadow-sm shadow-brand-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      {loading ? (
        <LoadingSpinner size="lg" text="Loading campus resources..." />
      ) : resources.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-navy-900">No resources found</h3>
          <p className="text-xs text-slate-500">
            No facilities match your current search criteria. Try clearing your filters or search terms.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedType('');
              setMinCapacity('');
              setSearchParams({});
            }}
            className="px-4 py-2 rounded-xl bg-brand-50 text-brand-700 text-xs font-semibold hover:bg-brand-100 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Showing {resources.length} of {total} facilities</span>
            <span>Page {page} of {pages}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {resources.map((resource) => (
              <div
                key={resource._id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Image & Badge Header */}
                  <div className="h-44 w-full bg-slate-100 relative overflow-hidden">
                    <img
                      src={
                        resource.imageUrl ||
                        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80'
                      }
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

                  {/* Resource Details */}
                  <div className="p-5 space-y-3">
                    <div>
                      <p className="text-[11px] font-bold text-brand-600 uppercase tracking-wider">
                        {resource.type.replace('_', ' ')}
                      </p>
                      <h3 className="text-base font-bold text-navy-900 mt-0.5 line-clamp-1 group-hover:text-brand-600 transition-colors">
                        {resource.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {resource.description || 'Modern facility equipped for academic teaching and research.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{resource.building} ({resource.roomNumber})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-navy-900">Cap: {resource.capacity}</span>
                      </div>
                    </div>

                    {/* Amenities Tag Preview */}
                    {resource.amenities?.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {resource.amenities.slice(0, 2).map((a, i) => (
                          <span
                            key={i}
                            className="inline-block bg-slate-50 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded-md border border-slate-200/60"
                          >
                            {a}
                          </span>
                        ))}
                        {resource.amenities.length > 2 && (
                          <span className="text-[10px] text-slate-400 self-center">
                            +{resource.amenities.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0">
                  <Link
                    to={`/resources/${resource._id}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-brand-600 hover:text-white text-navy-900 text-xs font-semibold border border-slate-200 hover:border-brand-600 transition-all flex items-center justify-center gap-1.5 group-hover:bg-brand-600 group-hover:text-white group-hover:border-brand-600 shadow-sm"
                  >
                    <span>Check Availability & Book</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {pages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500 font-medium">
                Page {page} of {pages}
              </span>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResourcesPage;
