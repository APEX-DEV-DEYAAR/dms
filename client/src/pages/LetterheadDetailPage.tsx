import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Department, Letterhead, LetterheadVersion, UpdateLetterheadPayload } from '../types';
import { letterheadApi } from '../services/letterhead.api';
import { departmentApi } from '../services/department.api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const approvalOptions = [
  'CEO',
  'CFO',
  'COO',
  'Accounts Director',
  'HR Director',
  'IT Director',
  'Legal Director',
  'Marketing Director',
  'Operations Director',
  'Procurement Director',
  'Other',
];

function toDateInput(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

export function LetterheadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [letterhead, setLetterhead] = useState<Letterhead | null>(null);
  const [versions, setVersions] = useState<LetterheadVersion[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showVersions, setShowVersions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<UpdateLetterheadPayload>({
    departmentId: 0,
    letterDate: '',
    approvalAuthority: '',
    description: '',
    notes: '',
    iomNumber: '',
    justification: '',
    file: null,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const letterId = Number(id);

  const canEdit =
    !!user &&
    !!letterhead &&
    Number(user.userId) === Number(letterhead.created_by);

  async function loadData() {
    if (!letterId) return;

    setLoading(true);
    setError('');
    try {
      const [lh, history, deptList] = await Promise.all([
        letterheadApi.getById(letterId),
        letterheadApi.getVersions(letterId),
        departmentApi.getAll(),
      ]);

      setLetterhead(lh);
      setVersions(history);
      setDepartments(deptList);
      setEditForm({
        departmentId: lh.department_id,
        letterDate: toDateInput(lh.letter_date),
        approvalAuthority: lh.approval_authority,
        description: lh.description || '',
        notes: lh.notes || '',
        iomNumber: lh.iom_number || '',
        justification: '',
        file: null,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load letter');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [letterId]);

  const handleDownload = async () => {
    if (!letterhead) return;
    try {
      const blob = await letterheadApi.download(letterhead.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = letterhead.file_name;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      addToast('Download failed', 'error');
    }
  };

  const openEditModal = () => {
    if (!letterhead) return;
    setEditForm({
      departmentId: letterhead.department_id,
      letterDate: toDateInput(letterhead.letter_date),
      approvalAuthority: letterhead.approval_authority,
      description: letterhead.description || '',
      notes: letterhead.notes || '',
      justification: '',
      file: null,
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      addToast('Please upload a PDF file only', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      addToast('File size must be less than 10MB', 'error');
      return;
    }
    setEditForm(current => ({ ...current, file }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!editForm.departmentId) errors.departmentId = 'Department is required';
    if (!editForm.letterDate) errors.letterDate = 'Letter date is required';
    if (!editForm.approvalAuthority) errors.approvalAuthority = 'Approval authority is required';
    if (!editForm.description.trim()) errors.description = 'Description is required';
    if (!editForm.justification.trim()) errors.justification = 'Justification is required for changes';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      addToast('Complete the required fields before saving', 'error');
    }
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!letterhead || !validateForm()) return;

    setIsSaving(true);
    try {
      const updated = await letterheadApi.update(letterhead.id, {
        ...editForm,
        description: editForm.description.trim(),
        notes: editForm.notes?.trim() || '',
        iomNumber: editForm.iomNumber?.trim() || '',
        justification: editForm.justification.trim(),
      });
      setLetterhead(updated);
      setShowEditModal(false);
      addToast('Letter updated successfully', 'success');

      try {
        const history = await letterheadApi.getVersions(letterhead.id);
        setVersions(history);
      } catch {
        addToast('Letter was updated, but history refresh needs a page reload', 'info');
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to update letter', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-deyaar-orange" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-deyaar-brown font-medium">Loading letter details...</span>
        </div>
      </div>
    );
  }

  if (error || !letterhead) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <h3 className="text-xl font-bold text-deyaar-dark mb-2">Letter not available</h3>
          <p className="text-gray-500 mb-6">{error || 'The requested letter could not be found.'}</p>
          <button onClick={() => navigate(-1)} className="btn-primary">Go Back</button>
        </div>
      </div>
    );
  }

  const letterDate = new Date(letterhead.letter_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const registeredDate = new Date(letterhead.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col animate-fade-in">
      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-xl font-bold text-deyaar-dark">Edit Letter</h3>
                  <p className="text-sm text-gray-500 mt-1">{letterhead.reference_number}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Dept <span className="text-deyaar-orange">*</span>
                  </label>
                  {user?.role === 'department_user' ? (
                    <div className="input-field bg-gray-50 py-2.5 text-sm truncate">
                      {departments.find(d => d.id === editForm.departmentId)?.name || letterhead.department_name}
                    </div>
                  ) : (
                    <select
                      value={editForm.departmentId}
                      onChange={e => setEditForm(current => ({ ...current, departmentId: parseInt(e.target.value) }))}
                      className={`select-field w-full !py-2.5 text-sm ${formErrors.departmentId ? 'border-red-300' : ''}`}
                    >
                      <option value="">Select...</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  )}
                    {formErrors.departmentId && <p className="text-xs text-red-500 mt-1">{formErrors.departmentId}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Date <span className="text-deyaar-orange">*</span>
                  </label>
                  <input
                    type="date"
                    value={editForm.letterDate}
                    onChange={e => setEditForm(current => ({ ...current, letterDate: e.target.value }))}
                    className={`input-field w-full py-2.5 text-sm ${formErrors.letterDate ? 'border-red-300' : ''}`}
                  />
                    {formErrors.letterDate && <p className="text-xs text-red-500 mt-1">{formErrors.letterDate}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Approved By <span className="text-deyaar-orange">*</span>
                  </label>
                  <select
                    value={editForm.approvalAuthority}
                    onChange={e => setEditForm(current => ({ ...current, approvalAuthority: e.target.value }))}
                    className={`select-field w-full !py-2.5 text-sm ${formErrors.approvalAuthority ? 'border-red-300' : ''}`}
                  >
                    <option value="">Select...</option>
                    {approvalOptions.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                    {formErrors.approvalAuthority && <p className="text-xs text-red-500 mt-1">{formErrors.approvalAuthority}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      IOM Number <span className="text-gray-400 font-normal normal-case">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.iomNumber || ''}
                      onChange={e => setEditForm(current => ({ ...current, iomNumber: e.target.value }))}
                      placeholder="e.g. IOM-2026-001"
                      className="input-field w-full py-2.5 text-sm"
                      maxLength={50}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Description <span className="text-deyaar-orange">*</span>
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={e => setEditForm(current => ({ ...current, description: e.target.value }))}
                    placeholder="Description..."
                    className={`input-field w-full resize-none text-sm py-2.5 ${formErrors.description ? 'border-red-300' : ''}`}
                    rows={5}
                  />
                    {formErrors.description && <p className="text-xs text-red-500 mt-1">{formErrors.description}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Notes <span className="text-gray-400 font-normal normal-case">(Optional)</span>
                    </label>
                    <textarea
                      value={editForm.notes}
                      onChange={e => setEditForm(current => ({ ...current, notes: e.target.value }))}
                      placeholder="Additional notes..."
                      className="input-field w-full resize-none text-sm py-2.5"
                      rows={4}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Justification <span className="text-deyaar-orange">*</span>
                  </label>
                  <textarea
                    value={editForm.justification}
                    onChange={e => setEditForm(current => ({ ...current, justification: e.target.value }))}
                    placeholder="Reason for changes..."
                    className={`input-field w-full resize-none text-sm py-2.5 ${formErrors.justification ? 'border-red-300' : ''}`}
                    rows={5}
                  />
                  {formErrors.justification ? (
                    <p className="text-xs text-red-500 mt-1">{formErrors.justification}</p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">Required for audit trail and version history.</p>
                  )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Replace PDF <span className="text-gray-400 font-normal normal-case">(Optional)</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={e => handleFileSelect(e.target.files?.[0] || null)}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-3 rounded-xl border border-dashed border-gray-300 px-4 py-4 text-left hover:border-deyaar-orange hover:bg-deyaar-beige-light transition-colors"
                  >
                    <div className="w-10 h-10 bg-deyaar-orange/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-deyaar-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {editForm.file ? editForm.file.name : 'Choose replacement PDF'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {editForm.file ? 'Ready to replace current attachment' : 'Leave empty to keep existing attachment'}
                      </p>
                    </div>
                  </button>
                  {editForm.file && (
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="text-xs text-amber-600">Current PDF will be replaced</p>
                      <button
                        onClick={() => setEditForm(current => ({ ...current, file: null }))}
                        className="text-xs text-red-500 hover:text-red-600"
                      >
                        Remove file
                      </button>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isSaving}
                className="px-5 py-2.5 btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="min-w-[180px] btn-primary flex items-center justify-center gap-2 text-sm py-2.5"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 text-gray-500 hover:text-deyaar-orange hover:bg-deyaar-beige-light rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Letter Reference</p>
            <h1 className="text-xl font-bold text-deyaar-dark font-mono">{letterhead.reference_number}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <button onClick={openEditModal} className="btn-secondary flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
          <button onClick={handleDownload} className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* Left Column - Key Details */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-2 gap-4 content-start">
          <div className="card p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Reference</p>
            <p className="text-sm font-bold text-deyaar-dark font-mono mt-2">{letterhead.reference_number}</p>
          </div>
          <div className="card p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Department</p>
            <p className="text-sm font-bold text-deyaar-dark mt-2">{letterhead.department_name}</p>
            <p className="text-xs text-gray-400">{letterhead.department_code}</p>
          </div>
          <div className="card p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Letter Date</p>
            <p className="text-sm font-bold text-deyaar-dark mt-2">{letterDate}</p>
          </div>
          <div className="card p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Approved By</p>
            <p className="text-sm font-bold text-deyaar-dark mt-2">{letterhead.approval_authority}</p>
          </div>
          <div className="card p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">IOM Number</p>
            <p className="text-sm font-bold text-deyaar-dark mt-2">{letterhead.iom_number || '-'}</p>
          </div>
          <div className="card p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Registered By</p>
            <p className="text-sm font-bold text-deyaar-dark mt-2">{letterhead.created_by_name || 'Unknown'}</p>
          </div>
          <div className="card p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Registered On</p>
            <p className="text-sm font-bold text-deyaar-dark mt-2">{registeredDate}</p>
          </div>
          <div className="col-span-2 card p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</p>
            <p className="text-sm text-gray-700 leading-relaxed mt-2">{letterhead.description || 'No description available'}</p>
          </div>
          <div className="col-span-2 card p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Notes</p>
            <p className="text-sm text-gray-700 leading-relaxed mt-2">{letterhead.notes || 'No notes available'}</p>
          </div>
        </div>

        {/* Right Column - File & History */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          {/* File Card */}
          <div className="card p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Attached File</p>
            <div className="bg-deyaar-beige-light rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-deyaar-dark break-all">{letterhead.file_name}</p>
              <p className="text-xs text-gray-500 mt-1">
                PDF | {letterhead.file_size_bytes ? `${(letterhead.file_size_bytes / 1024 / 1024).toFixed(2)} MB` : 'Size unknown'}
              </p>
            </div>
          </div>

          {/* Version History */}
          {versions.length > 0 && (
            <div className="card p-4 flex-1">
              <button onClick={() => setShowVersions(current => !current)} className="w-full flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Update History</p>
                  <p className="text-xs text-gray-500 mt-1">{versions.length} version{versions.length > 1 ? 's' : ''}</p>
                </div>
                <span className="text-xs font-semibold text-deyaar-orange">{showVersions ? 'Hide' : 'Show'}</span>
              </button>

              <div className={`space-y-3 ${showVersions ? 'max-h-96 overflow-y-auto' : 'max-h-24 overflow-hidden'}`}>
                {versions.map(version => (
                  <div key={version.id} className="bg-deyaar-beige-light rounded-xl p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-deyaar-orange">v{version.version_number}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(version.modified_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 mt-1">{version.change_summary || 'Updated letter'}</p>
                    <p className="text-[10px] text-gray-500 mt-1">by {version.modified_by_name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
