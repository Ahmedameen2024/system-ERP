import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

interface SalesReturn {
  id: string;
  return_number: string;
  return_date: string;
  customer_name: string;
  original_invoice_number: string;
  net_amount: string;
  reason: string;
  status: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  invoice_date: string;
}

interface InvoiceLine {
  id: string;
  item_id: string;
  item_name: string;
  item_code: string;
  uom_name: string;
  quantity: string;
  unit_price: string;
  total_amount: string;
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  Draft:    { label: 'مسودة',  cls: 'chip-neutral' },
  Approved: { label: 'معتمد', cls: 'chip-info' },
  Posted:   { label: 'مرحّل', cls: 'chip-success' },
  Void:     { label: 'ملغي',  cls: 'chip-error' },
};

export default function SalesReturn() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLine[]>([]);
  const [returnLines, setReturnLines] = useState<{ originalLineId: string; quantity: number; }[]>([]);
  const [form, setForm] = useState({
    returnDate: new Date().toISOString().split('T')[0],
    reason: '',
    warehouseId: '',
  });
  const [loadingLines, setLoadingLines] = useState(false);

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ['sales-returns'],
    queryFn: async () => { const r = await api.get('/sales/returns'); return r.data.data as SalesReturn[]; },
    initialData: [],
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['sales-invoices'],
    queryFn: async () => { const r = await api.get('/sales/invoices'); return r.data.data as Invoice[]; },
    initialData: [],
  });

  const postedInvoices = invoices.filter(inv => ['Posted', 'Paid', 'PartiallyPaid'].includes((inv as any).status));

  const loadInvoiceLines = async (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setInvoiceLines([]);
    setReturnLines([]);
    if (!invoiceId) return;
    setLoadingLines(true);
    try {
      const r = await api.get(`/sales/invoices/${invoiceId}`);
      const lines = r.data.data.lines as InvoiceLine[];
      setInvoiceLines(lines);
      setReturnLines(lines.map(l => ({ originalLineId: l.id, quantity: Number(l.quantity) })));
    } finally {
      setLoadingLines(false);
    }
  };

  const mutation = useMutation({
    mutationFn: async () => api.post('/sales/returns', {
      originalInvoiceId: selectedInvoiceId,
      returnDate: form.returnDate,
      reason: form.reason,
      lines: returnLines.filter(l => l.quantity > 0),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-returns'] });
      qc.invalidateQueries({ queryKey: ['sales-invoices'] });
      qc.invalidateQueries({ queryKey: ['inventory-balances'] });
      setShowModal(false);
      setSelectedInvoiceId('');
      setInvoiceLines([]);
      setReturnLines([]);
    }
  });

  const openNew = () => {
    setSelectedInvoiceId('');
    setInvoiceLines([]);
    setReturnLines([]);
    setForm({ returnDate: new Date().toISOString().split('T')[0], reason: '', warehouseId: '' });
    setShowModal(true);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>مرتجعات المبيعات</h1>
        <button className="btn btn-primary btn-sm" onClick={openNew}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          مرتجع جديد
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>رقم المرتجع</th>
                <th>التاريخ</th>
                <th>العميل</th>
                <th>الفاتورة الأصلية</th>
                <th style={{ textAlign: 'left' }}>المبلغ</th>
                <th>سبب الإرجاع</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {returns.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-on-surface-variant)' }}>
                  لا توجد مرتجعات مسجلة
                </td></tr>
              ) : returns.map(r => (
                <tr key={r.id}>
                  <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.8125rem' }}>{r.return_number}</span></td>
                  <td className="numeric" style={{ fontSize: '0.8125rem' }}>{r.return_date?.split('T')[0]}</td>
                  <td style={{ fontWeight: 500, fontSize: '0.8125rem' }}>{r.customer_name}</td>
                  <td><span className="chip chip-info" style={{ fontSize: '0.7rem' }}>{r.original_invoice_number}</span></td>
                  <td className="numeric" style={{ textAlign: 'left', fontWeight: 700 }}>{Number(r.net_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td style={{ fontSize: '0.8125rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason || '—'}</td>
                  <td><span className={`chip ${statusConfig[r.status]?.cls || 'chip-neutral'}`} style={{ fontSize: '0.7rem' }}>{statusConfig[r.status]?.label || r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: 760 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>إنشاء مرتجع مبيعات</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label>الفاتورة الأصلية *</label>
                  <select className="input" value={selectedInvoiceId} onChange={e => loadInvoiceLines(e.target.value)} required>
                    <option value="">-- اختر الفاتورة المرتجعة --</option>
                    {postedInvoices.map(inv => (
                      <option key={inv.id} value={inv.id}>{inv.invoice_number} — {inv.customer_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>تاريخ المرتجع *</label>
                  <input className="input" type="date" value={form.returnDate} onChange={e => setForm({ ...form, returnDate: e.target.value })} required />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>سبب الإرجاع</label>
                  <input className="input" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="وصف سبب المرتجع..." />
                </div>
              </div>

              {/* Invoice Lines to Return */}
              {selectedInvoiceId && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--color-primary)' }}>
                    أصناف الفاتورة — حدد الكميات المرتجعة
                  </div>

                  {loadingLines ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner" /></div>
                  ) : (
                    <div style={{ border: '1px solid var(--color-outline-variant)', borderRadius: '0.75rem', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'var(--color-surface-container)' }}>
                            <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontSize: '0.8125rem' }}>الصنف</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right', fontSize: '0.8125rem' }}>الوحدة</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right', fontSize: '0.8125rem' }}>الكمية الأصلية</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right', fontSize: '0.8125rem' }}>الكمية المرتجعة</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right', fontSize: '0.8125rem' }}>سعر الوحدة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoiceLines.map((line, idx) => (
                            <tr key={line.id} style={{ borderTop: '1px solid var(--color-outline-variant)' }}>
                              <td style={{ padding: '0.5rem 0.75rem' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{line.item_name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-variant)' }}>{line.item_code}</div>
                              </td>
                              <td style={{ padding: '0.5rem', fontSize: '0.8125rem' }}>{line.uom_name}</td>
                              <td style={{ padding: '0.5rem', fontSize: '0.8125rem' }} className="numeric">{Number(line.quantity)}</td>
                              <td style={{ padding: '0.5rem' }}>
                                <input
                                  className="input numeric"
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  max={Number(line.quantity)}
                                  style={{ width: 90, fontSize: '0.8125rem' }}
                                  value={returnLines[idx]?.quantity || 0}
                                  onChange={e => {
                                    const newLines = [...returnLines];
                                    newLines[idx] = { ...newLines[idx], quantity: parseFloat(e.target.value) || 0 };
                                    setReturnLines(newLines);
                                  }}
                                />
                              </td>
                              <td style={{ padding: '0.5rem', fontSize: '0.8125rem' }} className="numeric">
                                {Number(line.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <div style={{ padding: '0.75rem 1rem', background: 'var(--color-surface-container)', borderRadius: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-on-surface-variant)', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-primary)' }}>info</span>
                سيتم استعادة الكميات في المخزون وإنشاء قيد محاسبي تلقائي عند الحفظ
              </div>

              {mutation.isError && (
                <div style={{ color: 'red', padding: '0.75rem', background: '#ffeeee', borderRadius: '0.5rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  <strong>خطأ: </strong>{(mutation.error as any)?.response?.data?.message || 'حدث خطأ'}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={mutation.isPending || !selectedInvoiceId || returnLines.every(l => l.quantity <= 0)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>assignment_return</span>
                  {mutation.isPending ? 'جاري الحفظ...' : 'حفظ المرتجع'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
