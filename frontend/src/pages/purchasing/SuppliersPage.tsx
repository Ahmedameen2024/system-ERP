import { useState } from 'react';

interface Supplier {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  taxNumber: string;
  creditLimit: number;
  balance: number;
  status: 'Active' | 'Inactive';
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { id: '1', code: 'SUP-0001', nameAr: 'شركة البيان للمقاولات والتجارة', nameEn: 'Al-Bayan Co.', contactPerson: 'سعيد الحارثي', phone: '0511111111', email: 'sales@albayan.com', city: 'الرياض', taxNumber: '300123456700003', creditLimit: 500000, balance: 23400, status: 'Active' },
    { id: '2', code: 'SUP-0002', nameAr: 'مؤسسة الرياض للتوريدات الكهربائية', nameEn: 'Riyadh Electric Est.', contactPerson: 'فهد المطيري', phone: '0522222222', email: 'info@riyadhelec.com', city: 'جدة', taxNumber: '300987654300003', creditLimit: 150000, balance: 87900, status: 'Active' },
    { id: '3', code: 'SUP-0003', nameAr: 'المصنع السعودي الموحد', nameEn: 'Unified Saudi Factory', contactPerson: 'عبدالعزيز المنيع', phone: '0533333333', email: 'purchasing@usf.com', city: 'الدمام', taxNumber: '300456123000003', creditLimit: 1000000, balance: 0, status: 'Active' }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Supplier | null>(null);
  const [form, setForm] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    contactPerson: '',
    phone: '',
    email: '',
    city: '',
    taxNumber: '',
    creditLimit: 0,
    balance: 0,
    status: 'Active' as 'Active' | 'Inactive'
  });

  const openAdd = () => {
    setEditItem(null);
    setForm({ code: '', nameAr: '', nameEn: '', contactPerson: '', phone: '', email: '', city: '', taxNumber: '', creditLimit: 0, balance: 0, status: 'Active' });
    setShowModal(true);
  };

  const openEdit = (s: Supplier) => {
    setEditItem(s);
    setForm({ code: s.code, nameAr: s.nameAr, nameEn: s.nameEn, contactPerson: s.contactPerson, phone: s.phone, email: s.email, city: s.city, taxNumber: s.taxNumber, creditLimit: s.creditLimit, balance: s.balance, status: s.status });
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editItem) {
      setSuppliers(suppliers.map(s => s.id === editItem.id ? { ...s, ...form } : s));
    } else {
      const code = 'SUP-' + String(suppliers.length + 1).padStart(4, '0');
      setSuppliers([...suppliers, { id: Date.now().toString(), ...form, code }]);
    }
    setShowModal(false);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>دليل الموردين</h1>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          إضافة مورد جديد
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>كود المورد</th>
              <th>الاسم العربي</th>
              <th>الشخص المسؤول</th>
              <th>المدينة</th>
              <th>الهاتف</th>
              <th>الرقم الضريبي</th>
              <th style={{ textAlign: 'left' }}>الحد الائتماني</th>
              <th style={{ textAlign: 'left' }}>المستحقات</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map(s => (
              <tr key={s.id}>
                <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{s.code}</span></td>
                <td style={{ fontWeight: 500 }}>{s.nameAr}</td>
                <td>{s.contactPerson}</td>
                <td>{s.city}</td>
                <td className="numeric">{s.phone}</td>
                <td className="numeric">{s.taxNumber || '—'}</td>
                <td className="numeric" style={{ textAlign: 'left' }}>{s.creditLimit.toLocaleString('ar-SA')} ر.س</td>
                <td className="numeric" style={{ textAlign: 'left', fontWeight: 700, color: s.balance > 0 ? 'var(--color-error)' : 'inherit' }}>{s.balance.toLocaleString('ar-SA')} ر.س</td>
                <td>
                  <span className={`chip ${s.status === 'Active' ? 'chip-success' : 'chip-neutral'}`}>
                    {s.status === 'Active' ? 'نشط' : 'متوقف'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)} title="تعديل">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>
              {editItem ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}
            </h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>الاسم العربي للمورد *</label>
                  <input className="input" value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} required />
                </div>
                <div>
                  <label>الاسم الإنجليزي للمورد *</label>
                  <input className="input" value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} required />
                </div>
                <div>
                  <label>الشخص المسؤول *</label>
                  <input className="input" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} required />
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
                  <label>الرقم الضريبي (VAT) *</label>
                  <input className="input numeric" value={form.taxNumber} onChange={e => setForm({ ...form, taxNumber: e.target.value })} required />
                </div>
                <div>
                  <label>الحد الائتماني (ريال) *</label>
                  <input className="input numeric" type="number" value={form.creditLimit} onChange={e => setForm({ ...form, creditLimit: parseFloat(e.target.value) })} required />
                </div>
                <div>
                  <label>الرصيد الافتتاحي المستحق (إن وجد)</label>
                  <input className="input numeric" type="number" value={form.balance} onChange={e => setForm({ ...form, balance: parseFloat(e.target.value) })} disabled={!!editItem} />
                </div>
                <div>
                  <label>الحالة</label>
                  <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'Active' | 'Inactive' })}>
                    <option value="Active">نشط</option>
                    <option value="Inactive">متوقف</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
