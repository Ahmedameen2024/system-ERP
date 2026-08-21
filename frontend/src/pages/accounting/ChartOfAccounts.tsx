import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

interface Currency {
  id: string;
  code: string;
  name_ar: string;
  symbol: string;
}

interface AccountCurrency {
  currency_id: string;
  currency_code: string;
  currency_name: string;
  balance: number | string;
}

interface Account {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  account_type: string;
  nature: string;
  account_level: number;
  allow_posting: boolean;
  parent_id: string | null;
  status: string;
  currencies?: AccountCurrency[];
}

const typeColors: Record<string, string> = {
  Asset: '#059669',
  Liability: '#d97706',
  Equity: '#4c56af',
  Revenue: '#8237b2',
  Expense: '#ba1a1a',
};

const typeLabels: Record<string, string> = {
  Asset: 'أصول',
  Liability: 'التزامات',
  Equity: 'حقوق الملكية',
  Revenue: 'إيرادات',
  Expense: 'مصروفات',
};

export default function ChartOfAccounts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Account | null>(null);
  const [form, setForm] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    accountType: 'Asset',
    nature: 'Debit',
    accountLevel: 1,
    allowPosting: true,
    parentId: '',
    status: 'Active',
    currencyIds: [] as string[],
  });

  const { data: accounts = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['gl-accounts'],
    queryFn: async () => {
      const r = await api.get('/accounting/accounts');
      return (r.data.data || []) as Account[];
    },
  });

  const { data: currencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const r = await api.get('/setup/currencies');
      return ((r.data.data || []) as (Currency & { status: string })[]).filter(c => c.status === 'Active' || !('status' in c));
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (editItem) return api.put(`/accounting/accounts/${editItem.id}`, data);
      return api.post('/accounting/accounts', data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gl-accounts'] });
      setShowModal(false);
      setEditItem(null);
    },
  });

  const filtered = accounts.filter(
    a => a.code.includes(search) || a.name_ar.includes(search) || (a.name_en && a.name_en.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => {
    setEditItem(null);
    const defCurIds = currencies.length > 0 ? [currencies[0].id] : [];
    setForm({
      code: '',
      nameAr: '',
      nameEn: '',
      accountType: 'Asset',
      nature: 'Debit',
      accountLevel: 1,
      allowPosting: true,
      parentId: '',
      status: 'Active',
      currencyIds: defCurIds,
    });
    setShowModal(true);
  };

  const openEdit = (a: Account) => {
    setEditItem(a);
    const assignedCurIds = (a.currencies && a.currencies.length > 0)
      ? a.currencies.map(c => c.currency_id)
      : (currencies.length > 0 ? [currencies[0].id] : []);
    setForm({
      code: a.code,
      nameAr: a.name_ar,
      nameEn: a.name_en || '',
      accountType: a.account_type,
      nature: a.nature,
      accountLevel: a.account_level,
      allowPosting: a.allow_posting,
      parentId: a.parent_id || '',
      status: a.status,
      currencyIds: assignedCurIds,
    });
    setShowModal(true);
  };

  const toggleCurrency = (curId: string) => {
    setForm(prev => {
      const exists = prev.currencyIds.includes(curId);
      if (exists) {
        if (prev.currencyIds.length === 1) return prev;
        return { ...prev, currencyIds: prev.currencyIds.filter(id => id !== curId) };
      }
      return { ...prev, currencyIds: [...prev.currencyIds, curId] };
    });
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>دليل الحسابات</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>
            الهيكل المالي وحسابات الشركة
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          حساب جديد
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 400 }}>
        <span
          className="material-symbols-outlined"
          style={{
            position: 'absolute',
            right: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-outline)',
            fontSize: 18,
          }}
        >
          search
        </span>
        <input
          className="input"
          placeholder="بحث برقم أو اسم الحساب..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingRight: '2.5rem' }}
        />
      </div>

      <div className="card table-container" style={{ padding: 0 }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" />
          </div>
        ) : isError ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-error)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>error</span>
            حدث خطأ أثناء تحميل دليل الحسابات
            <div style={{ marginTop: '1rem' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => refetch()}>إعادة المحاولة</button>
            </div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>الرقم</th>
                <th>الاسم</th>
                <th>النوع</th>
                <th>الطبيعة</th>
                <th>المستوى</th>
                <th>الترحيل المباشر</th>
                <th>العملات المسموحة</th>
                <th>الأرصدة المستقلة</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-on-surface-variant)' }}>
                    لا توجد حسابات مضافة بعد
                  </td>
                </tr>
              ) : (
                filtered.map(a => (
                  <tr key={a.id} style={{ background: a.account_level === 1 ? 'rgba(var(--color-primary-rgb, 0), 0.03)' : 'transparent' }}>
                    <td>
                      <span className="numeric" style={{ fontWeight: a.account_level === 1 ? 800 : 600, color: 'var(--color-primary)' }}>
                        {a.code}
                      </span>
                    </td>
                    <td>
                      <div style={{ paddingRight: `${(a.account_level - 1) * 1.5}rem`, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {a.account_level === 1 ? (
                          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-primary)' }}>folder_special</span>
                        ) : (
                          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-text-muted)' }}>subdirectory_arrow_left</span>
                        )}
                        <span style={{ fontWeight: a.account_level === 1 ? 700 : 500 }}>{a.name_ar}</span>
                        {a.name_en && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginRight: 6 }}>({a.name_en})</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="chip" style={{ background: `${typeColors[a.account_type] || '#666'}15`, color: typeColors[a.account_type] || '#666' }}>
                        {typeLabels[a.account_type] || a.account_type}
                      </span>
                    </td>
                    <td>{a.nature === 'Debit' ? 'مدين' : 'دائن'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        background: a.account_level === 1 ? 'var(--color-primary-subtle)' : 'var(--color-surface-variant)',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: '0.78rem',
                        fontWeight: 700
                      }}>
                        المستوى {a.account_level}
                      </span>
                    </td>
                    <td>
                      {a.allow_posting ? (
                        <span className="chip chip-success">نعم</span>
                      ) : (
                        <span className="chip chip-neutral">لا (تجميعي)</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {a.currencies && a.currencies.length > 0 ? (
                          a.currencies.map(cur => (
                            <span key={cur.currency_id} className="chip chip-primary" style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem' }}>
                              {cur.currency_code}
                            </span>
                          ))
                        ) : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>—</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {a.currencies && a.currencies.length > 0 ? (
                          a.currencies.map(cur => {
                            const bal = Number(cur.balance) || 0;
                            return (
                              <div key={cur.currency_id} style={{ display: 'flex', gap: '0.4rem', fontSize: '0.8rem', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, color: 'var(--color-text-muted)' }}>{cur.currency_code}:</span>
                                <span className="numeric" style={{ fontWeight: 700, color: bal !== 0 ? 'var(--color-primary)' : 'inherit' }}>
                                  {bal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            );
                          })
                        ) : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>—</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`chip ${a.status === 'Active' ? 'chip-success' : 'chip-neutral'}`}>
                        {a.status === 'Active' ? 'نشط' : 'متوقف'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(a)} title="تعديل">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: 700, width: '95%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, verticalAlign: 'middle', marginLeft: 8, color: 'var(--color-primary)' }}>
                  {editItem ? 'edit' : 'add_circle'}
                </span>
                {editItem ? 'تعديل حساب' : 'إضافة حساب جديد'}
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Basic info */}
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--color-border)' }}>
                  بيانات الحساب
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label>رقم الحساب *</label>
                    <input className="input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
                  </div>
                  <div>
                    <label>اسم الحساب (عربي) *</label>
                    <input className="input" value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} />
                  </div>
                  <div>
                    <label>اسم الحساب (إنجليزي)</label>
                    <input className="input" value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} />
                  </div>
                  <div>
                    <label>نوع الحساب *</label>
                    <select className="input" value={form.accountType} onChange={e => setForm({ ...form, accountType: e.target.value })}>
                      {Object.entries(typeLabels).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>الطبيعة *</label>
                    <select className="input" value={form.nature} onChange={e => setForm({ ...form, nature: e.target.value })}>
                      <option value="Debit">مدين</option>
                      <option value="Credit">دائن</option>
                    </select>
                  </div>
                  <div>
                    <label>المستوى</label>
                    <select className="input" value={form.accountLevel} onChange={e => setForm({ ...form, accountLevel: parseInt(e.target.value) })}>
                      {[1, 2, 3, 4, 5].map(l => (
                        <option key={l} value={l}>المستوى {l}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.allowPosting} onChange={e => setForm({ ...form, allowPosting: e.target.checked })} />
                    <span>السماح بالترحيل المباشر</span>
                  </label>
                </div>
              </div>

              {/* Multi-currency */}
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--color-border)' }}>
                  العملات المسموحة للحساب
                </p>
                <div style={{ padding: '0.85rem', background: 'var(--color-surface-variant)', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 0.6rem' }}>
                    حدد العملات التي يدعمها هذا الحساب. لكل عملة رصيد مستقل ولا يتم التحويل التلقائي بين العملات.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem' }}>
                    {currencies.map(cur => {
                      const isSelected = form.currencyIds.includes(cur.id);
                      return (
                        <button
                          key={cur.id}
                          type="button"
                          onClick={() => toggleCurrency(cur.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '0.5rem',
                            border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                            background: isSelected ? 'var(--color-primary-container)' : 'var(--color-surface)',
                            color: isSelected ? 'var(--color-primary)' : 'var(--color-text)',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <span>{cur.code} - {cur.name_ar}</span>
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                            {isSelected ? 'check_box' : 'check_box_outline_blank'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                <button className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  إلغاء
                </button>
                <button className="btn btn-primary" onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
                  {mutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
