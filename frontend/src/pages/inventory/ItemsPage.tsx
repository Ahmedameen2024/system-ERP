import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

interface Item {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  uom_id: string | null;
  uom_name: string | null;
  category_id: string | null;
  category_name: string | null;
  cost_price: string;
  selling_price: string;
  reorder_level: string;
  barcode: string | null;
  description: string | null;
  inventory_account_id: string | null;
  cogs_account_id: string | null;
  revenue_account_id: string | null;
  tax_id: string | null;
  status: 'Active' | 'Inactive';
}

interface UOM { id: string; code: string; name_ar: string; }
interface Category { id: string; code: string; name_ar: string; }
interface GLAccount { id: string; code: string; name_ar: string; account_type: string; }

const EMPTY_FORM = {
  code: '', nameAr: '', nameEn: '', uomId: '', categoryId: '',
  costPrice: 0, sellingPrice: 0, reorderLevel: 0, barcode: '',
  description: '', inventoryAccountId: '', cogsAccountId: '', revenueAccountId: '',
  taxId: '', status: 'Active' as 'Active' | 'Inactive'
};

export default function ItemsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'accounting'>('basic');
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const res = await api.get('/inventory/items');
      return res.data.data as Item[];
    },
    initialData: [],
  });

  const { data: uoms = [] } = useQuery({
    queryKey: ['uoms'],
    queryFn: async () => { const r = await api.get('/inventory/uoms'); return r.data.data as UOM[]; },
    initialData: [],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['item-categories'],
    queryFn: async () => { const r = await api.get('/inventory/categories'); return r.data.data as Category[]; },
    initialData: [],
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['gl-accounts'],
    queryFn: async () => { const r = await api.get('/accounting/accounts'); return r.data.data as GLAccount[]; },
    initialData: [],
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (editItem) return api.put(`/inventory/items/${editItem.id}`, data);
      return api.post('/inventory/items', data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items'] });
      setShowModal(false);
      setEditItem(null);
    }
  });

  const filtered = items.filter(i =>
    i.code.toLowerCase().includes(search.toLowerCase()) ||
    i.name_ar.includes(search) ||
    (i.barcode && i.barcode.includes(search))
  );

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...EMPTY_FORM });
    setActiveTab('basic');
    setShowModal(true);
  };

  const openEdit = (item: Item) => {
    setEditItem(item);
    setForm({
      code: item.code,
      nameAr: item.name_ar,
      nameEn: item.name_en,
      uomId: item.uom_id || '',
      categoryId: item.category_id || '',
      costPrice: Number(item.cost_price) || 0,
      sellingPrice: Number(item.selling_price) || 0,
      reorderLevel: Number(item.reorder_level) || 0,
      barcode: item.barcode || '',
      description: item.description || '',
      inventoryAccountId: item.inventory_account_id || '',
      cogsAccountId: item.cogs_account_id || '',
      revenueAccountId: item.revenue_account_id || '',
      taxId: item.tax_id || '',
      status: item.status,
    });
    setActiveTab('basic');
    setShowModal(true);
  };

  const assetAccounts = accounts.filter(a => a.account_type === 'Asset');
  const expenseAccounts = accounts.filter(a => a.account_type === 'Expense');
  const revenueAccounts = accounts.filter(a => a.account_type === 'Revenue');

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>الأصناف والمنتجات (دليل المواد)</h1>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          إضافة صنف جديد
        </button>
      </div>

      <div style={{ position: 'relative', maxWidth: 420 }}>
        <span className="material-symbols-outlined" style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline)', fontSize: 18 }}>search</span>
        <input
          className="input"
          placeholder="بحث بكود، اسم أو باركود الصنف..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingRight: '2.5rem' }}
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>كود الصنف</th>
                <th>الاسم العربي</th>
                <th>التصنيف</th>
                <th>وحدة القياس</th>
                <th>الباركود</th>
                <th style={{ textAlign: 'left' }}>التكلفة</th>
                <th style={{ textAlign: 'left' }}>سعر البيع</th>
                <th style={{ textAlign: 'left' }}>حد الطلب</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-on-surface-variant)' }}>
                    لا توجد أصناف مضافة بعد
                  </td>
                </tr>
              ) : filtered.map(i => (
                <tr key={i.id}>
                  <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{i.code}</span></td>
                  <td style={{ fontWeight: 500 }}>{i.name_ar}</td>
                  <td><span className="chip chip-info">{i.category_name || '—'}</span></td>
                  <td><span className="numeric">{i.uom_name || '—'}</span></td>
                  <td className="numeric" style={{ fontSize: '0.75rem' }}>{i.barcode || '—'}</td>
                  <td className="numeric" style={{ textAlign: 'left' }}>{Number(i.cost_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="numeric" style={{ textAlign: 'left', fontWeight: 700, color: 'var(--color-primary)' }}>{Number(i.selling_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="numeric" style={{ textAlign: 'left' }}>{Number(i.reorder_level)}</td>
                  <td>
                    <span className={`chip ${i.status === 'Active' ? 'chip-success' : 'chip-neutral'}`}>
                      {i.status === 'Active' ? 'نشط' : 'متوقف'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(i)} title="تعديل">
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>
              {editItem ? 'تعديل بيانات الصنف' : 'إضافة صنف جديد'}
            </h2>

            {/* Tab Switcher */}
            <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--color-outline-variant)', marginBottom: '1.5rem' }}>
              {(['basic', 'pricing', 'accounting'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ borderRadius: '0.5rem 0.5rem 0 0' }}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'basic' ? 'البيانات الأساسية' : tab === 'pricing' ? 'التسعير والمخزون' : 'ربط الحسابات'}
                </button>
              ))}
            </div>

            <form onSubmit={e => { e.preventDefault(); mutation.mutate(form); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activeTab === 'basic' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label>كود الصنف *</label>
                    <input className="input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
                  </div>
                  <div>
                    <label>الباركود</label>
                    <input className="input numeric" value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} />
                  </div>
                  <div>
                    <label>الاسم العربي *</label>
                    <input className="input" value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} required />
                  </div>
                  <div>
                    <label>الاسم الإنجليزي *</label>
                    <input className="input" value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} required />
                  </div>
                  <div>
                    <label>وحدة القياس الأساسية *</label>
                    <select className="input" value={form.uomId} onChange={e => setForm({ ...form, uomId: e.target.value })} required>
                      <option value="">-- اختر الوحدة --</option>
                      {uoms.map(u => <option key={u.id} value={u.id}>{u.name_ar} ({u.code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label>التصنيف</label>
                    <select className="input" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                      <option value="">-- بدون تصنيف --</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name_ar} ({c.code})</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>الوصف</label>
                    <textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div>
                    <label>الحالة</label>
                    <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'Active' | 'Inactive' })}>
                      <option value="Active">نشط</option>
                      <option value="Inactive">متوقف</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'pricing' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label>تكلفة الشراء (الافتراضية)</label>
                    <input className="input numeric" type="number" step="0.0001" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label>سعر البيع المقترح</label>
                    <input className="input numeric" type="number" step="0.0001" value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label>حد إعادة الطلب (Reorder Level)</label>
                    <input className="input numeric" type="number" step="0.001" value={form.reorderLevel} onChange={e => setForm({ ...form, reorderLevel: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label>الضريبة المطبقة</label>
                    <select className="input" value={form.taxId} onChange={e => setForm({ ...form, taxId: e.target.value })}>
                      <option value="">-- بدون ضريبة --</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1', padding: '1rem', background: 'var(--color-surface-container)', borderRadius: '0.75rem' }}>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-on-surface-variant)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle', marginLeft: '0.25rem' }}>info</span>
                      التكلفة الفعلية ستُحسب تلقائياً بطريقة <strong>المتوسط المرجح المتحرك (WAC)</strong> عند إنشاء حركات الاستلام.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'accounting' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                  <div style={{ padding: '0.75rem', background: 'var(--color-primary-container)', borderRadius: '0.75rem', marginBottom: '0.5rem' }}>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-on-primary-container)', fontWeight: 600 }}>
                      ربط حسابات دفتر الأستاذ العام — سيتم استخدامها في القيود المحاسبية التلقائية
                    </p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label>حساب المخزون (Asset) *</label>
                      <select className="input" value={form.inventoryAccountId} onChange={e => setForm({ ...form, inventoryAccountId: e.target.value })}>
                        <option value="">-- اختر الحساب --</option>
                        {assetAccounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name_ar}</option>)}
                      </select>
                    </div>
                    <div>
                      <label>حساب تكلفة البضاعة المباعة (COGS)</label>
                      <select className="input" value={form.cogsAccountId} onChange={e => setForm({ ...form, cogsAccountId: e.target.value })}>
                        <option value="">-- اختر الحساب --</option>
                        {expenseAccounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name_ar}</option>)}
                      </select>
                    </div>
                    <div>
                      <label>حساب الإيرادات (Revenue)</label>
                      <select className="input" value={form.revenueAccountId} onChange={e => setForm({ ...form, revenueAccountId: e.target.value })}>
                        <option value="">-- اختر الحساب --</option>
                        {revenueAccounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name_ar}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {mutation.isError && (
                <div style={{ marginTop: '0.5rem', color: 'red', fontSize: '0.875rem', padding: '0.75rem', background: '#ffeeee', borderRadius: '0.5rem' }}>
                  <strong>خطأ: </strong>{(mutation.error as any).response?.data?.message || 'حدث خطأ أثناء الحفظ'}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-outline-variant)' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                {activeTab !== 'accounting' && (
                  <button type="button" className="btn btn-ghost" onClick={() => setActiveTab(activeTab === 'basic' ? 'pricing' : 'accounting')}>
                    التالي
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back_ios</span>
                  </button>
                )}
                <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
                  {mutation.isPending ? 'جاري الحفظ...' : 'حفظ الصنف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
