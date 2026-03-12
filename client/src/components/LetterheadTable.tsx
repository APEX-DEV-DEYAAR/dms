import { useNavigate } from 'react-router-dom';
import { Letterhead } from '../types';
import { letterheadApi } from '../services/letterhead.api';

interface Props {
  letterheads: Letterhead[];
  showDepartment?: boolean;
}

export function LetterheadTable({ letterheads, showDepartment = false }: Props) {
  const navigate = useNavigate();

  const handleDownload = async (id: number, fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const blob = await letterheadApi.download(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  if (letterheads.length === 0) {
    return (
      <div className="empty-state">
        <div className="w-20 h-20 bg-deyaar-beige rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-deyaar-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-deyaar-dark mb-1">No letters found</h3>
        <p className="text-sm text-gray-500 mb-4">Try adjusting your filters or search criteria</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="table-header">Reference</th>
            <th className="table-header">Snapshots</th>
            {showDepartment && <th className="table-header">Department</th>}
            <th className="table-header">Description</th>
            <th className="table-header">Date</th>
            <th className="table-header">Approved By</th>
            <th className="table-header text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {letterheads.map((lh, index) => (
            <tr 
              key={lh.id} 
              className="table-row cursor-pointer group animate-slide-in"
              style={{ animationDelay: `${index * 30}ms` }}
              onClick={() => navigate(`/letterheads/${lh.id}`)}
            >
              {/* Reference */}
              <td className="table-cell">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-deyaar-orange group-hover:text-deyaar-brown transition-colors">
                    {lh.reference_number}
                  </span>
                </div>
              </td>

              <td className="table-cell">
                <span className={`inline-flex items-center justify-center min-w-10 px-2 py-1 rounded-full text-xs font-semibold ${
                  (lh.snapshot_count || 0) > 0
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {lh.snapshot_count || 0}
                </span>
              </td>

              {showDepartment && (
                <td className="table-cell">
                  <span className="badge badge-beige">
                    {lh.department_code}
                  </span>
                </td>
              )}

              {/* Description */}
              <td className="table-cell">
                <span className="text-sm max-w-[200px] truncate block text-gray-600" title={lh.description || ''}>
                  {lh.description || '-'}
                </span>
              </td>

              {/* Date */}
              <td className="table-cell">
                <div className="flex items-center gap-2 text-gray-700">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(lh.letter_date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </div>
              </td>

              {/* Approval Authority */}
              <td className="table-cell">
                <span className="font-medium text-gray-700">
                  {lh.approval_authority}
                </span>
              </td>

              {/* Actions */}
              <td className="table-cell text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={(e) => handleDownload(lh.id, lh.file_name, e)}
                    className="p-2 text-gray-400 hover:text-deyaar-orange hover:bg-deyaar-orange/10 
                             rounded-lg transition-all duration-200"
                    title="Download PDF"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
