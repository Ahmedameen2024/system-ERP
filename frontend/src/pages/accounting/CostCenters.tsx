import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

interface CostCenter {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  parent_id: string | null;
  manager_id: string | null;
  budget: string;
  status: 'Active' | 'Inactive';
}

export default function CostCenters() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<CostCenter | null>(null);
  
  const [form, setForm] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    parentId: '',
    managerId: '',
    budget: 0,
    status: 'Active' as 'Active' | 'Inactive'
  });

  const { data: costCenters = [], isLoading } = useQuery({
    queryKey: ['cost-centers'],
    queryFn: async () => {
      const res = await api.get('/accounting/cost-centers');
      return res.data.data as CostCenter[];
    },
    initialData: [],
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (editItem) {
        return api.put(`/accounting/cost-centers/${editItem.id}`, data);
      }
      return api.post('/accounting/cost-centers', data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cost-centers'] });
      setShowModal(false);
      setEditItem(null);
    }
  });

  const filtered = costCenters.filter(c => 
    c.code.includes(search) || c.name_ar.includes(search) || c.name_en.includes(search)
  );

  const openAdd = () => {
    setEditItem(null);
    setForm({
      code: '',
      nameAr: '',
      nameEn: '',
      parentId: '',
      managerId: '',
      budget: 0,
      status: 'Active'
    });
    setShowModal(true);
  };

  const openEdit = (c: CostCenter) => {
    setEditItem(c);
    setForm({
      code: c.code,
      nameAr: c.name_ar,
      nameEn: c.name_en,
      parentId: c.parent_id || '',
      managerId: c.manager_id || '',
      budget: Number(c.budget) || 0,
      status: c.status
    });
    setShowModal(true);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>مراكز التكلفة</h1>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          مركز تكلفة جديد
        </button>
      </div>

      <div style={{ position: 'relative', maxWidth: 400 }}>
        <span className="material-symbols-outlined" style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline)', fontSize: 18 }}>search</span>
        <input 
          className="input" 
          placeholder="بحث برقم أو اسم المركز..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={{ paddingRight: '2.5rem' }} 
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" />
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>الكود</th>
                <th>الاسم العربي</th>
                <th>الاسم الإنجليزي</th>
                <th style={{ textAlign: 'left' }}>الموازنة المعتمدة</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-on-surface-variant)' }}>
                    لا توجد مراكز تكلفة مضافة بعد
                  </td>
                </tr>
              ) : filtered.map(c => (
                <tr key={c.id}>
                  <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{c.code}</span></td>
                  <td style={{ fontWeight: 500 }}>{c.name_ar}</td>
                  <td>{c.name_en}</td>
                  <td className="numeric" style={{ textAlign: 'left' }}>{Number(c.budget).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>
                    <span className={`chip ${c.status === 'Active' ? 'chip-success' : 'chip-neutral'}`}>
                      {c.status === 'Active' ? 'نشط' : 'متوقف'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)} title="تعديل">
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
              {editItem ? 'تعديل مركز تكلفة' : 'إضافة مركز تكلفة جديد'}
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label>كود المركز *</label>
                <input className="input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
              </div>
              <div>
                <label>الموازنة المعتمدة</label>
                <input className="input numeric" type="number" step="0.01" value={form.budget} onChange={e => setForm({ ...form, budget: Number(e.target.value) })} />
              </div>
              <div>
                <label>الاسم (عربي) *</label>
                <input className="input" value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} required />
              </div>
              <div>
                <label>الاسم (إنجليزي) *</label>
                <input className="input" value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} required />
              </div>
              <div>
                <label>المركز الرئيسي</label>
                <select className="input" value={form.parentId} onChange={e => setForm({ ...form, parentId: e.target.value })}>
                  <option value="">-- بدون مركز رئيسي --</option>
                  {costCenters.filter(cc => cc.id !== editItem?.id).map(cc => (
                    <option key={cc.id} value={cc.id}>{cc.code} - {cc.name_ar}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>حالة المركز</label>
                <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'Active' | 'Inactive' })}>
                  <option value="Active">نشط</option>
                  <option value="Inactive">متوقف</option>
                </select>
              </div>
            </div>

            {mutation.isError && (
              <div style={{ marginTop: '1rem', color: 'red', fontSize: '0.875rem' }}>
                {(mutation.error as any).response?.data?.message || 'حدث خطأ غير متوقع'}
              </div>
            )}

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
