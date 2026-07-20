import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';

interface Customer {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  trade_name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  tax_number: string;
  cr_number: string;
  credit_limit: string;
  opening_balance: string;
  balance: string;
  payment_terms: number;
  ar_account_id: string | null;
  status: 'Active' | 'Inactive';
}

interface GLAccount { id: string; code: string; name_ar: string; account_type: string; }

const EMPTY_FORM = {
  code: '', nameAr: '', nameEn: '', tradeName: '', phone: '', email: '',
  city: '', address: '', taxNumber: '', crNumber: '',
  creditLimit: 0, openingBalance: 0, paymentTerms: 30,
  arAccountId: '', status: 'Active' as 'Active' | 'Inactive'
};

export default function CustomersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'financial'>('basic');
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => { const r = await api.get('/sales/customers'); return r.data.data as Customer[]; },
    initialData: [],
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['gl-accounts'],
    queryFn: async () => { const r = await api.get('/accounting/accounts'); return r.data.data as GLAccount[]; },
    initialData: [],
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (editItem) return api.put(`/sales/customers/${editItem.id}`, data);
      return api.post('/sales/customers', data);
    },
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      setShowModal(false);
      setEditItem(null);
      try {
        const msg = res?.data?.message || res?.message || 'تم حفظ العميل بنجاح';
        alert(msg);
      } catch (e) {
        alert('تم حفظ العميل بنجاح');
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'حدث خطأ أثناء حفظ العميل';
      alert(msg);
    }
  });

  const deleteMutation = useMutation<void, any, string>({
    mutationFn: async (id: string) => {
      await api.delete(`/sales/customers/${id}`);
    },
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ['customers'] });
      const previous = qc.getQueryData<Customer[]>(['customers']);
      qc.setQueryData(['customers'], (old: Customer[] | undefined) => (old || []).filter(c => c.id !== id));
      return { previous };
    },
    onError: (err: any, id, context: any) => {
      if (context?.previous) qc.setQueryData(['customers'], context.previous);
      const msg = err?.response?.data?.message || err?.message || 'فشل حذف العميل';
      alert(msg);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      alert('تم حذف العميل بنجاح');
    }
  });

  const auth = useAuthStore();

  const filtered = customers.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.name_ar.includes(search) ||
    (c.phone && c.phone.includes(search))
  );

  const receivableAccounts = accounts.filter(a => a.account_type === 'Asset');

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...EMPTY_FORM });
    setActiveTab('basic');
    setShowModal(true);
  };

  const openEdit = (c: Customer) => {
    setEditItem(c);
    setForm({
      code: c.code, nameAr: c.name_ar, nameEn: c.name_en, tradeName: c.trade_name || '',
      phone: c.phone || '', email: c.email || '', city: c.city || '',
      address: c.address || '', taxNumber: c.tax_number || '', crNumber: c.cr_number || '',
      creditLimit: Number(c.credit_limit) || 0, openingBalance: Number(c.opening_balance) || 0,
      paymentTerms: c.payment_terms || 30, arAccountId: c.ar_account_id || '',
      status: c.status
    });
    setActiveTab('basic');
    setShowModal(true);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>دليل العملاء</h1>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
          إضافة عميل جديد
        </button>
      </div>

      {/* Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'var(--color-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>groups</span>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{customers.filter(c => c.status === 'Active').length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>عملاء نشطون</div>
          </div>
        </div>
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(234,179,8,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: '#ca8a04' }}>account_balance_wallet</span>
          </div>
          <div>
            <div className="numeric" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ca8a04' }}>
              {customers.reduce((s, c) => s + Number(c.balance), 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>إجمالي المستحقات</div>
          </div>
        </div>
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(22,163,74,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: '#16a34a' }}>credit_score</span>
          </div>
          <div>
            <div className="numeric" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a' }}>
              {customers.reduce((s, c) => s + Number(c.credit_limit), 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>إجمالي الحدود الائتمانية</div>
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', maxWidth: 400 }}>
        <span className="material-symbols-outlined" style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline)', fontSize: 18 }}>search</span>
        <input className="input" placeholder="بحث بالكود، الاسم أو الهاتف..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingRight: '2.5rem' }} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>كود العميل</th>
                <th>الاسم</th>
                <th>المدينة</th>
                <th>الهاتف</th>
                <th>الرقم الضريبي</th>
                <th>أيام السداد</th>
                <th style={{ textAlign: 'left' }}>الحد الائتماني</th>
                <th style={{ textAlign: 'left' }}>الرصيد المستحق</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-on-surface-variant)' }}>لا يوجد عملاء مسجلون</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id}>
                  <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{c.code}</span></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.name_ar}</div>
                    {c.trade_name && <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>{c.trade_name}</div>}
                  </td>
                  <td>{c.city || '—'}</td>
                  <td className="numeric">{c.phone || '—'}</td>
                  <td className="numeric" style={{ fontSize: '0.75rem' }}>{c.tax_number || '—'}</td>
                  <td style={{ textAlign: 'center' }}>{c.payment_terms} يوم</td>
                  <td className="numeric" style={{ textAlign: 'left' }}>{Number(c.credit_limit).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="numeric" style={{ textAlign: 'left', fontWeight: 700, color: Number(c.balance) > 0 ? '#ca8a04' : 'inherit' }}>
                    {Number(c.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td><span className={`chip ${c.status === 'Active' ? 'chip-success' : 'chip-neutral'}`}>{c.status === 'Active' ? 'نشط' : 'متوقف'}</span></td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)} title="تعديل">
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                    </button>
                    {/** show delete if user has permission or if no permission model available (backend enforces) */}
                    {(auth.hasPermission?.('Sales', 'Customers', 'delete') ?? true) && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          if (!confirm(`هل أنت متأكد من حذف العميل ${c.name_ar}؟ هذه العملية لا يمكن التراجع عنها.`)) return;
                          deleteMutation.mutate(c.id);
                        }}
                        title="حذف"
                        disabled={deleteMutation.isPending}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#b91c1c' }}>delete</span>
                      </button>
                    )}
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
              {editItem ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
            </h2>

            <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--color-outline-variant)', marginBottom: '1.5rem' }}>
              {(['basic', 'financial'] as const).map(tab => (
                <button key={tab} type="button" className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ borderRadius: '0.5rem 0.5rem 0 0' }} onClick={() => setActiveTab(tab)}>
                  {tab === 'basic' ? 'البيانات الأساسية' : 'الإعدادات المالية'}
                </button>
              ))}
            </div>

            <form onSubmit={e => { e.preventDefault(); mutation.mutate(form); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activeTab === 'basic' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label>كود العميل *</label>
                    <input className="input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
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
                    <label>الاسم التجاري</label>
                    <input className="input" value={form.tradeName} onChange={e => setForm({ ...form, tradeName: e.target.value })} />
                  </div>
                  <div>
                    <label>الهاتف *</label>
                    <input className="input numeric" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
                  </div>
                  <div>
                    <label>البريد الإلكتروني</label>
                    <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div>
                    <label>المدينة</label>
                    <input className="input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div>
                    <label>الرقم الضريبي (VAT)</label>
                    <input className="input numeric" value={form.taxNumber} onChange={e => setForm({ ...form, taxNumber: e.target.value })} />
                  </div>
                  <div>
                    <label>السجل التجاري</label>
                    <input className="input numeric" value={form.crNumber} onChange={e => setForm({ ...form, crNumber: e.target.value })} />
                  </div>
                  <div>
                    <label>الحالة</label>
                    <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'Active' | 'Inactive' })}>
                      <option value="Active">نشط</option>
                      <option value="Inactive">متوقف</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>العنوان التفصيلي</label>
                    <textarea className="input" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                  </div>
                </div>
              )}

              {activeTab === 'financial' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label>الحد الائتماني (ر.س)</label>
                    <input className="input numeric" type="number" step="0.01" value={form.creditLimit} onChange={e => setForm({ ...form, creditLimit: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label>شروط الدفع (أيام)</label>
                    <input className="input numeric" type="number" value={form.paymentTerms} onChange={e => setForm({ ...form, paymentTerms: parseInt(e.target.value) || 30 })} />
                  </div>
                  {!editItem && (
                    <div>
                      <label>الرصيد الافتتاحي</label>
                      <input className="input numeric" type="number" step="0.01" value={form.openingBalance} onChange={e => setForm({ ...form, openingBalance: parseFloat(e.target.value) || 0 })} />
                    </div>
                  )}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>حساب المدينين (AR Account)</label>
                    <select className="input" value={form.arAccountId} onChange={e => setForm({ ...form, arAccountId: e.target.value })}>
                      <option value="">-- اختر الحساب --</option>
                      {receivableAccounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name_ar}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {mutation.isError && (
                <div style={{ color: 'red', fontSize: '0.875rem', padding: '0.75rem', background: '#ffeeee', borderRadius: '0.5rem' }}>
                  {(mutation.error as any).response?.data?.message || 'حدث خطأ'}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--color-outline-variant)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
                  {mutation.isPending ? 'جاري الحفظ...' : 'حفظ العميل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
