import { useState, useEffect } from 'react';
import api from '../../api/client';

interface Branch {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  manager_id: string | null;
  manager_name: string | null;
  city: string;
  address: string;
  phone: string;
  email: string;
  status: 'Active' | 'Inactive';
}

export default function BranchManagement() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Branch | null>(null);
  const [form, setForm] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    managerId: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    status: 'Active' as 'Active' | 'Inactive'
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/setup/branches?limit=100'); // Assuming we want all for now
      setBranches(res.data.data);
    } catch (err) {
      console.error('Failed to fetch branches', err);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({
      code: '',
      nameAr: '',
      nameEn: '',
      managerId: '',
      city: '',
      address: '',
      phone: '',
      email: '',
      status: 'Active'
    });
    setShowModal(true);
  };

  const openEdit = (b: Branch) => {
    setEditItem(b);
    setForm({
      code: b.code || '',
      nameAr: b.name_ar || '',
      nameEn: b.name_en || '',
      managerId: b.manager_id || '',
      city: b.city || '',
      address: b.address || '',
      phone: b.phone || '',
      email: b.email || '',
      status: b.status || 'Active'
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.put(`/setup/branches/${editItem.id}`, form);
      } else {
        await api.post('/setup/branches', form);
      }
      setShowModal(false);
      fetchBranches();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save branch');
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>إدارة الفروع</h1>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          إضافة فرع جديد
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>جاري التحميل...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>كود الفرع</th>
                <th>الاسم العربي</th>
                <th>الاسم الإنجليزي</th>
                <th>مدير الفرع</th>
                <th>المدينة</th>
                <th>الهاتف</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {branches.map(b => (
                <tr key={b.id}>
                  <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{b.code}</span></td>
                  <td style={{ fontWeight: 500 }}>{b.name_ar}</td>
                  <td>{b.name_en}</td>
                  <td>{b.manager_name || '-'}</td>
                  <td>{b.city}</td>
                  <td className="numeric">{b.phone}</td>
                  <td>
                    <span className={`chip ${b.status === 'Active' ? 'chip-success' : 'chip-neutral'}`}>
                      {b.status === 'Active' ? 'نشط' : 'متوقف'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(b)} title="تعديل">
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                    </button>
                  </td>
                </tr>
              ))}
              {branches.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>لا توجد فروع</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>
              {editItem ? 'تعديل بيانات الفرع' : 'إضافة فرع جديد'}
            </h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>كود الفرع *</label>
                  <input className="input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
                </div>
                <div>
                  <label>اسم الفرع (عربي) *</label>
                  <input className="input" value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} required />
                </div>
                <div>
                  <label>اسم الفرع (إنجليزي) *</label>
                  <input className="input" value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} required />
                </div>
                <div>
                  <label>المدير المسئول (ID)</label>
                  <input className="input" value={form.managerId} onChange={e => setForm({ ...form, managerId: e.target.value })} />
                </div>
                <div>
                  <label>المدينة</label>
                  <input className="input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                </div>
                <div>
                  <label>الهاتف</label>
                  <input className="input numeric" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label>البريد الإلكتروني</label>
                  <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label>حالة الفرع</label>
                  <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'Active' | 'Inactive' })}>
                    <option value="Active">نشط</option>
                    <option value="Inactive">متوقف</option>
                  </select>
                </div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label>العنوان</label>
                <input className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ البيانات</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
