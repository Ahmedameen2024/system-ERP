import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

interface InventoryTransaction {
  id: string;
  transaction_number: string;
  transaction_date: string;
  transaction_type: string;
  warehouse_id: string;
  description: string;
  status: string;
  created_at: string;
}

interface Item { id: string; code: string; name_ar: string; uom_id: string; uom_name: string; cost_price: string; }
interface Warehouse { id: string; code: string; name_ar: string; }
interface UOM { id: string; code: string; name_ar: string; }

interface TransactionLine {
  itemId: string;
  uomId: string;
  quantity: number;
  unitCost: number;
  batchNumber: string;
  expiryDate: string;
}

const TRANSACTION_TYPES: Record<string, { labelAr: string; colorClass: string; needsTarget: boolean; hasFinancialImpact: boolean; }> = {
  Receipt:    { labelAr: 'استلام مشتريات',    colorClass: 'chip-success',  needsTarget: false, hasFinancialImpact: true },
  Issue:      { labelAr: 'صرف مخزون',          colorClass: 'chip-error',    needsTarget: false, hasFinancialImpact: true },
  Transfer:   { labelAr: 'تحويل بين مستودعات', colorClass: 'chip-info',     needsTarget: true,  hasFinancialImpact: false },
  Adjustment: { labelAr: 'تسوية مخزون',         colorClass: 'chip-neutral',  needsTarget: false, hasFinancialImpact: true },
  Opening:    { labelAr: 'رصيد افتتاحي',        colorClass: 'chip-info',     needsTarget: false, hasFinancialImpact: true },
};

const EMPTY_LINE: TransactionLine = { itemId: '', uomId: '', quantity: 1, unitCost: 0, batchNumber: '', expiryDate: '' };

