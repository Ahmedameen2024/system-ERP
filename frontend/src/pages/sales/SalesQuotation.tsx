import { useState } from 'react';

interface Quotation {
  id: string;
  code: string;
  customer: string;
  date: string;
  validUntil: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
}

export default function SalesQuotation() {
  const [quotations, setQuotations] = useState<Quotation[]>([
    { id: '1', code: 'QT-0001', customer: 'شركة الأفق للتجارة', date: '١٢/٠٧/٢٠٢٥', validUntil: '٢٦/٠٧/٢٠٢٥', amount: 45600, status: 'Sent' },
    { id: '2', code: 'QT-0002', customer: 'مؤسسة التقنية العالية', date: '١٤/٠٧/٢٠٢٥', validUntil: '٢٨/٠٧/٢٠٢٥', amount: 12500, status: 'Draft' },
    { id: '3', code: 'QT-0003', customer: 'شركة البناء الحديث', date: '١٠/٠٧/٢٠٢٥', validUntil: '٢٤/٠٧/٢٠٢٥', amount: 87900, status: 'Accepted' }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Quotation | null>(null);
  const [form, setForm] = useState({
    customer: 'شركة الأفق للتجارة',
    date: '2025-07-14',
    validUntil: '2025-07-28',
    amount: 0,
    status: 'Draft' as any
  });

  const openAdd = () => {
    setEditItem(null);
    setForm({ customer: 'شركة الأفق للتجارة', date: '2025-07-14', validUntil: '2025-07-28', amount: 0, status: 'Draft' });
    setShowModal(true);
  };

  const openEdit = (q: Quotation) => {
    setEditItem(q);
    setForm({ customer: q.customer, date: '2025-07-14', validUntil: '2025-07-28', amount: q.amount, status: q.status });
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editItem) {
      setQuotations(quotations.map(q => q.id === editItem.id ? { ...q, ...form } : q));
    } else {
      const code = 'QT-' + String(quotations.length + 1).padStart(4, '0');
      setQuotations([...quotations, { id: Date.now().toString(), ...form, code, date: '١٤/٠٧/٢٠٢٥', validUntil: '٢٨/٠٧/٢٠٢٥' }]);
    }
    setShowModal(false);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>عروض الأسعار</h1>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          عرض سعر جديد
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>رقم العرض</th>
              <th>العميل</th>
              <th>التاريخ</th>
              <th>صالح حتى</th>
              <th style={{ textAlign: 'left' }}>المبلغ الإجمالي</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {quotations.map(q => (
              <tr key={q.id}>
                <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{q.code}</span></td>
                <td style={{ fontWeight: 500 }}>{q.customer}</td>
                <td className="numeric">{q.date}</td>
                <td className="numeric">{q.validUntil}</td>
                <td className="numeric" style={{ textAlign: 'left', fontWeight: 700 }}>{q.amount.toLocaleString('ar-SA')} ر.س</td>
                <td>
                  <span className={`chip ${
                    q.status === 'Accepted' ? 'chip-success' :
                    q.status === 'Sent' ? 'chip-info' :
                    q.status === 'Draft' ? 'chip-neutral' :
                    q.status === 'Rejected' ? 'chip-error' : 'chip-warning'
                  }`}>
                    {q.status === 'Accepted' ? 'مقبول' :
                     q.status === 'Sent' ? 'مرسل' :
                     q.status === 'Draft' ? 'مسودة' :
                     q.status === 'Rejected' ? 'مرفوض' : 'منتهي'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(q)} title="تعديل">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => alert('تمت محاكاة تحويل عرض السعر إلى فاتورة مبيعات بنجاح')} title="تحويل لفاتورة" disabled={q.status !== 'Accepted'}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>swap_horiz</span>
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
              {editItem ? 'تعديل عرض السعر' : 'إضافة عرض سعر جديد'}
            </h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>العميل *</label>
                  <select className="input" value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })}>
                    <option value="شركة الأفق للتجارة">شركة الأفق للتجارة</option>
                    <option value="مؤسسة التقنية العالية">مؤسسة التقنية العالية</option>
                    <option value="شركة البناء الحديث">شركة البناء الحديث</option>
                  </select>
                </div>
                <div>
                  <label>المبلغ التقديري الإجمالي *</label>
                  <input className="input numeric" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) })} required />
                </div>
                <div>
                  <label>تاريخ عرض السعر *</label>
                  <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div>
                  <label>صالح حتى تاريخ *</label>
                  <input className="input" type="date" value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })} required />
                </div>
                <div>
                  <label>الحالة</label>
                  <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
                    <option value="Draft">مسودة</option>
                    <option value="Sent">مرسل</option>
                    <option value="Accepted">مقبول</option>
                    <option value="Rejected">مرفوض</option>
                    <option value="Expired">منتهي</option>
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
