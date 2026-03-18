import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { letterheadApi } from '../services/letterhead.api';
import { departmentApi } from '../services/department.api';
import { Department } from '../types';

export function UploadPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentId, setDepartmentId] = useState<number>(user?.departmentId || 0);
  const [letterDate, setLetterDate] = useState('');
  const [approvalAuthority, setApprovalAuthority] = useState('');
  const [description, setDescription] = useState('');
  const [iomNumber, setIomNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [nextRef, setNextRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    departmentApi.getAll().then(setDepartments).catch(console.error);
  }, []);

  useEffect(() => {
    if (departmentId) {
      letterheadApi.getNextReference(departmentId)
        .then(res => setNextRef(res.nextReference))
        .catch(console.error);
    }
  }, [departmentId]);

  useEffect(() => {
    if (user?.departmentId && !departmentId) {
      setDepartmentId(user.departmentId);
    }
  }, [user]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    validateAndSetFile(dropped);
  }, []);

  const validateAndSetFile = (selectedFile: File | null) => {
    if (!selectedFile) return;
    
    if (selectedFile.type !== 'application/pdf') {
      addToast('Please upload a PDF file only', 'error');
      return;
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) {
      addToast('File size must be less than 10MB', 'error');
      return;
    }
    
    setFile(selectedFile);
    addToast('File uploaded successfully', 'success');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndSetFile(e.target.files?.[0] || null);
  };

  const isFormValid = departmentId && letterDate && approvalAuthority && description && file;

  const handleSubmit = async () => {
    if (!isFormValid) {
      addToast('Please complete all required fields', 'error');
      return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('departmentId', String(departmentId));
      formData.append('letterDate', letterDate);
      formData.append('approvalAuthority', approvalAuthority);
      formData.append('description', description);
      formData.append('iomNumber', iomNumber || '');
      formData.append('notes', notes || '');
      formData.append('file', file);

      const result = await letterheadApi.create(formData);
      addToast(`Letter ${result.reference_number} registered successfully`, 'success');
      navigate(`/letterheads/${result.id}`);
    } catch (err: any) {
      addToast(err.message || 'Failed to register letter', 'error');
    } finally {
      setLoading(false);
    }
  };

  const approvalOptions = [
    'CEO', 'CFO', 'COO', 'Accounts Director', 'HR Director',
    'IT Director', 'Legal Director', 'Marketing Director',
    'Operations Director', 'Procurement Director', 'Other'
  ];

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-deyaar-dark">New Letter</h1>
          <p className="text-gray-500 text-sm">Register a new letterhead document</p>
        </div>
        {nextRef && (
          <div className="bg-gradient-to-r from-deyaar-orange to-deyaar-brown px-4 py-2 rounded-xl text-white">
            <p className="text-[10px] uppercase tracking-wider opacity-80">Next Reference</p>
            <p className="text-lg font-mono font-bold">{nextRef}</p>
          </div>
        )}
      </div>

      {/* Main Form - Grid Layout */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* Left Column - Form Fields */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-3">
          {/* Row 1: Department & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-3">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Department <span className="text-deyaar-orange">*</span>
              </label>
              {user?.role === 'department_user' ? (
                <div className="input-field bg-gray-50 py-2 text-sm">
                  {departments.find(d => d.id === departmentId)?.name || 'Your Department'}
                </div>
              ) : (
                <select
                  value={departmentId}
                  onChange={e => setDepartmentId(parseInt(e.target.value))}
                  className="select-field !py-2 text-sm"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="card p-3">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Letter Date <span className="text-deyaar-orange">*</span>
              </label>
              <input
                type="date"
                value={letterDate}
                onChange={e => setLetterDate(e.target.value)}
                className="input-field py-2 text-sm"
                required
              />
            </div>
          </div>

          {/* Row 2: Approval Authority */}
          <div className="card p-3">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Approval Authority <span className="text-deyaar-orange">*</span>
            </label>
            <select
              value={approvalAuthority}
              onChange={e => setApprovalAuthority(e.target.value)}
              className="select-field !py-2 text-sm"
              required
            >
              <option value="">Select who approved this letter</option>
              {approvalOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Row 3: IOM Number */}
          <div className="card p-3">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              IOM Number <span className="text-gray-300 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={iomNumber}
              onChange={e => setIomNumber(e.target.value)}
              placeholder="e.g. IOM-2026-001"
              className="input-field py-2 text-sm"
              maxLength={50}
            />
          </div>

          {/* Row 4: Description (Mandatory) */}
          <div className="card p-3 flex-1 flex flex-col">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Description <span className="text-deyaar-orange">*</span>
              <span className="text-gray-400 font-normal normal-case ml-1">- Brief summary of the letter</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Enter a brief description of what this letter is about..."
              className="input-field resize-none flex-1 text-sm"
              rows={2}
              required
            />
          </div>

          {/* Row 4: Notes (Optional) */}
          <div className="card p-3">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Additional Notes <span className="text-gray-300 font-normal">(Optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any extra information (optional)..."
              className="input-field resize-none text-sm"
              rows={2}
            />
          </div>
        </div>

        {/* Right Column - File Upload */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-3">
          {/* File Upload Area */}
          <div className="card p-4 flex-1 flex flex-col">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Upload PDF <span className="text-deyaar-orange">*</span>
            </label>
            
            {!file ? (
              <div
                className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 transition-all cursor-pointer ${
                  dragOver ? 'border-deyaar-orange bg-deyaar-orange/5' : 'border-gray-200 hover:border-deyaar-orange/50'
                }`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-12 h-12 bg-deyaar-beige rounded-xl flex items-center justify-center mb-2">
                  <svg className="w-6 h-6 text-deyaar-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700">Drop PDF here or click</p>
                <p className="text-xs text-gray-400 mt-1">Max 10MB</p>
                <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />
              </div>
            ) : (
              <div className="flex-1 bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="mt-auto flex items-center gap-2 text-green-600 text-xs">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Ready to upload</span>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!isFormValid || loading}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Registering...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Register Letter
              </>
            )}
          </button>

          {/* Validation Status */}
          <div className="card p-3 bg-gray-50">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Required Fields</p>
            <div className="space-y-1.5">
              <div className={`flex items-center gap-2 text-xs ${departmentId ? 'text-green-600' : 'text-gray-400'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={departmentId ? "M5 13l4 4L19 7" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                </svg>
                <span>Department selected</span>
              </div>
              <div className={`flex items-center gap-2 text-xs ${letterDate ? 'text-green-600' : 'text-gray-400'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={letterDate ? "M5 13l4 4L19 7" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                </svg>
                <span>Letter date</span>
              </div>
              <div className={`flex items-center gap-2 text-xs ${approvalAuthority ? 'text-green-600' : 'text-gray-400'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={approvalAuthority ? "M5 13l4 4L19 7" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                </svg>
                <span>Approval authority</span>
              </div>
              <div className={`flex items-center gap-2 text-xs ${description ? 'text-green-600' : 'text-gray-400'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={description ? "M5 13l4 4L19 7" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                </svg>
                <span>Description entered</span>
              </div>
              <div className={`flex items-center gap-2 text-xs ${file ? 'text-green-600' : 'text-gray-400'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={file ? "M5 13l4 4L19 7" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                </svg>
                <span>PDF file uploaded</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
