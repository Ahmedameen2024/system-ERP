import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

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
}

const typeColors: Record<string, string> = {
  Asset: '#059669', Liability: '#d97706', Equity: '#4c56af',
  Revenue: '#8237b2', Expense: '#ba1a1a',
};
const typeLabels: Record<string, string> = {
  Asset: 'أصول', Liability: 'التزامات', Equity: 'حقوق الملكية',
  Revenue: 'إيرادات', Expense: 'مصروفات',
};

export default function ChartOfAccounts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Account | null>(null);
  const [form, setForm] = useState({ code: '', nameAr: '', nameEn: '', accountType: 'Asset', nature: 'Debit', accountLevel: 1, allowPosting: true, parentId: '', status: 'Active' });

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['gl-accounts'],
    queryFn: async () => { const r = await api.get('/accounting/accounts'); return r.data.data as Account[]; },
    initialData: [],
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (editItem) return api.put(`/accounting/accounts/${editItem.id}`, data);
      return api.post('/accounting/accounts', data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gl-accounts'] }); setShowModal(false); setEditItem(null); },
  });

  const filtered = accounts.filter(a =>
    a.code.includes(search) || a.name_ar.includes(search)
  );

  const openAdd = () => { setEditItem(null); setForm({ code: '', nameAr: '', nameEn: '', accountType: 'Asset', nature: 'Debit', accountLevel: 1, allowPosting: true, parentId: '', status: 'Active' }); setShowModal(true); };
  const openEdit = (a: Account) => { setEditItem(a); setForm({ code: a.code, nameAr: a.name_ar, nameEn: a.name_en, accountType: a.account_type, nature: a.nature, accountLevel: a.account_level, allowPosting: a.allow_posting, parentId: a.parent_id || '', status: a.status }); setShowModal(true); };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>دليل الحسابات</h1>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          حساب جديد
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 400 }}>
        <span className="material-symbols-outlined" style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline)', fontSize: 18 }}>search</span>
        <input className="input" placeholder="بحث برقم أو اسم الحساب..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingRight: '2.5rem' }} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>الرقم</th>
                <th>الاسم</th>
                <th>النوع</th>
                <th>الطبيعة</th>
                <th>المستوى</th>
                <th>الترحيل</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-on-surface-variant)' }}>لا توجد حسابات مضافة بعد</td></tr>
              ) : filtered.map(a => (
                <tr key={a.id}>
                  <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{a.code}</span></td>
                  <td style={{ fontWeight: 500 }}>{a.name_ar}</td>
                  <td><span className="chip" style={{ background: `${typeColors[a.account_type]}15`, color: typeColors[a.account_type] }}>{typeLabels[a.account_type]}</span></td>
                  <td>{a.nature === 'Debit' ? 'مدين' : 'دائن'}</td>
                  <td style={{ textAlign: 'center' }}>{a.account_level}</td>
                  <td>{a.allow_posting ? <span className="chip chip-success">نعم</span> : <span className="chip chip-neutral">لا</span>}</td>
                  <td><span className={`chip ${a.status === 'Active' ? 'chip-success' : 'chip-neutral'}`}>{a.status === 'Active' ? 'نشط' : 'متوقف'}</span></td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(a)} title="تعديل">
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
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>
              {editItem ? 'تعديل حساب' : 'إضافة حساب جديد'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label>رقم الحساب *</label><input className="input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
              <div><label>اسم الحساب (عربي) *</label><input className="input" value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} /></div>
              <div><label>اسم الحساب (إنجليزي)</label><input className="input" value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} /></div>
              <div><label>نوع الحساب *</label>
                <select className="input" value={form.accountType} onChange={e => setForm({ ...form, accountType: e.target.value })}>
                  {Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div><label>الطبيعة *</label>
                <select className="input" value={form.nature} onChange={e => setForm({ ...form, nature: e.target.value })}>
                  <option value="Debit">مدين</option>
                  <option value="Credit">دائن</option>
                </select>
              </div>
              <div><label>المستوى</label>
                <select className="input" value={form.accountLevel} onChange={e => setForm({ ...form, accountLevel: parseInt(e.target.value) })}>
                  {[1,2,3,4,5].map(l => <option key={l} value={l}>المستوى {l}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.allowPosting} onChange={e => setForm({ ...form, allowPosting: e.target.checked })} />
                <span>السماح بالترحيل المباشر</span>
              </label>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
              <button className="btn btn-primary" onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
                {mutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
