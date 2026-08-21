import { useState, useEffect } from 'react';
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
  itemName?: string;
  uomName?: string;
}

interface Customer {
  id: string;
  code: string;
  name_ar: string;
  payment_terms: number;
  currency_id?: string;
  currency_code?: string;
}

interface Currency {
  id: string;
  code: string;
  name_ar: string;
  symbol: string;
  is_default: boolean;
}

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
  const [errorMessage, setErrorMessage] = useState('');

  // ── Reference Queries ───────────────────────────────────────────────
  const { data: currencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => { const r = await api.get('/setup/currencies'); return r.data.data as Currency[]; },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => { const r = await api.get('/sales/customers'); return r.data.data as Customer[]; },
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => { const r = await api.get('/inventory/warehouses'); return r.data.data as Warehouse[]; },
  });

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: async () => { const r = await api.get('/inventory/items'); return r.data.data as Item[]; },
  });

  const { data: uoms = [] } = useQuery({
    queryKey: ['uoms'],
    queryFn: async () => { const r = await api.get('/inventory/uoms'); return r.data.data as UOM[]; },
  });

  const baseCurrency = currencies.find(c => c.is_default);

  // Set default currency when currencies load if none selected
  useEffect(() => {
    if (!form.currencyId && baseCurrency) {
      setForm(f => ({ ...f, currencyId: baseCurrency.id, exchangeRate: 1 }));
    }
  }, [currencies, baseCurrency, form.currencyId]);

  // Handle Currency Selection
  const handleCurrencyChange = (currId: string) => {
    const selected = currencies.find(c => c.id === currId);
    const isDef = selected?.is_default ?? false;
    setForm(f => ({
      ...f,
      currencyId: currId,
      exchangeRate: isDef ? 1 : (f.exchangeRate <= 0 ? 1 : f.exchangeRate),
    }));
  };

  // When customer changes, auto-set due date and auto-select customer's currency
  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      const due = new Date();
      due.setDate(due.getDate() + (customer.payment_terms || 30));

      let newCurrencyId = form.currencyId;
      let newExchangeRate = form.exchangeRate;

      if (customer.currency_id) {
        newCurrencyId = customer.currency_id;
        const custCurr = currencies.find(c => c.id === customer.currency_id);
        if (custCurr?.is_default) {
          newExchangeRate = 1;
        }
      }

      setForm({
        ...form,
        customerId,
        dueDate: due.toISOString().split('T')[0],
        currencyId: newCurrencyId,
        exchangeRate: newExchangeRate,
      });
    } else {
      setForm({ ...form, customerId });
    }
  };

  const selectedCurrency = currencies.find(c => c.id === form.currencyId);
  const isDefaultCurrency = selectedCurrency?.is_default ?? false;

  // ── Line Updates ───────────────────────────────────────────────────
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

  // ── Calculations ───────────────────────────────────────────────────
  const calcLineSubtotal = (line: InvoiceLine) => {
    const gross = Number(line.quantity) * Number(line.unitPrice);
    return gross - (gross * (Number(line.discountPercentage) / 100));
  };
  const calcLineTax = (line: InvoiceLine) => calcLineSubtotal(line) * (Number(line.taxRate) / 100);
  const calcLineTotal = (line: InvoiceLine) => calcLineSubtotal(line) + calcLineTax(line);

  const subtotal = form.lines.reduce((s, l) => s + calcLineSubtotal(l), 0);
  const totalTax = form.lines.reduce((s, l) => s + calcLineTax(l), 0);
  const netAmount = subtotal + totalTax;
  const netAmountBase = netAmount * Number(form.exchangeRate || 1);

  // ── Mutations ──────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      setErrorMessage('');
      // Client-side validations
      if (!form.customerId) throw new Error('يرجى اختيار العميل');
      if (!form.warehouseId) throw new Error('يرجى اختيار المستودع');
      if (!form.currencyId) throw new Error('يرجى اختيار العملة');
      if (Number(form.exchangeRate) <= 0) throw new Error('سعر الصرف يجب أن يكون أكبر من صفر');
      if (!form.lines || form.lines.length === 0 || form.lines.some(l => !l.itemId || Number(l.quantity) <= 0)) {
        throw new Error('يرجى التأكد من تعبئة جميع بنود الفاتورة واختيار الأصناف');
      }
      return api.post('/sales/invoices', form);
    },
    onSuccess: (res) => {
      setSavedInvoiceId(res.data.data.id);
      qc.invalidateQueries({ queryKey: ['sales-invoices'] });
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || err.message || 'حدث خطأ أثناء حفظ الفاتورة');
    }
  });

  const postMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/sales/invoices/${id}/post`),
    onSuccess: () => {
      setPostSuccess(true);
      qc.invalidateQueries({ queryKey: ['sales-invoices'] });
      qc.invalidateQueries({ queryKey: ['inventory-balances'] });
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'خطأ في ترحيل الفاتورة');
    }
  });

  if (postSuccess) {
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', minHeight: 400 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(22,163,74,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#16a34a' }}>check_circle</span>
        </div>
        <h2 style={{ fontWeight: 800, margin: 0 }}>تم ترحيل الفاتورة بنجاح!</h2>
        <p style={{ color: 'var(--color-on-surface-variant)', textAlign: 'center', maxWidth: 460 }}>
          تم خصم الكمية من المخزون وإنشاء القيود المحاسبية بالعملة الأساسية وتحديث رصيد العميل بنجاح
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/sales')}>العودة لقائمة الفواتير</button>
          <button className="btn btn-primary" onClick={() => {
            setSavedInvoiceId(null);
            setPostSuccess(false);
            setForm({
              ...form,
              lines: [{ ...EMPTY_LINE }],
              currencyId: baseCurrency?.id || '',
              exchangeRate: 1,
            });
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            فاتورة جديدة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>إنشاء فاتورة مبيعات</h1>
          {baseCurrency && (
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--color-on-surface-variant)' }}>
              العملة الافتراضية للنظام: <strong>{baseCurrency.name_ar} ({baseCurrency.code})</strong>
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ padding: '0.375rem 0.75rem', background: 'var(--color-surface-container)', borderRadius: '0.5rem', fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle', marginLeft: '0.25rem' }}>receipt_long</span>
            سيتم إنشاء القيود المحاسبية وتحديث المخزون عند الترحيل
          </div>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* ── Header Grid ────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {/* Customer */}
          <div>
            <label>العميل *</label>
            <select className="input" value={form.customerId} onChange={e => handleCustomerChange(e.target.value)} required>
              <option value="">-- اختر العميل --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name_ar} {c.currency_code ? `(${c.currency_code})` : ''}</option>)}
            </select>
          </div>

          {/* Warehouse */}
          <div>
            <label>المستودع *</label>
            <select className="input" value={form.warehouseId} onChange={e => setForm({ ...form, warehouseId: e.target.value })} required>
              <option value="">-- اختر المستودع --</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name_ar}</option>)}
            </select>
          </div>

          {/* Invoice Date */}
          <div>
            <label>تاريخ الفاتورة *</label>
            <input className="input" type="date" value={form.invoiceDate} onChange={e => setForm({ ...form, invoiceDate: e.target.value })} required />
          </div>

          {/* Due Date */}
          <div>
            <label>تاريخ الاستحقاق</label>
            <input className="input" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          </div>

          {/* Currency */}
          <div>
            <label>العملة *</label>
            <select className="input" value={form.currencyId} onChange={e => handleCurrencyChange(e.target.value)} required>
              <option value="">-- اختر العملة --</option>
              {currencies.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name_ar}{c.is_default ? ' (افتراضية)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Exchange Rate */}
          <div>
            <label>
              سعر الصرف *
              {isDefaultCurrency && (
                <span style={{ fontWeight: 400, marginRight: '0.4rem', color: 'var(--color-primary)' }}>
                  (عملة افتراضية = 1)
                </span>
              )}
            </label>
            <input
              className="input numeric"
              type="number"
              step="0.0001"
              min="0.0001"
              value={form.exchangeRate}
              onChange={e => setForm({ ...form, exchangeRate: parseFloat(e.target.value) || 1 })}
              readOnly={isDefaultCurrency}
              style={{ background: isDefaultCurrency ? 'var(--color-surface-container)' : undefined }}
              required
            />
          </div>
        </div>

        {/* ── Currency Info Banner ──────────────────────────────────── */}
        {selectedCurrency && !isDefaultCurrency && baseCurrency && (
          <div style={{
            background: 'var(--color-primary-container, #e6f4f1)',
            border: '1px solid var(--color-primary, #046a67)',
            borderRadius: '10px',
            padding: '0.65rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.88rem',
            color: 'var(--color-on-primary-container, #022e2c)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>currency_exchange</span>
            <span>
              الفاتورة بعملة <strong>{selectedCurrency.name_ar} ({selectedCurrency.code})</strong>
              {' — '}سعر الصرف: <strong>1 {selectedCurrency.code} = {form.exchangeRate} {baseCurrency.code}</strong>
              {netAmount > 0 && (
                <>
                  {' — '}الإجمالي: <strong>{netAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {selectedCurrency.symbol || selectedCurrency.code}</strong>
                  {' = '}
                  <strong>{netAmountBase.toLocaleString('en-US', { minimumFractionDigits: 2 })} {baseCurrency.symbol || baseCurrency.code}</strong>
                </>
              )}
            </span>
          </div>
        )}

        {/* Notes */}
        <div>
          <label>ملاحظات / بيان الفاتورة</label>
          <input className="input" placeholder="ملاحظات اختيارية..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>

        {/* ── Lines Section ─────────────────────────────────────────── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--color-primary)' }}>
              أصناف الفاتورة
              {selectedCurrency && (
                <span style={{ fontWeight: 400, marginRight: '0.5rem', fontSize: '0.85rem', color: 'var(--color-on-surface-variant)' }}>
                  (الأسعار بـ {selectedCurrency.code})
                </span>
              )}
            </h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={addLine}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span> إضافة صنف
            </button>
          </div>

          <div style={{ border: '1px solid var(--color-outline-variant)', borderRadius: '0.75rem', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                <thead>
                  <tr style={{ background: 'var(--color-surface-container)' }}>
                    <th style={{ padding: '0.625rem 0.75rem', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 600, width: '28%' }}>الصنف *</th>
                    <th style={{ padding: '0.625rem 0.5rem', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 600, width: '10%' }}>الوحدة</th>
                    <th style={{ padding: '0.625rem 0.5rem', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 600, width: '10%' }}>الكمية *</th>
                    <th style={{ padding: '0.625rem 0.5rem', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 600, width: '14%' }}>
                      سعر الوحدة {selectedCurrency ? `(${selectedCurrency.code})` : ''} *
                    </th>
                    <th style={{ padding: '0.625rem 0.5rem', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 600, width: '9%' }}>خصم %</th>
                    <th style={{ padding: '0.625rem 0.5rem', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 600, width: '9%' }}>VAT %</th>
                    <th style={{ padding: '0.625rem 0.5rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, width: '14%' }}>الإجمالي</th>
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
                          min="0"
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
                      <td style={{ padding: '0.25rem', textAlign: 'center' }}>
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
        </div>

        {/* ── Summary Block ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <div style={{ minWidth: 320, maxWidth: 400, display: 'flex', flexDirection: 'column', gap: '0.65rem', background: 'var(--color-surface-container-low)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--color-outline-variant)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span>الإجمالي قبل الضريبة:</span>
              <span className="numeric">{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} {selectedCurrency?.symbol || selectedCurrency?.code || ''}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span>ضريبة القيمة المضافة (VAT):</span>
              <span className="numeric">{totalTax.toLocaleString('en-US', { minimumFractionDigits: 2 })} {selectedCurrency?.symbol || selectedCurrency?.code || ''}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, borderTop: '2px solid var(--color-outline-variant)', paddingTop: '0.65rem', color: 'var(--color-primary)' }}>
              <span>الإجمالي النهائي:</span>
              <span className="numeric">{netAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {selectedCurrency?.symbol || selectedCurrency?.code || ''}</span>
            </div>
            {!isDefaultCurrency && baseCurrency && netAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-on-surface-variant)', background: 'var(--color-surface-container-high)', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                <span>بالعملة الأساسية ({baseCurrency.code}):</span>
                <span className="numeric" style={{ fontWeight: 700 }}>
                  {netAmountBase.toLocaleString('en-US', { minimumFractionDigits: 2 })} {baseCurrency.symbol || baseCurrency.code}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Errors */}
        {(errorMessage || saveMutation.isError || postMutation.isError) && (
          <div style={{ color: 'red', padding: '0.75rem', background: '#ffeeee', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
            <strong>خطأ: </strong>
            {errorMessage || ((saveMutation.error || postMutation.error) as any)?.response?.data?.message || 'حدث خطأ غير متوقع'}
          </div>
        )}

        {/* ── Actions ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-outline-variant)', paddingTop: '1.25rem', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/sales')}>إلغاء</button>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {/* Step 1: Save as Draft */}
            {!savedInvoiceId && (
              <button
                type="button"
                className="btn btn-secondary"
                disabled={saveMutation.isPending || !form.customerId || !form.warehouseId || !form.currencyId}
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