export default function InventoryTransactions() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [form, setForm] = useState({
    transactionDate: new Date().toISOString().split('T')[0],
    transactionType: 'Receipt',
    warehouseId: '',
    targetWarehouseId: '',
    referenceType: '',
    description: '',
    lines: [{ ...EMPTY_LINE }],
  });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['inventory-transactions'],
    queryFn: async () => {
      const res = await api.get('/inventory/transactions');
      return res.data.data as InventoryTransaction[];
    },
    initialData: [],
  });

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: async () => { const r = await api.get('/inventory/items'); return r.data.data as Item[]; },
    initialData: [],
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => { const r = await api.get('/inventory/warehouses'); return r.data.data as Warehouse[]; },
    initialData: [],
  });

  const { data: uoms = [] } = useQuery({
    queryKey: ['uoms'],
    queryFn: async () => { const r = await api.get('/inventory/uoms'); return r.data.data as UOM[]; },
    initialData: [],
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => api.post('/inventory/transactions', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-transactions'] });
      qc.invalidateQueries({ queryKey: ['inventory-balances'] });
      setShowModal(false);
    }
  });

  const openNew = () => {
    setForm({
      transactionDate: new Date().toISOString().split('T')[0],
      transactionType: 'Receipt',
      warehouseId: warehouses.length > 0 ? warehouses[0].id : '',
      targetWarehouseId: '',
      referenceType: '',
      description: '',
      lines: [{ ...EMPTY_LINE }],
    });
    setShowModal(true);
  };

  const addLine = () => setForm({ ...form, lines: [...form.lines, { ...EMPTY_LINE }] });
  const removeLine = (idx: number) => setForm({ ...form, lines: form.lines.filter((_, i) => i !== idx) });

  const updateLine = (idx: number, field: keyof TransactionLine, value: string | number) => {
    const newLines = form.lines.map((l, i) => {
      if (i !== idx) return l;
      const updated = { ...l, [field]: value };
      // Auto-fill UOM from item
      if (field === 'itemId') {
        const item = items.find(it => it.id === value);
        if (item) {
          updated.uomId = item.uom_id || '';
          updated.unitCost = Number(item.cost_price) || 0;
        }
      }
      return updated;
    });
    setForm({ ...form, lines: newLines });
  };

  const totalQty = form.lines.reduce((s, l) => s + (Number(l.quantity) || 0), 0);
  const totalValue = form.lines.reduce((s, l) => s + (Number(l.quantity) * Number(l.unitCost) || 0), 0);
  const currentTypeInfo = TRANSACTION_TYPES[form.transactionType];

  const filtered = typeFilter ? transactions.filter(t => t.transaction_type === typeFilter) : transactions;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>حركات المخزون</h1>
        <button className="btn btn-primary btn-sm" onClick={openNew}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          حركة جديدة
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <select className="input" style={{ width: 200 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">كل أنواع الحركات</option>
          {Object.entries(TRANSACTION_TYPES).map(([k, v]) => (
            <option key={k} value={k}>{v.labelAr}</option>
          ))}
        </select>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
        {Object.entries(TRANSACTION_TYPES).map(([type, info]) => {
          const count = transactions.filter(t => t.transaction_type === type).length;
          return (
            <div key={type} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>{count}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', marginTop: '0.25rem' }}>{info.labelAr}</div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>رقم الحركة</th>
                <th>التاريخ</th>
                <th>نوع الحركة</th>
                <th>المستودع</th>
                <th>البيان</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-on-surface-variant)' }}>
                    لا توجد حركات مخزنية بعد
                  </td>
                </tr>
              ) : filtered.map(t => (
                <tr key={t.id}>
                  <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.8125rem' }}>{t.transaction_number}</span></td>
                  <td className="numeric" style={{ fontSize: '0.8125rem' }}>{t.transaction_date?.split('T')[0]}</td>
                  <td>
                    <span className={`chip ${TRANSACTION_TYPES[t.transaction_type]?.colorClass || 'chip-neutral'}`}>
                      {TRANSACTION_TYPES[t.transaction_type]?.labelAr || t.transaction_type}
                    </span>
                    {TRANSACTION_TYPES[t.transaction_type]?.hasFinancialImpact && (
                      <span className="chip chip-info" style={{ marginRight: '0.25rem', fontSize: '0.65rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 11, verticalAlign: 'middle' }}>receipt_long</span>
                        قيد محاسبي
                      </span>
                    )}
                  </td>
                  <td>{warehouses.find(w => w.id === t.warehouse_id)?.name_ar || '—'}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description || '—'}</td>
                  <td>
                    <span className={`chip ${t.status === 'Posted' ? 'chip-success' : t.status === 'Void' ? 'chip-error' : 'chip-neutral'}`}>
                      {t.status === 'Posted' ? 'مرحّل' : t.status === 'Void' ? 'ملغي' : 'مسودة'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* New Transaction Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: 860, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>إنشاء حركة مخزنية جديدة</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={e => { e.preventDefault(); mutation.mutate(form); }}>
              {/* Header Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label>نوع الحركة *</label>
                  <select className="input" value={form.transactionType} onChange={e => setForm({ ...form, transactionType: e.target.value })}>
                    {Object.entries(TRANSACTION_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>{v.labelAr}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>التاريخ *</label>
                  <input className="input" type="date" value={form.transactionDate} onChange={e => setForm({ ...form, transactionDate: e.target.value })} required />
                </div>
                <div>
                  <label>المستودع {currentTypeInfo.needsTarget ? '(المصدر)' : ''} *</label>
                  <select className="input" value={form.warehouseId} onChange={e => setForm({ ...form, warehouseId: e.target.value })} required>
                    <option value="">-- اختر المستودع --</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name_ar} ({w.code})</option>)}
                  </select>
                </div>
                {currentTypeInfo.needsTarget && (
                  <div>
                    <label>المستودع الهدف *</label>
                    <select className="input" value={form.targetWarehouseId} onChange={e => setForm({ ...form, targetWarehouseId: e.target.value })} required={currentTypeInfo.needsTarget}>
                      <option value="">-- اختر المستودع --</option>
                      {warehouses.filter(w => w.id !== form.warehouseId).map(w => (
                        <option key={w.id} value={w.id}>{w.name_ar} ({w.code})</option>
                      ))}
                    </select>
                  </div>
                )}
                <div style={{ gridColumn: currentTypeInfo.needsTarget ? 'auto' : '1 / -1' }}>
                  <label>البيان / الوصف</label>
                  <input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>

              {/* Financial Impact Notice */}
              {currentTypeInfo.hasFinancialImpact && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(var(--primary-rgb), 0.08)', borderRadius: '0.5rem', borderRight: '3px solid var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: 20 }}>receipt_long</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-on-surface-variant)' }}>
                    سيتم إنشاء قيد محاسبي تلقائي لهذه الحركة في دفتر الأستاذ العام
                  </span>
                </div>
              )}
              {!currentTypeInfo.hasFinancialImpact && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(var(--success-rgb, 22,163,74), 0.06)', borderRadius: '0.5rem', borderRight: '3px solid var(--color-success, #16a34a)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-success, #16a34a)', fontSize: 20 }}>swap_horiz</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-on-surface-variant)' }}>
                    هذه الحركة لا تؤثر على المركز المالي — لن يتم إنشاء قيد محاسبي
                  </span>
                </div>
              )}

              {/* Lines Table */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>أصناف الحركة</span>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={addLine}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                    إضافة صنف
                  </button>
                </div>

                <div style={{ border: '1px solid var(--color-outline-variant)', borderRadius: '0.75rem', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--color-surface-container)' }}>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 600 }}>الصنف</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 600 }}>الوحدة</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 600 }}>الكمية</th>
                        {(form.transactionType === 'Receipt' || form.transactionType === 'Opening') && (
                          <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 600 }}>تكلفة الوحدة</th>
                        )}
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 600 }}>رقم الدفعة</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 600 }}>تاريخ الانتهاء</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.8125rem', fontWeight: 600 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.lines.map((line, idx) => (
                        <tr key={idx} style={{ borderTop: '1px solid var(--color-outline-variant)' }}>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <select
                              className="input"
                              style={{ minWidth: 200, fontSize: '0.8125rem' }}
                              value={line.itemId}
                              onChange={e => updateLine(idx, 'itemId', e.target.value)}
                              required
                            >
                              <option value="">-- اختر الصنف --</option>
                              {items.map(it => <option key={it.id} value={it.id}>{it.code} - {it.name_ar}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: '0.5rem 0.5rem' }}>
                            <select
                              className="input"
                              style={{ minWidth: 100, fontSize: '0.8125rem' }}
                              value={line.uomId}
                              onChange={e => updateLine(idx, 'uomId', e.target.value)}
                              required
                            >
                              <option value="">الوحدة</option>
                              {uoms.map(u => <option key={u.id} value={u.id}>{u.name_ar}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: '0.5rem 0.5rem' }}>
                            <input
                              className="input numeric"
                              type="number"
                              step="0.001"
                              min="0.001"
                              style={{ width: 90, fontSize: '0.8125rem' }}
                              value={line.quantity}
                              onChange={e => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)}
                              required
                            />
                          </td>
                          {(form.transactionType === 'Receipt' || form.transactionType === 'Opening') && (
                            <td style={{ padding: '0.5rem 0.5rem' }}>
                              <input
                                className="input numeric"
                                type="number"
                                step="0.0001"
                                min="0"
                                style={{ width: 110, fontSize: '0.8125rem' }}
                                value={line.unitCost}
                                onChange={e => updateLine(idx, 'unitCost', parseFloat(e.target.value) || 0)}
                              />
                            </td>
                          )}
                          <td style={{ padding: '0.5rem 0.5rem' }}>
                            <input
                              className="input"
                              style={{ width: 120, fontSize: '0.8125rem' }}
                              value={line.batchNumber}
                              onChange={e => updateLine(idx, 'batchNumber', e.target.value)}
                              placeholder="رقم الدفعة"
                            />
                          </td>
                          <td style={{ padding: '0.5rem 0.5rem' }}>
                            <input
                              className="input"
                              type="date"
                              style={{ width: 140, fontSize: '0.8125rem' }}
                              value={line.expiryDate}
                              onChange={e => updateLine(idx, 'expiryDate', e.target.value)}
                            />
                          </td>
                          <td style={{ padding: '0.5rem 0.5rem' }}>
                            {form.lines.length > 1 && (
                              <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeLine(idx)} title="حذف السطر">
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

              {/* Totals */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem', padding: '0.75rem 1rem', background: 'var(--color-surface-container)', borderRadius: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-on-surface-variant)' }}>إجمالي الكمية: </span>
                  <strong className="numeric" style={{ color: 'var(--color-primary)' }}>{totalQty.toLocaleString('en-US', { maximumFractionDigits: 3 })}</strong>
                </div>
                {(form.transactionType === 'Receipt' || form.transactionType === 'Opening') && (
                  <div>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-on-surface-variant)' }}>إجمالي القيمة: </span>
                    <strong className="numeric" style={{ color: 'var(--color-primary)' }}>{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                  </div>
                )}
              </div>

              {mutation.isError && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#ffeeee', borderRadius: '0.5rem', color: 'red', fontSize: '0.875rem' }}>
                  <strong>خطأ: </strong>{(mutation.error as any).response?.data?.message || 'حدث خطأ أثناء معالجة الحركة'}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>inventory_2</span>
                  {mutation.isPending ? 'جاري المعالجة...' : 'ترحيل الحركة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
