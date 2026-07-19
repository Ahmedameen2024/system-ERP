import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  customer_name: string;
  customer_code: string;
  warehouse_name: string;
  net_amount: string;
  paid_amount: string;
  remaining_amount: string;
  status: string;
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  Draft:         { label: 'مسودة',        cls: 'chip-neutral' },
  Approved:      { label: 'معتمد',        cls: 'chip-info' },
  Posted:        { label: 'مرحّل',        cls: 'chip-success' },
  Paid:          { label: 'مدفوع',        cls: 'chip-success' },
  PartiallyPaid: { label: 'مدفوع جزئياً', cls: 'chip-info' },
  Void:          { label: 'ملغي',         cls: 'chip-error' },
};

export default function SalesInvoiceList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['sales-invoices'],
    queryFn: async () => { const r = await api.get('/sales/invoices'); return r.data.data as Invoice[]; },
    initialData: [],
  });

  const filtered = invoices.filter(inv => {
    const matchSearch = !search || inv.invoice_number.toLowerCase().includes(search.toLowerCase()) || inv.customer_name.includes(search);
    const matchStatus = !statusFilter || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalNet = filtered.reduce((s, inv) => s + Number(inv.net_amount), 0);
  const totalRemaining = filtered.reduce((s, inv) => s + Number(inv.remaining_amount), 0);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>فواتير المبيعات</h1>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/sales/invoices')}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          فاتورة جديدة
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>عدد الفواتير</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{filtered.length}</div>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>إجمالي المبالغ</div>
          <div className="numeric" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>
            {totalNet.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>المستحقات المتبقية</div>
          <div className="numeric" style={{ fontSize: '1.25rem', fontWeight: 800, color: totalRemaining > 0 ? '#ca8a04' : 'inherit' }}>
            {totalRemaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline)', fontSize: 18 }}>search</span>
          <input className="input" placeholder="بحث برقم الفاتورة أو اسم العميل..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingRight: '2.5rem' }} />
        </div>
        <select className="input" style={{ width: 200 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">كل الحالات</option>
          {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>رقم الفاتورة</th>
                <th>التاريخ</th>
                <th>الاستحقاق</th>
                <th>العميل</th>
                <th>المستودع</th>
                <th style={{ textAlign: 'left' }}>الإجمالي</th>
                <th style={{ textAlign: 'left' }}>المتبقي</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-on-surface-variant)' }}>
                  لا توجد فواتير — أنشئ فاتورة جديدة للبدء
                </td></tr>
              ) : filtered.map(inv => (
                <tr key={inv.id}>
                  <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.8125rem' }}>{inv.invoice_number}</span></td>
                  <td className="numeric" style={{ fontSize: '0.8125rem' }}>{inv.invoice_date?.split('T')[0]}</td>
                  <td className="numeric" style={{ fontSize: '0.8125rem' }}>{inv.due_date?.split('T')[0] || '—'}</td>
                  <td style={{ fontWeight: 500, fontSize: '0.8125rem' }}>{inv.customer_name}</td>
                  <td style={{ fontSize: '0.8125rem' }}>{inv.warehouse_name || '—'}</td>
                  <td className="numeric" style={{ textAlign: 'left', fontWeight: 700 }}>{Number(inv.net_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="numeric" style={{ textAlign: 'left', color: Number(inv.remaining_amount) > 0 ? '#ca8a04' : 'inherit', fontWeight: 600 }}>
                    {Number(inv.remaining_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td><span className={`chip ${statusConfig[inv.status]?.cls || 'chip-neutral'}`} style={{ fontSize: '0.7rem' }}>{statusConfig[inv.status]?.label || inv.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
