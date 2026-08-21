import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';

// ── Types ────────────────────────────────────────────────────────────────────
interface Currency {
  id: string;
  code: string;
  name_ar: string;
  symbol: string;
  is_default: boolean;
}

interface Supplier {
  id: string;
  code: string;
  name_ar: string;
  currency_id: string;
  currency_code: string;
  ap_account_id: string | null;
}

interface Item {
  id: string;
  code: string;
  name_ar: string;
}

interface UOM {
  id: string;
  code: string;
  name_ar: string;
}

interface InvoiceLine {
  itemId: string;
  uomId: string;
  quantity: number;
  unitCost: number;
  discountPercentage: number;
  taxRate: number;
  notes: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  supplier_name: string;
  currency_code: string;
  currency_symbol: string;
  exchange_rate: number;
  net_amount: number;
  base_currency_code?: string;
  base_currency_symbol?: string;
  status: string;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PurchaseInvoice() {
  // ── State: Lists ────────────────────────────────────────────────────────────
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [uoms, setUOMs] = useState<UOM[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name_ar: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState<string | null>(null);

  // ── State: Modal ─────────────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // ── State: Form Header ───────────────────────────────────────────────────────
  const [form, setForm] = useState({
    supplierId: '',
    warehouseId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    currencyId: '',
    exchangeRate: 1,
    vendorInvoiceNumber: '',
    notes: '',
  });

  // ── State: Lines ─────────────────────────────────────────────────────────────
  const [lines, setLines] = useState<InvoiceLine[]>([
    { itemId: '', uomId: '', quantity: 1, unitCost: 0, discountPercentage: 0, taxRate: 15, notes: '' }
  ]);

  // ── State: base currency info ─────────────────────────────────────────────────
  const [baseCurrency, setBaseCurrency] = useState<Currency | null>(null);

  // ── Load reference data ──────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, currRes, supRes, itemRes, uomRes, whRes] = await Promise.allSettled([
        api.get('/purchasing/invoices'),
        api.get('/setup/currencies'),
        api.get('/setup/suppliers'),
        api.get('/inventory/items'),
        api.get('/inventory/uoms'),
        api.get('/inventory/warehouses'),
      ]);

