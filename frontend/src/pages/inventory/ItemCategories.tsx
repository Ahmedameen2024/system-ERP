import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

interface Category {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  parent_category_id: string | null;
  description: string;
  status: 'Active' | 'Inactive';
}

export default function ItemCategories() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);
  
  const [form, setForm] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    parentCategoryId: '',
    description: '',
    status: 'Active' as 'Active' | 'Inactive'
  });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['item-categories'],
    queryFn: async () => {
      const res = await api.get('/inventory/categories');
      return res.data.data as Category[];
    },
    initialData: [],
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (editItem) {
        return api.put(`/inventory/categories/${editItem.id}`, data);
      }
      return api.post('/inventory/categories', data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['item-categories'] });
      setShowModal(false);
      setEditItem(null);
    }
  });

  const filtered = categories.filter(c => 
    c.code.includes(search) || c.name_ar.includes(search) || c.name_en.includes(search)
  );

  const openAdd = () => {
    setEditItem(null);
    setForm({
      code: '',
      nameAr: '',
      nameEn: '',
      parentCategoryId: '',
      description: '',
      status: 'Active'
    });
    setShowModal(true);
  };

  const openEdit = (c: Category) => {
    setEditItem(c);
    setForm({
      code: c.code,
      nameAr: c.name_ar,
      nameEn: c.name_en,
      parentCategoryId: c.parent_category_id || '',
      description: c.description || '',
      status: c.status
    });
    setShowModal(true);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>تصنيفات الأصناف (الفئات)</h1>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          تصنيف جديد
        </button>
      </div>

      <div style={{ position: 'relative', maxWidth: 400 }}>
        <span className="material-symbols-outlined" style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline)', fontSize: 18 }}>search</span>
        <input 
          className="input" 
          placeholder="بحث بكود أو اسم التصنيف..." 
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
                <th>كود التصنيف</th>
                <th>الاسم العربي</th>
                <th>الاسم الإنجليزي</th>
                <th>التصنيف الأب</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-on-surface-variant)' }}>
                    لا توجد تصنيفات مضافة بعد
                  </td>
                </tr>
              ) : filtered.map(c => (
                <tr key={c.id}>
                  <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{c.code}</span></td>
                  <td style={{ fontWeight: 500 }}>{c.name_ar}</td>
                  <td>{c.name_en}</td>
                  <td>
                    {c.parent_category_id ? (
                      <span className="chip chip-info">
                        {categories.find(parent => parent.id === c.parent_category_id)?.name_ar || '—'}
                      </span>
                    ) : '—'}
                  </td>
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
              {editItem ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
            </h2>
            
            <form onSubmit={e => { e.preventDefault(); mutation.mutate(form); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>كود التصنيف *</label>
                  <input className="input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
                </div>
                <div>
                  <label>التصنيف الأب</label>
                  <select className="input" value={form.parentCategoryId} onChange={e => setForm({ ...form, parentCategoryId: e.target.value })}>
                    <option value="">-- بدون تصنيف أب --</option>
                    {categories.filter(cat => cat.id !== editItem?.id).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.code} - {cat.name_ar}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>الاسم (عربي) *</label>
                  <input className="input" value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} required />
                </div>
                <div>
                  <label>الاسم (إنجليزي) *</label>
                  <input className="input" value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} required />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>الوصف</label>
                  <textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <label>حالة التصنيف</label>
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
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
                  {mutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
