import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

interface InvoiceLine {
  itemId: string;
  uomId: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  taxRate: number;
  notes: string;
  // computed display
  itemName?: string;
  uomName?: string;
}

interface Customer { id: string; code: string; name_ar: string; payment_terms: number; }
interface Warehouse { id: string; code: string; name_ar: string; }
interface Item { id: string; code: string; name_ar: string; selling_price: string; uom_id: string; uom_name: string; }
interface UOM { id: string; code: string; name_ar: string; }

const EMPTY_LINE: InvoiceLine = { itemId: '', uomId: '', quantity: 1, unitPrice: 0, discountPercentage: 0, taxRate: 15, notes: '' };

export default function SalesInvoice() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    customerId: '',
    warehouseId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    currencyId: '',
    exchangeRate: 1,
    salesRepId: '',
    paymentMethodId: '',
    notes: '',
    lines: [{ ...EMPTY_LINE }] as InvoiceLine[],
  });

  const [savedInvoiceId, setSavedInvoiceId] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState(false);

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => { const r = await api.get('/sales/customers'); return r.data.data as Customer[]; },
    initialData: [],
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => { const r = await api.get('/inventory/warehouses'); return r.data.data as Warehouse[]; },
    initialData: [],
  });

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: async () => { const r = await api.get('/inventory/items'); return r.data.data as Item[]; },
    initialData: [],
  });

  const { data: uoms = [] } = useQuery({
    queryKey: ['uoms'],
    queryFn: async () => { const r = await api.get('/inventory/uoms'); return r.data.data as UOM[]; },
    initialData: [],
  });

  const saveMutation = useMutation({
    mutationFn: async () => api.post('/sales/invoices', form),
    onSuccess: (res) => {
      setSavedInvoiceId(res.data.data.id);
      qc.invalidateQueries({ queryKey: ['sales-invoices'] });
    }
  });

  const postMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/sales/invoices/${id}/post`),
    onSuccess: () => {
      setPostSuccess(true);
      qc.invalidateQueries({ queryKey: ['sales-invoices'] });
      qc.invalidateQueries({ queryKey: ['inventory-balances'] });
    }
  });

  const updateLine = (idx: number, field: keyof InvoiceLine, value: string | number) => {
    const newLines = form.lines.map((l, i) => {
      if (i !== idx) return l;
      const updated = { ...l, [field]: value };
      if (field === 'itemId') {
        const item = items.find(it => it.id === value);
        if (item) {
          updated.unitPrice = Number(item.selling_price) || 0;
          updated.uomId = item.uom_id || '';
          updated.itemName = item.name_ar;
          updated.uomName = item.uom_name;
        }
      }
      return updated;
    });
    setForm({ ...form, lines: newLines });
  };

  const addLine = () => setForm({ ...form, lines: [...form.lines, { ...EMPTY_LINE }] });
  const removeLine = (idx: number) => setForm({ ...form, lines: form.lines.filter((_, i) => i !== idx) });

  // When customer changes, auto-set due date based on payment terms
  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      const due = new Date();
      due.setDate(due.getDate() + (customer.payment_terms || 30));
      setForm({ ...form, customerId, dueDate: due.toISOString().split('T')[0] });
    } else {
      setForm({ ...form, customerId });
    }
  };

  // Calculations
  const calcLineSubtotal = (line: InvoiceLine) => {
    const gross = Number(line.quantity) * Number(line.unitPrice);
    return gross - (gross * (Number(line.discountPercentage) / 100));
  };
  const calcLineTax = (line: InvoiceLine) => calcLineSubtotal(line) * (Number(line.taxRate) / 100);
  const calcLineTotal = (line: InvoiceLine) => calcLineSubtotal(line) + calcLineTax(line);

  const subtotal = form.lines.reduce((s, l) => s + calcLineSubtotal(l), 0);
  const totalTax = form.lines.reduce((s, l) => s + calcLineTax(l), 0);
  const netAmount = subtotal + totalTax;

  if (postSuccess) {
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', minHeight: 400 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(22,163,74,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#16a34a' }}>check_circle</span>
        </div>
        <h2 style={{ fontWeight: 800, margin: 0 }}>تم ترحيل الفاتورة بنجاح!</h2>
        <p style={{ color: 'var(--color-on-surface-variant)', textAlign: 'center' }}>
          تم خصم الكمية من المخزون وإنشاء القيود المحاسبية (إيرادات + تكلفة البضاعة المباعة) تلقائياً
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/sales')}>العودة للمبيعات</button>
          <button className="btn btn-primary" onClick={() => { setSavedInvoiceId(null); setPostSuccess(false); setForm({ ...form, lines: [{ ...EMPTY_LINE }] }); }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            فاتورة جديدة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>إنشاء فاتورة مبيعات</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ padding: '0.375rem 0.75rem', background: 'var(--color-surface-container)', borderRadius: '0.5rem', fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle', marginLeft: '0.25rem' }}>receipt_long</span>
            سيتم إنشاء قيود محاسبية وتحديث المخزون عند الترحيل
          </div>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Header Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div>
            <label>العميل *</label>
            <select className="input" value={form.customerId} onChange={e => handleCustomerChange(e.target.value)} required>
              <option value="">-- اختر العميل --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
            </select>
          </div>
          <div>
            <label>المستودع *</label>
            <select className="input" value={form.warehouseId} onChange={e => setForm({ ...form, warehouseId: e.target.value })} required>
              <option value="">-- اختر المستودع --</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name_ar}</option>)}
            </select>
          </div>
          <div>
            <label>تاريخ الفاتورة *</label>
            <input className="input" type="date" value={form.invoiceDate} onChange={e => setForm({ ...form, invoiceDate: e.target.value })} required />
          </div>
          <div>
            <label>تاريخ الاستحقاق</label>
            <input className="input" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label>ملاحظات / بيان الفاتورة</label>
          <input className="input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>

        {/* Lines */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--color-primary)' }}>أصناف الفاتورة</h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={addLine}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span> إضافة صنف
            </button>
          </div>

          <div style={{ border: '1px solid var(--color-outline-variant)', borderRadius: '0.75rem', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-container)' }}>
                  <th style={{ padding: '0.625rem 0.75rem', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 600, width: '30%' }}>الصنف</th>
                  <th style={{ padding: '0.625rem 0.5rem', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 600, width: '10%' }}>الوحدة</th>
                  <th style={{ padding: '0.625rem 0.5rem', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 600, width: '10%' }}>الكمية</th>
                  <th style={{ padding: '0.625rem 0.5rem', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 600, width: '12%' }}>سعر الوحدة</th>
                  <th style={{ padding: '0.625rem 0.5rem', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 600, width: '8%' }}>خصم %</th>
                  <th style={{ padding: '0.625rem 0.5rem', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 600, width: '8%' }}>VAT %</th>
                  <th style={{ padding: '0.625rem 0.5rem', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 600, width: '12%' }}>الإجمالي</th>
                  <th style={{ width: '4%' }}></th>
                </tr>
              </thead>
              <tbody>
                {form.lines.map((line, idx) => (
                  <tr key={idx} style={{ borderTop: '1px solid var(--color-outline-variant)' }}>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <select
                        className="input"
                        style={{ fontSize: '0.8125rem' }}
                        value={line.itemId}
                        onChange={e => updateLine(idx, 'itemId', e.target.value)}
                        required
                      >
                        <option value="">-- اختر الصنف --</option>
                        {items.map(it => <option key={it.id} value={it.id}>{it.code} - {it.name_ar}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem' }}>
                      <select
                        className="input"
                        style={{ fontSize: '0.8125rem' }}
                        value={line.uomId}
                        onChange={e => updateLine(idx, 'uomId', e.target.value)}
                      >
                        <option value="">الوحدة</option>
                        {uoms.map(u => <option key={u.id} value={u.id}>{u.name_ar}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem' }}>
                      <input
                        className="input numeric"
                        type="number"
                        step="0.001"
                        min="0.001"
                        style={{ fontSize: '0.8125rem' }}
                        value={line.quantity}
                        onChange={e => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem' }}>
                      <input
                        className="input numeric"
                        type="number"
                        step="0.0001"
                        style={{ fontSize: '0.8125rem' }}
                        value={line.unitPrice}
                        onChange={e => updateLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem' }}>
                      <input
                        className="input numeric"
                        type="number"
                        min="0"
                        max="100"
                        style={{ fontSize: '0.8125rem' }}
                        value={line.discountPercentage}
                        onChange={e => updateLine(idx, 'discountPercentage', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem' }}>
                      <select
                        className="input"
                        style={{ fontSize: '0.8125rem' }}
                        value={line.taxRate}
                        onChange={e => updateLine(idx, 'taxRate', parseFloat(e.target.value))}
                      >
                        <option value={15}>15%</option>
                        <option value={5}>5%</option>
                        <option value={0}>0%</option>
                      </select>
                    </td>
                    <td style={{ padding: '0.5rem 0.5rem', fontWeight: 700, fontSize: '0.8125rem', textAlign: 'left' }} className="numeric">
                      {calcLineTotal(line).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '0.25rem' }}>
                      {form.lines.length > 1 && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeLine(idx)}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-error)' }}>delete</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <div style={{ width: 340, display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--color-surface-container-low)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--color-outline-variant)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span>الإجمالي قبل الضريبة</span>
              <span className="numeric">{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span>ضريبة القيمة المضافة (VAT)</span>
              <span className="numeric">{totalTax.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 800, borderTop: '1px solid var(--color-outline-variant)', paddingTop: '0.75rem', color: 'var(--color-primary)' }}>
              <span>الإجمالي النهائي</span>
              <span className="numeric">{netAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</span>
            </div>
          </div>
        </div>

        {/* Errors */}
        {(saveMutation.isError || postMutation.isError) && (
          <div style={{ color: 'red', padding: '0.75rem', background: '#ffeeee', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
            <strong>خطأ: </strong>
            {((saveMutation.error || postMutation.error) as any)?.response?.data?.message || 'حدث خطأ غير متوقع'}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-outline-variant)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/sales')}>إلغاء</button>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {/* Step 1: Save as Draft */}
            {!savedInvoiceId && (
              <button
                type="button"
                className="btn btn-secondary"
                disabled={saveMutation.isPending || !form.customerId || !form.warehouseId}
                onClick={() => saveMutation.mutate()}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
                {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ كمسودة'}
              </button>
            )}

            {/* Step 2: Post Invoice (available after save) */}
            {savedInvoiceId && !postSuccess && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(22,163,74,0.08)', borderRadius: '0.5rem', fontSize: '0.8125rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#16a34a' }}>check</span>
                  <span>تم الحفظ — الفاتورة في حالة مسودة</span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={postMutation.isPending}
                  onClick={() => postMutation.mutate(savedInvoiceId)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>send</span>
                  {postMutation.isPending ? 'جاري الترحيل...' : 'ترحيل وإنشاء القيود'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
