import { useState, useEffect } from 'react';
import { Department } from '../types';
import { departmentApi } from '../services/department.api';

interface Props {
  value?: number;
  onChange: (departmentId: number | undefined) => void;
}

export function DepartmentFilter({ value, onChange }: Props) {
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    departmentApi.getAll().then(setDepartments).catch(console.error);
  }, []);

  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value ? parseInt(e.target.value) : undefined)}
      className="border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none 
                 focus:ring-2 focus:ring-deyaar-orange/20 focus:border-deyaar-orange
                 bg-white min-w-[180px] appearance-none cursor-pointer transition-all duration-200"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23A2593F'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        backgroundSize: '16px'
      }}
    >
      <option value="">All Departments</option>
      {departments.map(d => (
        <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
      ))}
    </select>
  );
}
