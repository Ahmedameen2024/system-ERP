import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';

interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  reference_type: string;
  status: string;
  total_debit: string;
  total_credit: string;
}

export default function TransactionAnalysis() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: async () => {
      const res = await api.get('/accounting/journal-entries');
      return res.data.data as JournalEntry[];
    },
    initialData: [],
  });

  const filtered = entries.filter(e => {
    const matchSearch = e.entry_number.includes(search) || (e.description && e.description.includes(search));
    const matchStatus = statusFilter ? e.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>تحليل المعاملات المالية (القيود اليومية)</h1>
        <button className="btn btn-primary btn-sm">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          قيد جديد
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline)', fontSize: 18 }}>search</span>
          <input 
            className="input" 
            placeholder="بحث برقم القيد أو البيان..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            style={{ paddingRight: '2.5rem', width: '100%' }} 
          />
        </div>
        
        <select className="input" style={{ width: '160px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">كل الحالات</option>
          <option value="Draft">مسودة</option>
          <option value="Approved">معتمد</option>
          <option value="Posted">مرحّل</option>
          <option value="Void">ملغي</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" />
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>رقم القيد</th>
                <th>التاريخ</th>
                <th>البيان</th>
                <th>المصدر</th>
                <th style={{ textAlign: 'left' }}>إجمالي المدين</th>
                <th style={{ textAlign: 'left' }}>إجمالي الدائن</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-on-surface-variant)' }}>
                    لا توجد قيود يومية
                  </td>
                </tr>
              ) : filtered.map(e => (
                <tr key={e.id}>
                  <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.8125rem' }}>{e.entry_number}</span></td>
                  <td className="numeric" style={{ fontSize: '0.8125rem' }}>{e.entry_date.split('T')[0]}</td>
                  <td>{e.description || '—'}</td>
                  <td><span className="chip chip-info">{e.reference_type || 'قيد يدوي'}</span></td>
                  <td className="numeric" style={{ textAlign: 'left', fontWeight: 600 }}>{Number(e.total_debit).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="numeric" style={{ textAlign: 'left', fontWeight: 600 }}>{Number(e.total_credit).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>
                    <span className={`chip ${e.status === 'Posted' ? 'chip-success' : e.status === 'Approved' ? 'chip-info' : e.status === 'Void' ? 'chip-error' : 'chip-neutral'}`}>
                      {e.status === 'Posted' ? 'مرحّل' : e.status === 'Approved' ? 'معتمد' : e.status === 'Void' ? 'ملغي' : 'مسودة'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" title="عرض"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span></button>
                    <button className="btn btn-ghost btn-sm" title="طباعة"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