      if (invRes.status === 'fulfilled') setInvoices(invRes.value.data.data || []);
      if (currRes.status === 'fulfilled') {
        const currList: Currency[] = currRes.value.data.data || [];
        setCurrencies(currList);
        const defCurr = currList.find(c => c.is_default);
        if (defCurr) setBaseCurrency(defCurr);
      }
      if (supRes.status === 'fulfilled') setSuppliers(supRes.value.data.data || []);
      if (itemRes.status === 'fulfilled') setItems(itemRes.value.data.data || itemRes.value.data || []);
      if (uomRes.status === 'fulfilled') setUOMs(uomRes.value.data.data || uomRes.value.data || []);
      if (whRes.status === 'fulfilled') setWarehouses(whRes.value.data.data || whRes.value.data || []);
    } catch {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Open New Invoice modal ───────────────────────────────────────────────────
  const openNew = () => {
    setEditId(null);
    const defCurr = currencies.find(c => c.is_default) || currencies[0];
    setForm({
      supplierId: suppliers[0]?.id || '',
      warehouseId: warehouses[0]?.id || '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      currencyId: defCurr?.id || '',
      exchangeRate: 1,
      vendorInvoiceNumber: '',
      notes: '',
    });
    setLines([{ itemId: items[0]?.id || '', uomId: uoms[0]?.id || '', quantity: 1, unitCost: 0, discountPercentage: 0, taxRate: 15, notes: '' }]);
    setError('');
    setShowModal(true);
  };

  // ── Currency change handler ──────────────────────────────────────────────────
  const handleCurrencyChange = (currId: string) => {
    const curr = currencies.find(c => c.id === currId);
    const isDefault = curr?.is_default ?? false;
    setForm(f => ({
      ...f,
      currencyId: currId,
      exchangeRate: isDefault ? 1 : (f.exchangeRate <= 0 ? 1 : f.exchangeRate),
    }));
  };

  // ── Supplier change: auto-fill currency ─────────────────────────────────────
  const handleSupplierChange = (suppId: string) => {
    const supp = suppliers.find(s => s.id === suppId);
    if (supp?.currency_id) {
      const curr = currencies.find(c => c.id === supp.currency_id);
      setForm(f => ({
        ...f,
        supplierId: suppId,
        currencyId: supp.currency_id,
        exchangeRate: curr?.is_default ? 1 : f.exchangeRate,
      }));
    } else {
      setForm(f => ({ ...f, supplierId: suppId }));
    }
  };

  // ── Line helpers ─────────────────────────────────────────────────────────────
  const addLine = () =>
    setLines(l => [...l, { itemId: items[0]?.id || '', uomId: uoms[0]?.id || '', quantity: 1, unitCost: 0, discountPercentage: 0, taxRate: 15, notes: '' }]);

  const removeLine = (i: number) => setLines(l => l.filter((_, idx) => idx !== i));

  const updateLine = (i: number, field: keyof InvoiceLine, value: string | number) => {
    setLines(prev => {
      const copy = [...prev];
      (copy[i] as any)[field] = value;
      return copy;
    });
  };

  // ── Computed totals ──────────────────────────────────────────────────────────
  const subtotal = lines.reduce((s, l) => s + (Number(l.quantity) * Number(l.unitCost) * (1 - Number(l.discountPercentage) / 100)), 0);
  const taxTotal = lines.reduce((s, l) => {
    const line_subtotal = Number(l.quantity) * Number(l.unitCost) * (1 - Number(l.discountPercentage) / 100);
    return s + line_subtotal * (Number(l.taxRate) / 100);
  }, 0);
  const grandTotal = subtotal + taxTotal;
  const selectedCurrency = currencies.find(c => c.id === form.currencyId);
  const isDefaultCurrencySelected = selectedCurrency?.is_default ?? false;
  const grandTotalBase = grandTotal * Number(form.exchangeRate || 1);

  // ── Save Invoice ─────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!form.currencyId) { setError('يجب اختيار العملة'); return; }
    if (!form.supplierId) { setError('يجب اختيار المورد'); return; }
    if (!form.warehouseId) { setError('يجب اختيار المستودع'); return; }
    if (Number(form.exchangeRate) <= 0) { setError('سعر الصرف يجب أن يكون أكبر من صفر'); return; }
    const hasEmptyLines = lines.some(l => !l.itemId || Number(l.quantity) <= 0);
    if (hasEmptyLines) { setError('تأكد من تعبئة جميع بنود الفاتورة واختيار الأصناف'); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        lines: lines.map(l => ({
          itemId: l.itemId,
          uomId: l.uomId,
          quantity: Number(l.quantity),
          unitCost: Number(l.unitCost),
          discountPercentage: Number(l.discountPercentage),
          taxRate: Number(l.taxRate),
          notes: l.notes,
        })),
      };

      if (editId) {
        await api.put(`/purchasing/invoices/${editId}`, payload);
      } else {
        await api.post('/purchasing/invoices', payload);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  // ── Post Invoice ─────────────────────────────────────────────────────────────
  const handlePost = async (invoiceId: string) => {
    if (!window.confirm('هل تريد ترحيل هذه الفاتورة؟ سيتم إنشاء القيود المحاسبية وتحديث المخزون.')) return;
    setPosting(invoiceId);
    try {
      const res = await api.post(`/purchasing/invoices/${invoiceId}/post`);
      const data = res.data.data;
      const msg = data?.baseCurrencyCode && data?.exchangeRate !== 1
        ? `تم ترحيل الفاتورة ✓\n${data.netAmount?.toLocaleString()} ${data.currencyCode} × ${data.exchangeRate} = ${data.baseAmount?.toLocaleString()} ${data.baseCurrencyCode}`
        : 'تم ترحيل الفاتورة وإنشاء القيود المحاسبية بنجاح';
      alert(msg);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطأ في ترحيل الفاتورة');
    } finally {
      setPosting(null);
    }
  };

  // ── Delete Invoice ───────────────────────────────────────────────────────────
  const handleDelete = async (invoiceId: string) => {
    if (!window.confirm('هل تريد حذف هذه الفاتورة؟')) return;
    try {
      await api.delete(`/purchasing/invoices/${invoiceId}`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطأ في حذف الفاتورة');
    }
  };

  // ── Status label ─────────────────────────────────────────────────────────────
  const statusChip = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      Draft: { cls: 'chip-neutral', label: 'مسودة' },
      Approved: { cls: 'chip-info', label: 'معتمدة' },
      Posted: { cls: 'chip-success', label: 'مرحلة ومقيدة' },
      Paid: { cls: 'chip-success', label: 'مدفوعة' },
      PartiallyPaid: { cls: 'chip-warning', label: 'مدفوعة جزئياً' },
      Void: { cls: 'chip-danger', label: 'ملغاة' },
    };
    return map[status] || { cls: 'chip-neutral', label: status };
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>فواتير المشتريات</h1>
          {baseCurrency && (
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--color-on-surface-variant)' }}>
              العملة الافتراضية للنظام: <strong>{baseCurrency.name_ar} ({baseCurrency.code})</strong>
            </p>
          )}
        </div>
        <button className="btn btn-primary btn-sm" onClick={openNew} disabled={loading}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          فاتورة مشتريات جديدة
        </button>
      </div>

      {/* ── Invoices Table ────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-on-surface-variant)' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            جاري تحميل الفواتير...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>رقم الفاتورة</th>
                  <th>المورد</th>
                  <th>التاريخ</th>
                  <th>العملة</th>
                  <th style={{ textAlign: 'left' }}>المبلغ الأصلي</th>
                  {baseCurrency && <th style={{ textAlign: 'left' }}>بالعملة الأساسية</th>}
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-on-surface-variant)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: '0.5rem', opacity: 0.4 }}>receipt_long</span>
                      لا توجد فواتير مشتريات بعد
                    </td>
                  </tr>
                ) : invoices.map(inv => {
                  const { cls, label } = statusChip(inv.status);
                  const rate = Number(inv.exchange_rate || 1);
                  const isForeign = rate !== 1;
                  const baseAmt = Number(inv.net_amount) * rate;
                  const sym = inv.currency_symbol || inv.currency_code;
                  return (
                    <tr key={inv.id}>
                      <td>
                        <span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                          {inv.invoice_number}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{inv.supplier_name}</td>
                      <td className="numeric">{new Date(inv.invoice_date).toLocaleDateString('ar-SA')}</td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          background: 'var(--color-surface-container)', padding: '0.2rem 0.6rem',
                          borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700
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
                      {baseCurrency && (
                        <td className="numeric" style={{ textAlign: 'left', color: 'var(--color-on-surface-variant)', fontSize: '0.88rem' }}>
                          {isForeign
                            ? `${baseAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${baseCurrency.symbol || baseCurrency.code}`
                            : '—'
                          }
                        </td>
                      )}
                      <td>
                        <span className={`chip ${cls}`}>{label}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {/* Post Button */}
                          {['Draft', 'Approved'].includes(inv.status) && (
                            <button
                              className="btn btn-ghost btn-sm"
                              title="ترحيل الفاتورة"
                              onClick={() => handlePost(inv.id)}
                              disabled={posting === inv.id}
                            >
                              {posting === inv.id
                                ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                                : <span className="material-symbols-outlined" style={{ fontSize: 16 }}>publish</span>
                              }
                            </button>
                          )}
                          {/* Delete Button */}
                          {inv.status === 'Draft' && (
                            <button
                              className="btn btn-ghost btn-sm text-danger"
                              title="حذف الفاتورة"
                              onClick={() => handleDelete(inv.id)}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                            </button>
                          )}
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

      {/* ── Create/Edit Modal ─────────────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowModal(false)}>
          <div
            className="modal-box"
            style={{ maxWidth: '860px', width: '95vw' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                {editId ? 'تعديل فاتورة مشتريات' : 'إنشاء فاتورة مشتريات جديدة'}
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* ── Header Grid ──────────────────────────────────────────── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>

                {/* Supplier */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--color-on-surface-variant)' }}>
                    المورد *
                  </label>
                  <select
                    className="input"
                    value={form.supplierId}
                    onChange={e => handleSupplierChange(e.target.value)}
                    required
                  >
                    <option value="">— اختر المورد —</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name_ar} {s.currency_code ? `(${s.currency_code})` : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Invoice Date */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--color-on-surface-variant)' }}>
                    تاريخ الفاتورة *
                  </label>
                  <input
                    className="input"
                    type="date"
                    value={form.invoiceDate}
                    onChange={e => setForm(f => ({ ...f, invoiceDate: e.target.value }))}
                    required
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--color-on-surface-variant)' }}>
                    تاريخ الاستحقاق
                  </label>
                  <input
                    className="input"
                    type="date"
                    value={form.dueDate}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  />
                </div>

                {/* Warehouse */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--color-on-surface-variant)' }}>
                    المستودع *
                  </label>
                  <select
                    className="input"
                    value={form.warehouseId}
                    onChange={e => setForm(f => ({ ...f, warehouseId: e.target.value }))}
                    required
                  >
                    <option value="">— اختر المستودع —</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name_ar}</option>
                    ))}
                  </select>
                </div>

                {/* Currency */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--color-on-surface-variant)' }}>
                    العملة *
                  </label>
                  <select
                    className="input"
                    value={form.currencyId}
                    onChange={e => handleCurrencyChange(e.target.value)}
                    required
                  >
                    <option value="">— اختر العملة —</option>
                    {currencies.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name_ar}{c.is_default ? ' (افتراضية)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Exchange Rate */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--color-on-surface-variant)' }}>
                    سعر الصرف *
                    {isDefaultCurrencySelected && (
                      <span style={{ fontWeight: 400, marginRight: '0.4rem', color: 'var(--color-tertiary, #046a67)' }}>
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
                    onChange={e => setForm(f => ({ ...f, exchangeRate: parseFloat(e.target.value) || 1 }))}
                    readOnly={isDefaultCurrencySelected}
                    style={{ background: isDefaultCurrencySelected ? 'var(--color-surface-container)' : undefined }}
                    required
                  />
                </div>

                {/* Vendor Invoice No. */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--color-on-surface-variant)' }}>
                    رقم فاتورة المورد
                  </label>
                  <input
                    className="input"
                    type="text"
                    placeholder="اختياري"
                    value={form.vendorInvoiceNumber}
                    onChange={e => setForm(f => ({ ...f, vendorInvoiceNumber: e.target.value }))}
                  />
                </div>
              </div>

              {/* ── Currency Info Banner ──────────────────────────────────── */}
              {selectedCurrency && !isDefaultCurrencySelected && baseCurrency && (
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
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>currency_exchange</span>
                  <span>
                    الفاتورة بعملة <strong>{selectedCurrency.name_ar} ({selectedCurrency.code})</strong>
                    {' — '}سعر الصرف: <strong>1 {selectedCurrency.code} = {form.exchangeRate} {baseCurrency.code}</strong>
                    {grandTotal > 0 && (
                      <> — الإجمالي: <strong>{grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} {selectedCurrency.symbol || selectedCurrency.code}</strong>
                        {' = '}
                        <strong>{grandTotalBase.toLocaleString('en-US', { minimumFractionDigits: 2 })} {baseCurrency.symbol || baseCurrency.code}</strong>
                      </>
                    )}
                  </span>
                </div>
              )}

              {/* ── Invoice Lines ─────────────────────────────────────────── */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 800, margin: 0 }}>
                    بنود الفاتورة
                    {selectedCurrency && (
                      <span style={{ fontWeight: 400, marginRight: '0.5rem', color: 'var(--color-on-surface-variant)' }}>
                        (الأسعار بـ {selectedCurrency.code})
                      </span>
                    )}
                  </h4>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>
                    إضافة صنف
                  </button>
                </div>

                <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--color-outline-variant)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                    <thead>
                      <tr style={{ background: 'var(--color-surface-container)', borderBottom: '1px solid var(--color-outline-variant)' }}>
                        <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 700 }}>الصنف *</th>
                        <th style={{ width: '100px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 700 }}>الوحدة</th>
                        <th style={{ width: '90px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 700 }}>الكمية *</th>
                        <th style={{ width: '110px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 700 }}>
                          سعر التكلفة {selectedCurrency ? `(${selectedCurrency.code})` : ''} *
                        </th>
                        <th style={{ width: '80px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 700 }}>خصم%</th>
                        <th style={{ width: '75px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 700 }}>ضريبة%</th>
                        <th style={{ width: '110px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 700, textAlign: 'left' }}>الإجمالي</th>
                        <th style={{ width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((l, i) => {
                        const gross = Number(l.quantity) * Number(l.unitCost);
                        const after_disc = gross * (1 - Number(l.discountPercentage) / 100);
                        const line_total = after_disc * (1 + Number(l.taxRate) / 100);
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid var(--color-surface-container)' }}>
                            <td style={{ padding: '0.4rem 0.5rem' }}>
                              <select
                                className="input"
                                style={{ fontSize: '0.85rem' }}
                                value={l.itemId}
                                onChange={e => updateLine(i, 'itemId', e.target.value)}
                                required
                              >
                                <option value="">— اختر الصنف —</option>
                                {items.map(it => <option key={it.id} value={it.id}>{it.name_ar}</option>)}
                              </select>
                            </td>
                            <td style={{ padding: '0.4rem 0.5rem' }}>
                              <select
                                className="input"
                                style={{ fontSize: '0.85rem' }}
                                value={l.uomId}
                                onChange={e => updateLine(i, 'uomId', e.target.value)}
                              >
                                <option value="">— وحدة —</option>
                                {uoms.map(u => <option key={u.id} value={u.id}>{u.name_ar}</option>)}
                              </select>
                            </td>
                            <td style={{ padding: '0.4rem 0.5rem' }}>
                              <input className="input numeric" type="number" min="0.001" step="0.001" value={l.quantity}
                                onChange={e => updateLine(i, 'quantity', parseFloat(e.target.value) || 0)} required />
                            </td>
                            <td style={{ padding: '0.4rem 0.5rem' }}>
                              <input className="input numeric" type="number" min="0" step="0.01" value={l.unitCost}
                                onChange={e => updateLine(i, 'unitCost', parseFloat(e.target.value) || 0)} required />
                            </td>
                            <td style={{ padding: '0.4rem 0.5rem' }}>
                              <input className="input numeric" type="number" min="0" max="100" step="0.01" value={l.discountPercentage}
                                onChange={e => updateLine(i, 'discountPercentage', parseFloat(e.target.value) || 0)} />
                            </td>
                            <td style={{ padding: '0.4rem 0.5rem' }}>
                              <input className="input numeric" type="number" min="0" max="100" step="0.01" value={l.taxRate}
                                onChange={e => updateLine(i, 'taxRate', parseFloat(e.target.value) || 0)} />
                            </td>
                            <td style={{ padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: 700, fontSize: '0.88rem' }}>
                              {line_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '0.4rem 0.25rem', textAlign: 'center' }}>
                              {lines.length > 1 && (
                                <button type="button" className="btn btn-ghost btn-sm text-danger"
                                  onClick={() => removeLine(i)} title="حذف البند">
                                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Totals Summary ────────────────────────────────────────── */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{
                  background: 'var(--color-surface-container)',
                  borderRadius: '12px',
                  padding: '1rem 1.5rem',
                  minWidth: '280px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--color-on-surface-variant)' }}>
                    <span>المجموع قبل الضريبة:</span>
                    <span className="numeric">{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} {selectedCurrency?.symbol || selectedCurrency?.code || ''}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--color-on-surface-variant)' }}>
                    <span>الضريبة:</span>
                    <span className="numeric">{taxTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} {selectedCurrency?.symbol || selectedCurrency?.code || ''}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 900, borderTop: '2px solid var(--color-outline-variant)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                    <span>الإجمالي الكلي:</span>
                    <span className="numeric" style={{ color: 'var(--color-primary)' }}>
                      {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} {selectedCurrency?.symbol || selectedCurrency?.code || ''}
                    </span>
                  </div>
                  {!isDefaultCurrencySelected && baseCurrency && grandTotal > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-on-surface-variant)', background: 'var(--color-surface-container-high)', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                      <span>بالعملة الأساسية ({baseCurrency.code}):</span>
                      <span className="numeric" style={{ fontWeight: 700 }}>
                        {grandTotalBase.toLocaleString('en-US', { minimumFractionDigits: 2 })} {baseCurrency.symbol || baseCurrency.code}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Notes ────────────────────────────────────────────────── */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--color-on-surface-variant)' }}>
                  ملاحظات
                </label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="ملاحظات اختيارية..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* ── Actions ──────────────────────────────────────────────── */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-outline-variant)', paddingTop: '1rem', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)} disabled={saving}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving
                    ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> جاري الحفظ...</>
                    : <><span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span> حفظ الفاتورة</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
