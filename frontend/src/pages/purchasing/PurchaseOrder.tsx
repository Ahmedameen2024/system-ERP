import { useState } from 'react';

interface POLine {
  itemId: string;
  itemName: string;
  uom: string;
  qty: number;
  cost: number;
  taxPct: number;
}

export default function PurchaseOrder() {
  const [orders, setOrders] = useState([
    { id: '1', code: 'PO-0020', supplier: 'شركة البيان للمقاولات والتجارة', date: '١٤/٠٧/٢٠٢٥', amount: 23400, status: 'FullyReceived' },
    { id: '2', code: 'PO-0019', supplier: 'مؤسسة الرياض للتوريدات الكهربائية', date: '١٢/٠٧/٢٠٢٥', amount: 87900, status: 'PartiallyReceived' },
    { id: '3', code: 'PO-0018', supplier: 'المصنع السعودي الموحد', date: '١٠/٠٧/٢٠٢٥', amount: 120000, status: 'Approved' }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [lines, setLines] = useState<POLine[]>([
    { itemId: '1', itemName: 'شاشة سامسونج LED 55 بوصة', uom: 'PCS', qty: 10, cost: 2000, taxPct: 15 }
  ]);

  const [form, setForm] = useState({
    supplier: 'شركة البيان للمقاولات والتجارة',
    date: '2025-07-14',
    status: 'Approved' as any
  });

  const addLine = () => {
    setLines([...lines, { itemId: '', itemName: '', uom: 'PCS', qty: 1, cost: 0, taxPct: 15 }]);
  };

  const removeLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const subtotal = lines.reduce((sum, line) => sum + (line.qty * line.cost), 0);
  const totalTax = subtotal * 0.15;
  const grandTotal = subtotal + totalTax;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const code = 'PO-' + String(orders.length + 1).padStart(4, '0');
    setOrders([...orders, { id: Date.now().toString(), code, supplier: form.supplier, date: '١٤/٠٧/٢٠٢٥', amount: grandTotal, status: form.status }]);
    setShowModal(false);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>أوامر الشراء</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          أمر شراء جديد
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>رقم الأمر</th>
              <th>المورد</th>
              <th>التاريخ</th>
              <th style={{ textAlign: 'left' }}>القيمة الكلية</th>
              <th>حالة الاستلام</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{order.code}</span></td>
                <td style={{ fontWeight: 500 }}>{order.supplier}</td>
                <td className="numeric">{order.date}</td>
                <td className="numeric" style={{ textAlign: 'left', fontWeight: 700 }}>{order.amount.toLocaleString('ar-SA')} ر.س</td>
                <td>
                  <span className={`chip ${
                    order.status === 'FullyReceived' ? 'chip-success' :
                    order.status === 'PartiallyReceived' ? 'chip-warning' : 'chip-info'
                  }`}>
                    {order.status === 'FullyReceived' ? 'مستلم بالكامل' :
                     order.status === 'PartiallyReceived' ? 'مستلم جزئياً' : 'معتمد'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => alert('تمت محاكاة استلام البضاعة في المستودع الرئيسي بنجاح')} title="استلام البضاعة" disabled={order.status === 'FullyReceived'}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>move_to_inbox</span>
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
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>إنشاء أمر شراء جديد</h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>المورد *</label>
                  <select className="input" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}>
                    <option value="شركة البيان للمقاولات والتجارة">شركة البيان للمقاولات والتجارة</option>
                    <option value="مؤسسة الرياض للتوريدات الكهربائية">مؤسسة الرياض للتوريدات الكهربائية</option>
                    <option value="المصنع السعودي الموحد">المصنع السعودي الموحد</option>
                  </select>
                </div>
                <div>
                  <label>التاريخ *</label>
                  <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>
              </div>

              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, margin: '1rem 0 0.5rem' }}>البنود</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>الوصف</th>
                    <th style={{ width: '15%', padding: '0.5rem' }}>الكمية</th>
                    <th style={{ width: '20%', padding: '0.5rem' }}>سعر التكلفة</th>
                    <th style={{ width: '5%', padding: '0.5rem' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-surface-container)' }}>
                      <td style={{ padding: '0.5rem' }}>
                        <input className="input" placeholder="اسم الصنف" value={l.itemName} onChange={e => {
                          const newLines = [...lines];
                          newLines[i].itemName = e.target.value;
                          setLines(newLines);
                        }} required />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input className="input numeric" type="number" min="1" value={l.qty} onChange={e => {
                          const newLines = [...lines];
                          newLines[i].qty = parseFloat(e.target.value);
                          setLines(newLines);
                        }} required />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input className="input numeric" type="number" min="0" value={l.cost} onChange={e => {
                          const newLines = [...lines];
                          newLines[i].cost = parseFloat(e.target.value);
                          setLines(newLines);
                        }} required />
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={() => removeLine(i)} disabled={lines.length === 1}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}>إضافة صنف</button>
              </div>

              <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', marginTop: '1rem', borderTop: '1px solid var(--color-outline-variant)', paddingTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ الأمر</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
