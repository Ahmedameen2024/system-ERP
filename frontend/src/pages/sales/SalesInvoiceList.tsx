import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  currency_code: string;
  currency_symbol: string;
  exchange_rate: number;
  base_currency_code?: string;
  base_currency_symbol?: string;
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
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [postingId, setPostingId] = useState<string | null>(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['sales-invoices'],
    queryFn: async () => { const r = await api.get('/sales/invoices'); return r.data.data as Invoice[]; },
  });

  const postMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/sales/invoices/${id}/post`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-invoices'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'خطأ في ترحيل الفاتورة');
    },
    onSettled: () => {
      setPostingId(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/sales/invoices/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-invoices'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'خطأ في حذف الفاتورة');
    }
  });

  const handlePost = (id: string) => {
    if (window.confirm('هل تريد ترحيل هذه الفاتورة؟ سيتم إنشاء القيود المحاسبية وتحديث المخزون.')) {
      setPostingId(id);
      postMutation.mutate(id);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
      deleteMutation.mutate(id);
    }
  };

  const filtered = invoices.filter(inv => {
    const matchSearch = !search ||
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer_name?.includes(search) ||
      inv.currency_code?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Calculate totals in base currency where possible
  const totalNetBase = filtered.reduce((s, inv) => s + (Number(inv.net_amount) * Number(inv.exchange_rate || 1)), 0);
  const totalRemainingBase = filtered.reduce((s, inv) => s + (Number(inv.remaining_amount) * Number(inv.exchange_rate || 1)), 0);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>فواتير المبيعات</h1>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/sales/invoices')}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          فاتورة جديدة
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>عدد الفواتير</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{filtered.length}</div>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>إجمالي المبالغ (بالعملة الأساسية)</div>
          <div className="numeric" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>
            {totalNetBase.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>المستحقات المتبقية</div>
          <div className="numeric" style={{ fontSize: '1.25rem', fontWeight: 800, color: totalRemainingBase > 0 ? '#ca8a04' : 'inherit' }}>
            {totalRemainingBase.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240, maxWidth: 360 }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline)', fontSize: 18 }}>search</span>
          <input className="input" placeholder="بحث برقم الفاتورة أو العميل أو العملة..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingRight: '2.5rem' }} />
        </div>
        <select className="input" style={{ width: 180 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">كل الحالات</option>
          {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>رقم الفاتورة</th>
                  <th>التاريخ</th>
                  <th>العميل</th>
                  <th>العملة</th>
                  <th style={{ textAlign: 'left' }}>المبلغ الأصلي</th>
                  <th style={{ textAlign: 'left' }}>بالعملة الأساسية</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-on-surface-variant)' }}>
                    لا توجد فواتير — أنشئ فاتورة جديدة للبدء
                  </td></tr>
                ) : filtered.map(inv => {
                  const rate = Number(inv.exchange_rate || 1);
                  const isForeign = rate !== 1;
                  const baseAmt = Number(inv.net_amount) * rate;
                  const sym = inv.currency_symbol || inv.currency_code || '';

                  return (
                    <tr key={inv.id}>
                      <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.8125rem' }}>{inv.invoice_number}</span></td>
                      <td className="numeric" style={{ fontSize: '0.8125rem' }}>{inv.invoice_date?.split('T')[0]}</td>
                      <td style={{ fontWeight: 500, fontSize: '0.8125rem' }}>{inv.customer_name}</td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          background: 'var(--color-surface-container)', padding: '0.2rem 0.5rem',
                          borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700
                        }}>
                          {inv.currency_code}
                          {isForeign && (
                            <span style={{ color: 'var(--color-on-surface-variant)', fontWeight: 400 }}>
                              ×{rate.toFixed(4)}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="numeric" style={{ textAlign: 'left', fontWeight: 700 }}>
                        {Number(inv.net_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {sym}
                      </td>
                      <td className="numeric" style={{ textAlign: 'left', color: 'var(--color-on-surface-variant)', fontSize: '0.82rem' }}>
                        {isForeign
                          ? `${baseAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${inv.base_currency_symbol || inv.base_currency_code || ''}`
                          : '—'
                        }
                      </td>
                      <td><span className={`chip ${statusConfig[inv.status]?.cls || 'chip-neutral'}`} style={{ fontSize: '0.7rem' }}>{statusConfig[inv.status]?.label || inv.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {['Draft', 'Approved'].includes(inv.status) && (
                            <button
                              className="btn btn-ghost btn-sm"
                              title="ترحيل الفاتورة"
                              onClick={() => handlePost(inv.id)}
                              disabled={postingId === inv.id}
                            >
                              {postingId === inv.id ? (
                                <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                              ) : (
                                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-primary)' }}>publish</span>
                              )}
                            </button>
                          )}
                          {inv.status === 'Draft' && (
                            <button
                              className="btn btn-ghost btn-sm text-danger"
                              title="حذف الفاتورة"
                              onClick={() => handleDelete(inv.id)}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                            </button>
                          )}
                          <button
                            className="btn btn-ghost btn-sm"
                            title="طباعة الفاتورة"
                            onClick={() => navigate(`/sales/invoices/${inv.id}/print`)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
