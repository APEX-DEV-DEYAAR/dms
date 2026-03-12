import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { letterheadApi, LetterheadFilter } from '../services/letterhead.api';
import { Letterhead, PaginatedResult } from '../types';
import { LetterheadTable } from '../components/LetterheadTable';
import { Pagination } from '../components/Pagination';
import { DateRangeFilter } from '../components/DateRangeFilter';

interface QuickStat {
  title: string;
  value: number | string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: JSX.Element;
  color: 'orange' | 'brown' | 'green' | 'blue';
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, isMonitor, canUpload } = useAuth();
  const [result, setResult] = useState<PaginatedResult<Letterhead> | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LetterheadFilter>({ page: 1, limit: 20 });
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quickStats, setQuickStats] = useState<QuickStat[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await letterheadApi.getList({
        ...filter,
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setResult(data);
      
      // Calculate quick stats from the data
      const totalCount = data.total;
      const thisMonthCount = data.data.filter(lh => {
        const date = new Date(lh.created_at);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length;
      
      setQuickStats([
        {
          title: 'Total Letters',
          value: totalCount,
          icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
          color: 'blue'
        },
        {
          title: 'This Month',
          value: thisMonthCount,
          icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
          color: 'brown'
        }
      ]);
    } catch (err) {
      console.error('Failed to load letters:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, search, startDate, endDate]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleExport = async () => {
    try {
      const blob = await letterheadApi.exportExcel({
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `letters_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter(prev => ({ ...prev, page: 1 }));
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'orange': return 'bg-deyaar-orange/10 text-deyaar-orange';
      case 'brown': return 'bg-deyaar-brown/10 text-deyaar-brown';
      case 'green': return 'bg-green-100 text-green-600';
      case 'blue': return 'bg-blue-100 text-blue-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-deyaar-dark">My Letters</h1>
          <p className="text-gray-500 mt-1">View and manage letters from your department</p>
        </div>
        {canUpload && (
          <button
            onClick={() => navigate('/upload')}
            className="btn-primary flex items-center gap-2 self-start"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Letter
          </button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {quickStats.map((stat, index) => (
          <div key={index} className="stat-card group">
            <div className="flex items-start justify-between">
              <div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${getColorClasses(stat.color)}`}>
                  {stat.icon}
                </div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-3xl font-bold text-deyaar-dark mt-1">{stat.value}</p>
                {stat.change && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className={`text-xs font-semibold ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change}
                    </span>
                    <span className="text-xs text-gray-400">vs last month</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="space-y-5">
        {/* Filters */}
        <div className="filter-bar">
          <div className="flex-1 min-w-[300px]">
            <label className="block text-xs font-semibold text-deyaar-brown mb-2 uppercase tracking-wider">
              Search
            </label>
            <form onSubmit={handleSearch} className="relative">
              <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by reference, description, notes..."
                className="search-input"
              />
            </form>
          </div>
          <div>
            <label className="block text-xs font-semibold text-deyaar-brown mb-2 uppercase tracking-wider">
              Date Range
            </label>
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={handleSearch} className="btn-primary">
              Apply Filters
            </button>
            <button
              type="button"
              onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); setFilter({ page: 1, limit: 20 }); }}
              className="btn-secondary"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="btn-secondary flex items-center gap-2"
              title="Export to Excel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Excel
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-deyaar-dark">{result?.data.length || 0}</span> of{' '}
            <span className="font-semibold text-deyaar-dark">{result?.total || 0}</span> letters
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select className="select-field !py-2 !w-auto !min-w-[140px]">
              <option>Newest First</option>
              <option>Oldest First</option>
              <option>Reference Number</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          {loading ? (
            <div className="p-16 text-center">
              <div className="inline-flex items-center gap-3 text-deyaar-brown">
                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span className="font-medium">Loading letters...</span>
              </div>
            </div>
          ) : result ? (
            <>
              <LetterheadTable letterheads={result.data} showDepartment={isMonitor} />
              <div className="border-t border-gray-100">
                <Pagination
                  page={result.page}
                  totalPages={result.totalPages}
                  onPageChange={page => setFilter(prev => ({ ...prev, page }))}
                />
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
