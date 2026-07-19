import { useState } from 'react';

interface Receipt {
  id: string;
  code: string;
  customer: string;
  date: string;
  amount: number;
  paymentMethod: string;
  bankName: string;
  chequeNo: string;
  status: 'Draft' | 'Approved' | 'Posted';
}

export default function ReceiptVoucher() {
  const [receipts, setReceipts] = useState<Receipt[]>([
    { id: '1', code: 'RV-000089', customer: 'شركة الأفق للتجارة', date: '١٤/٠٧/٢٠٢٥', amount: 45600, paymentMethod: 'تحويل بنكي', bankName: 'مصرف الراجحي', chequeNo: '—', status: 'Posted' },
    { id: '2', code: 'RV-000088', customer: 'مؤسسة التقنية العالية', date: '١٢/٠٧/٢٠٢٥', amount: 12500, paymentMethod: 'شيك', bankName: 'البنك الأهلي السعودي', chequeNo: 'CHQ-998822', status: 'Approved' }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    customer: 'شركة الأفق للتجارة',
    date: '2025-07-14',
    amount: 0,
    paymentMethod: 'تحويل بنكي',
    bankName: '',
    chequeNo: '',
    description: '',
    status: 'Draft' as 'Draft' | 'Approved' | 'Posted'
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const code = 'RV-' + String(receipts.length + 89).padStart(6, '0');
    setReceipts([...receipts, {
      id: Date.now().toString(),
      code,
      customer: form.customer,
      date: '١٤/٠٧/٢٠٢٥',
      amount: form.amount,
      paymentMethod: form.paymentMethod,
      bankName: form.bankName || '—',
      chequeNo: form.chequeNo || '—',
      status: form.status
    }]);
    setShowModal(false);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>سندات القبض (مقبوضات العملاء)</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          إنشاء سند قبض جديد
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>رقم السند</th>
              <th>العميل المستلم منه</th>
              <th>تاريخ السند</th>
              <th style={{ textAlign: 'left' }}>القيمة المستلمة</th>
              <th>طريقة الدفع</th>
              <th>المصرف المستلم</th>
              <th>رقم الشيك</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map(r => (
              <tr key={r.id}>
                <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{r.code}</span></td>
                <td style={{ fontWeight: 500 }}>{r.customer}</td>
                <td className="numeric">{r.date}</td>
                <td className="numeric" style={{ textAlign: 'left', fontWeight: 700 }}>{r.amount.toLocaleString('ar-SA')} ر.س</td>
                <td>{r.paymentMethod}</td>
                <td>{r.bankName}</td>
                <td className="numeric">{r.chequeNo}</td>
                <td>
                  <span className={`chip ${
                    r.status === 'Posted' ? 'chip-success' :
                    r.status === 'Approved' ? 'chip-info' : 'chip-neutral'
                  }`}>
                    {r.status === 'Posted' ? 'مرحل مالياً' :
                     r.status === 'Approved' ? 'معتمد' : 'مسودة'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => alert('محاكاة: طباعة سند القبض الضريبي')} title="طباعة">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>
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
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>إصدار سند قبض جديد</h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>المستلم من (العميل) *</label>
                  <select className="input" value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })}>
                    <option value="شركة الأفق للتجارة">شركة الأفق للتجارة</option>
                    <option value="مؤسسة التقنية العالية">مؤسسة التقنية العالية</option>
                  </select>
                </div>
                <div>
                  <label>القيمة المستلمة بالريال *</label>
                  <input className="input numeric" type="number" min="1" value={form.amount} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) })} required />
                </div>
                <div>
                  <label>تاريخ السند *</label>
                  <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div>
                  <label>طريقة القبض *</label>
                  <select className="input" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                    <option value="تحويل بنكي">تحويل بنكي</option>
                    <option value="نقداً">نقداً</option>
                    <option value="شيك">شيك</option>
                  </select>
                </div>
                <div>
                  <label>اسم البنك / الصندوق المستلم</label>
                  <input className="input" value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} placeholder="مثال: مصرف الراجحي" />
                </div>
                <div>
                  <label>رقم الشيك (إن وجد)</label>
                  <input className="input numeric" value={form.chequeNo} onChange={e => setForm({ ...form, chequeNo: e.target.value })} />
                </div>
                <div>
                  <label>الحالة</label>
                  <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
                    <option value="Draft">مسودة</option>
                    <option value="Approved">معتمد</option>
                    <option value="Posted">ترحيل ومطابقة الفاتورة</option>
                  </select>
                </div>
              </div>
              <div>
                <label>البيان / الوصف التفصيلي</label>
                <textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ السند</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
