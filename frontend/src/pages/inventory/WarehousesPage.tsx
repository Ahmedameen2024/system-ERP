import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

interface Warehouse {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  manager_id: string | null;
  branch_id: string | null;
  location: string;
  capacity: string;
  status: 'Active' | 'Inactive';
}

interface User {
  id: string;
  name_ar: string;
}

interface Branch {
  id: string;
  name_ar: string;
}

export default function WarehousesPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Warehouse | null>(null);
  const [form, setForm] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    managerId: '',
    branchId: '',
    location: '',
    capacity: '',
    status: 'Active' as 'Active' | 'Inactive'
  });

  const { data: warehouses = [], isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await api.get('/inventory/warehouses');
      return res.data.data as Warehouse[];
    },
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users-dropdown'],
    queryFn: async () => {
      const res = await api.get('/setup/users');
      return res.data.data as User[];
    },
    initialData: [],
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: async () => {
      const res = await api.get('/setup/branches');
      return res.data.data as Branch[];
    },
    initialData: [],
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (editItem) {
        return api.put(`/inventory/warehouses/${editItem.id}`, data);
      }
      return api.post('/inventory/warehouses', data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['warehouses'] });
      setShowModal(false);
      setEditItem(null);
    }
  });

  const openAdd = () => {
    setEditItem(null);
    setForm({ code: '', nameAr: '', nameEn: '', managerId: '', branchId: branches.length > 0 ? branches[0].id : '', location: '', capacity: '', status: 'Active' });
    setShowModal(true);
  };

  const openEdit = (w: Warehouse) => {
    setEditItem(w);
    setForm({ 
      code: w.code, 
      nameAr: w.name_ar, 
      nameEn: w.name_en, 
      managerId: w.manager_id || '', 
      branchId: w.branch_id || '',
      location: w.location || '', 
      capacity: w.capacity || '', 
      status: w.status 
    });
    setShowModal(true);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>إدارة المستودعات والمخازن</h1>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          إضافة مستودع جديد
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>كود المستودع</th>
                <th>الاسم العربي</th>
                <th>الاسم الإنجليزي</th>
                <th>الفرع</th>
                <th>أمين المستودع</th>
                <th>السعة الاستيعابية</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-on-surface-variant)' }}>
                    لا توجد مستودعات مضافة بعد
                  </td>
                </tr>
              ) : warehouses.map(w => (
                <tr key={w.id}>
                  <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{w.code}</span></td>
                  <td style={{ fontWeight: 500 }}>{w.name_ar}</td>
                  <td>{w.name_en}</td>
                  <td>{branches.find(b => b.id === w.branch_id)?.name_ar || '—'}</td>
                  <td>{users.find(u => u.id === w.manager_id)?.name_ar || '—'}</td>
                  <td><span className="numeric">{w.capacity || '—'}</span></td>
                  <td>
                    <span className={`chip ${w.status === 'Active' ? 'chip-success' : 'chip-neutral'}`}>
                      {w.status === 'Active' ? 'نشط' : 'متوقف'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(w)} title="تعديل">
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
              {editItem ? 'تعديل بيانات المستودع' : 'إضافة مستودع جديد'}
            </h2>
            <form onSubmit={e => { e.preventDefault(); mutation.mutate(form); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>الفرع *</label>
                  <select className="input" value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })} required>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name_ar}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>كود المستودع *</label>
                  <input className="input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required placeholder="مثال: WH-003" />
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
                  <label>أمين المستودع المسئول</label>
                  <select className="input" value={form.managerId} onChange={e => setForm({ ...form, managerId: e.target.value })}>
                    <option value="">-- بدون مسؤول --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name_ar}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>السعة الاستيعابية</label>
                  <input className="input" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder="مثال: ١٠٬٠٠٠ وحدة" />
                </div>
                <div>
                  <label>الحالة</label>
                  <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'Active' | 'Inactive' })}>
                    <option value="Active">نشط</option>
                    <option value="Inactive">متوقف</option>
                  </select>
                </div>
              </div>
              <div>
                <label>موقع المستودع / العنوان</label>
                <textarea className="input" rows={2} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
              </div>
              
              {mutation.isError && (
                <div style={{ marginTop: '0.5rem', color: 'red', fontSize: '0.875rem' }}>
                  {(mutation.error as any).response?.data?.message || 'حدث خطأ أثناء الحفظ'}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
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
