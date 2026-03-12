import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../services/dashboard.api';
import { letterheadApi, LetterheadFilter } from '../services/letterhead.api';
import { DashboardSummary, Letterhead, PaginatedResult } from '../types';
import { LetterheadTable } from '../components/LetterheadTable';
import { DepartmentFilter } from '../components/DepartmentFilter';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { Pagination } from '../components/Pagination';

interface StatCard {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: JSX.Element;
  trend?: number;
  color: string;
}

export function MonitoringPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [result, setResult] = useState<PaginatedResult<Letterhead> | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [departmentId, setDepartmentId] = useState<number | undefined>();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    dashboardApi.getSummary().then(setSummary).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    letterheadApi.getList({
      departmentId,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      search: search || undefined,
      page,
      limit: 20,
    })
      .then(setResult)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [departmentId, startDate, endDate, search, page]);

  const handleExport = async () => {
    try {
      const blob = await letterheadApi.exportExcel({
        departmentId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: search || undefined,
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

  const stats: StatCard[] = summary ? [
    {
      title: 'Total Letters',
      value: summary.totalLetterheads,
      subtitle: 'All time registrations',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      trend: 12,
      color: 'from-deyaar-orange to-deyaar-orange-light'
    },
    {
      title: 'This Month',
      value: summary.thisMonthCount,
      subtitle: `${new Date().toLocaleString('default', { month: 'long' })} registrations`,
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      trend: 5,
      color: 'from-green-500 to-green-400'
    },
    {
      title: 'Active Departments',
      value: summary.departmentBreakdown.filter(d => d.count > 0).length,
      subtitle: 'Departments with activity',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
      color: 'from-blue-500 to-blue-400'
    },
    {
      title: 'Most Active Dept',
      value: summary.departmentBreakdown[0]?.department_code || '-',
      subtitle: `${summary.departmentBreakdown[0]?.count || 0} letters`,
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
      color: 'from-purple-500 to-purple-400'
    },
  ] : [];

  // Calculate max count for bar chart
  const maxCount = summary ? Math.max(...summary.departmentBreakdown.map(d => d.count)) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-deyaar-dark">All Letters</h1>
          <p className="text-gray-500 mt-1">View all letterheads across departments with analytics</p>
        </div>
        <button
          onClick={() => navigate('/upload')}
          className="btn-primary flex items-center gap-2 self-start"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Letter
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, index) => (
          <div key={index} className="card card-hover overflow-hidden">
            <div className={`h-1 bg-gradient-to-r ${stat.color}`} />
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-3xl font-bold text-deyaar-dark mt-2">{stat.value}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-gray-400 mt-1">{stat.subtitle}</p>
                  )}
                  {stat.trend !== undefined && stat.trend > 0 && (
                    <div className="flex items-center gap-1 mt-3">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span className="text-xs font-semibold text-green-600">+{stat.trend}%</span>
                      <span className="text-xs text-gray-400">vs last month</span>
                    </div>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10 flex items-center justify-center text-white`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Activity Chart */}
        {summary && (
          <div className="lg:col-span-1">
            <div className="card p-6 h-full">
              <h3 className="section-title mb-6">
                <svg className="w-5 h-5 text-deyaar-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Department Activity
              </h3>
              <div className="space-y-4">
                {summary.departmentBreakdown
                  .sort((a, b) => b.count - a.count)
                  .map((dept, index) => {
                    const percentage = maxCount > 0 ? (dept.count / maxCount) * 100 : 0;
                    const colors = ['bg-deyaar-orange', 'bg-deyaar-brown', 'bg-green-500', 'bg-blue-500', 'bg-purple-500'];
                    const color = colors[index % colors.length];
                    
                    return (
                      <div key={dept.department_code} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center">
                              {dept.department_code}
                            </span>
                            <span className="text-sm font-medium text-gray-700">{dept.department_name}</span>
                          </div>
                          <span className="text-sm font-bold text-deyaar-dark">{dept.count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${color} rounded-full transition-all duration-1000 ease-out group-hover:opacity-80`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-deyaar-dark mb-3">Quick Insights</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{summary.departmentBreakdown.filter(d => d.count > 0).length} departments active</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-deyaar-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>{summary.thisMonthCount} letters this month</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Letterheads Table */}
        <div className="lg:col-span-2 space-y-5">
          {/* Filters */}
          <div className="card p-5">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs font-semibold text-deyaar-brown mb-2 uppercase tracking-wider">
                  Department
                </label>
                <DepartmentFilter value={departmentId} onChange={v => { setDepartmentId(v); setPage(1); }} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-deyaar-brown mb-2 uppercase tracking-wider">
                  Date Range
                </label>
                <DateRangeFilter
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={v => { setStartDate(v); setPage(1); }}
                  onEndDateChange={v => { setEndDate(v); setPage(1); }}
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-semibold text-deyaar-brown mb-2 uppercase tracking-wider">
                  Search
                </label>
                <div className="relative">
                  <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Reference, description or notes..."
                    className="search-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-500">
                Showing <span className="font-semibold text-deyaar-dark">{result?.data.length || 0}</span> of{' '}
                <span className="font-semibold text-deyaar-dark">{result?.total || 0}</span> letters
              </p>
              <button
                onClick={handleExport}
                className="btn-secondary flex items-center gap-2 !py-1.5 !px-3 text-sm"
                title="Export to Excel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Excel
              </button>
            </div>
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
                  <span className="font-medium">Loading...</span>
                </div>
              </div>
            ) : result ? (
              <>
                <LetterheadTable letterheads={result.data} showDepartment />
                <div className="border-t border-gray-100">
                  <Pagination page={result.page} totalPages={result.totalPages} onPageChange={setPage} />
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
