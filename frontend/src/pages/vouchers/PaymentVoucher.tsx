import { useState } from 'react';

interface Payment {
  id: string;
  code: string;
  beneficiary: string;
  date: string;
  amount: number;
  paymentMethod: string;
  bankName: string;
  chequeNo: string;
  status: 'Draft' | 'Approved' | 'Posted';
}

interface AllocationLine {
  glAccount: string;
  costCenter: string;
  amount: number;
}

export default function PaymentVoucher() {
  const [payments, setPayments] = useState<Payment[]>([
    { id: '1', code: 'PV-000045', beneficiary: 'شركة البيان للمقاولات والتجارة', date: '١٤/٠٧/٢٠٢٥', amount: 23400, paymentMethod: 'تحويل بنكي', bankName: 'مصرف الراجحي', chequeNo: '—', status: 'Posted' },
    { id: '2', code: 'PV-000044', beneficiary: 'مؤسسة الرياض للتوريدات الكهربائية', date: '١٢/٠٧/٢٠٢٥', amount: 87900, paymentMethod: 'شيك', bankName: 'البنك الأهلي السعودي', chequeNo: 'CHQ-778844', status: 'Approved' }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [allocations, setAllocations] = useState<AllocationLine[]>([
    { glAccount: '5200 - مصاريف إدارية وعمومية', costCenter: 'HQ - الإدارة العامة', amount: 0 }
  ]);

  const [form, setForm] = useState({
    beneficiary: 'شركة البيان للمقاولات والتجارة',
    date: '2025-07-14',
    paymentMethod: 'تحويل بنكي',
    bankName: '',
    chequeNo: '',
    description: '',
    status: 'Draft' as 'Draft' | 'Approved' | 'Posted'
  });

  const addAllocationLine = () => {
    setAllocations([...allocations, { glAccount: '5200 - مصاريف إدارية وعمومية', costCenter: 'HQ - الإدارة العامة', amount: 0 }]);
  };

  const totalAllocated = allocations.reduce((sum, line) => sum + line.amount, 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const code = 'PV-' + String(payments.length + 45).padStart(6, '0');
    setPayments([...payments, {
      id: Date.now().toString(),
      code,
      beneficiary: form.beneficiary,
      date: '١٤/٠٧/٢٠٢٥',
      amount: totalAllocated || 100,
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
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>سندات الصرف (المدفوعات والمصاريف)</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          إنشاء سند صرف جديد
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>رقم السند</th>
              <th>المستفيد / المورد</th>
              <th>تاريخ السند</th>
              <th style={{ textAlign: 'left' }}>القيمة المصروفة</th>
              <th>طريقة الدفع</th>
              <th>المصرف المصدر</th>
              <th>رقم الشيك</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id}>
                <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{p.code}</span></td>
                <td style={{ fontWeight: 500 }}>{p.beneficiary}</td>
                <td className="numeric">{p.date}</td>
                <td className="numeric" style={{ textAlign: 'left', fontWeight: 700 }}>{p.amount.toLocaleString('ar-SA')} ر.س</td>
                <td>{p.paymentMethod}</td>
                <td>{p.bankName}</td>
                <td className="numeric">{p.chequeNo}</td>
                <td>
                  <span className={`chip ${
                    p.status === 'Posted' ? 'chip-success' :
                    p.status === 'Approved' ? 'chip-info' : 'chip-neutral'
                  }`}>
                    {p.status === 'Posted' ? 'مرحل مالياً' :
                     p.status === 'Approved' ? 'معتمد' : 'مسودة'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => alert('محاكاة: طباعة سند الصرف مع التوقيعات')} title="طباعة">
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
          <div className="modal-box" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>إصدار سند صرف جديد</h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>المستفيد / المورد *</label>
                  <input className="input" value={form.beneficiary} onChange={e => setForm({ ...form, beneficiary: e.target.value })} required placeholder="اسم الشخص أو المورد" />
                </div>
                <div>
                  <label>تاريخ السند *</label>
                  <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div>
                  <label>طريقة الدفع *</label>
                  <select className="input" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                    <option value="تحويل بنكي">تحويل بنكي</option>
                    <option value="نقداً">نقداً</option>
                    <option value="شيك">شيك</option>
                  </select>
                </div>
                <div>
                  <label>رقم الشيك (إن وجد)</label>
                  <input className="input numeric" value={form.chequeNo} onChange={e => setForm({ ...form, chequeNo: e.target.value })} />
                </div>
                <div>
                  <label>حساب البنك / الخزينة الممول *</label>
                  <input className="input" value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} placeholder="مثال: البنك الأهلي - حساب رئيسي" required />
                </div>
                <div>
                  <label>الحالة</label>
                  <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
                    <option value="Draft">مسودة</option>
                    <option value="Approved">معتمد</option>
                    <option value="Posted">ترحيل ومطابقة</option>
                  </select>
                </div>
              </div>

              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '0.5rem', margin: '0.5rem 0 0' }}>توزيع بنود الصرف والتكلفة (Expense Allocation)</h3>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                    <th style={{ textAlign: 'right', padding: '0.5rem', fontSize: '0.8125rem' }}>حساب المصروف</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem', fontSize: '0.8125rem' }}>مركز التكلفة</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem', fontSize: '0.8125rem', width: '25%' }}>القيمة بالريال *</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((line, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--color-surface-container)' }}>
                      <td style={{ padding: '0.5rem' }}>
                        <select className="input" value={line.glAccount} onChange={e => {
                          const newLines = [...allocations];
                          newLines[idx].glAccount = e.target.value;
                          setAllocations(newLines);
                        }}>
                          <option value="5200 - مصاريف إدارية وعمومية">5200 - مصاريف إدارية وعمومية</option>
                          <option value="5300 - مصاريف رواتب">5300 - مصاريف رواتب</option>
                          <option value="5201 - مصاريف إيجار وتراخيص">5201 - مصاريف إيجار وتراخيص</option>
                        </select>
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <select className="input" value={line.costCenter} onChange={e => {
                          const newLines = [...allocations];
                          newLines[idx].costCenter = e.target.value;
                          setAllocations(newLines);
                        }}>
                          <option value="HQ - الإدارة العامة">HQ - الإدارة العامة</option>
                          <option value="MKT - التسويق والمبيعات">MKT - التسويق والمبيعات</option>
                        </select>
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input className="input numeric" type="number" min="1" value={line.amount || ''} onChange={e => {
                          const newLines = [...allocations];
                          newLines[idx].amount = parseFloat(e.target.value) || 0;
                          setAllocations(newLines);
                        }} style={{ textAlign: 'left' }} required />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addAllocationLine}>إضافة سطر مصروف</button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.9375rem', fontWeight: 700, gap: '1rem' }}>
                <span>إجمالي المبلغ الموزع:</span>
                <span className="numeric" style={{ color: 'var(--color-primary)' }}>{totalAllocated.toLocaleString('ar-SA')} ر.س</span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--color-outline-variant)', paddingTop: '1.25rem' }}>
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
