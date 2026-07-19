import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

interface UOM {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  abbreviation: string;
  type: string;
  base_uom_id: string | null;
  conversion_factor: string;
  status: 'Active' | 'Inactive';
}

export default function UnitsOfMeasure() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<UOM | null>(null);
  const [form, setForm] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    abbreviation: '',
    type: 'Quantity',
    baseUomId: '',
    conversionFactor: 1,
    status: 'Active' as 'Active' | 'Inactive'
  });

  const { data: uoms = [], isLoading } = useQuery({
    queryKey: ['uoms'],
    queryFn: async () => {
      const res = await api.get('/inventory/uoms');
      return res.data.data as UOM[];
    },
    initialData: [],
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (editItem) {
        return api.put(`/inventory/uoms/${editItem.id}`, data);
      }
      return api.post('/inventory/uoms', data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['uoms'] });
      setShowModal(false);
      setEditItem(null);
    }
  });

  const typeLabels: Record<string, string> = {
    Quantity: 'العدد والكمية',
    Weight: 'الوزن والكتلة',
    Volume: 'الحجم والسعة',
    Length: 'الأبعاد والأطوال',
    Time: 'الوقت',
    Other: 'أخرى'
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({ code: '', nameAr: '', nameEn: '', abbreviation: '', type: 'Quantity', baseUomId: '', conversionFactor: 1, status: 'Active' });
    setShowModal(true);
  };

  const openEdit = (u: UOM) => {
    setEditItem(u);
    setForm({ 
      code: u.code, 
      nameAr: u.name_ar, 
      nameEn: u.name_en, 
      abbreviation: u.abbreviation, 
      type: u.type, 
      baseUomId: u.base_uom_id || '', 
      conversionFactor: Number(u.conversion_factor) || 1, 
      status: u.status 
    });
    setShowModal(true);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>وحدات القياس (UOM)</h1>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          إضافة وحدة جديدة
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>كود الوحدة</th>
                <th>الاسم العربي</th>
                <th>الاسم الإنجليزي</th>
                <th>الاختصار الرسمي</th>
                <th>نوع القياس</th>
                <th style={{ textAlign: 'left' }}>عامل التحويل</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {uoms.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-on-surface-variant)' }}>
                    لا توجد وحدات مضافة بعد
                  </td>
                </tr>
              ) : uoms.map(u => (
                <tr key={u.id}>
                  <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{u.code}</span></td>
                  <td style={{ fontWeight: 500 }}>{u.name_ar}</td>
                  <td>{u.name_en}</td>
                  <td><span className="numeric">{u.abbreviation}</span></td>
                  <td><span className="chip chip-info">{typeLabels[u.type] || u.type}</span></td>
                  <td className="numeric" style={{ textAlign: 'left', fontWeight: 700 }}>{Number(u.conversion_factor)}</td>
                  <td>
                    <span className={`chip ${u.status === 'Active' ? 'chip-success' : 'chip-neutral'}`}>
                      {u.status === 'Active' ? 'نشط' : 'متوقف'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)} title="تعديل">
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
              {editItem ? 'تعديل وحدة القياس' : 'إضافة وحدة قياس جديدة'}
            </h2>
            <form onSubmit={e => { e.preventDefault(); mutation.mutate(form); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>كود الوحدة *</label>
                  <input className="input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required placeholder="مثال: PCS" />
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
                  <label>الاختصار *</label>
                  <input className="input numeric" value={form.abbreviation} onChange={e => setForm({ ...form, abbreviation: e.target.value })} required placeholder="مثال: Pcs" />
                </div>
                <div>
                  <label>نوع القياس *</label>
                  <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    {Object.entries(typeLabels).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>الوحدة الأساسية (Base UoM)</label>
                  <select className="input" value={form.baseUomId} onChange={e => setForm({ ...form, baseUomId: e.target.value })}>
                    <option value="">هذه هي الوحدة الأساسية</option>
                    {uoms.filter(u => u.id !== editItem?.id).map(u => (
                      <option key={u.id} value={u.id}>{u.name_ar} ({u.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>عامل التحويل *</label>
                  <input className="input numeric" type="number" step="0.000001" value={form.conversionFactor} onChange={e => setForm({ ...form, conversionFactor: parseFloat(e.target.value) })} required />
                </div>
                <div>
                  <label>الحالة</label>
                  <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'Active' | 'Inactive' })}>
                    <option value="Active">نشط</option>
                    <option value="Inactive">متوقف</option>
                  </select>
                </div>
              </div>

              {mutation.isError && (
                <div style={{ marginTop: '0.5rem', color: 'red', fontSize: '0.875rem' }}>
                  {(mutation.error as any).response?.data?.message || 'حدث خطأ أثناء الحفظ'}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
                  {mutation.isPending ? 'جاري الحفظ...' : 'حفظ الوحدة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
