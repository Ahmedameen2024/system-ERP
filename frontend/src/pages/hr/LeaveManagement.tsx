import { useState } from 'react';

interface LeaveRequest {
  id: string;
  code: string;
  employee: string;
  type: string;
  start: string;
  end: string;
  days: number;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export default function LeaveManagement() {
  const [requests, setRequests] = useState<LeaveRequest[]>([
    { id: '1', code: 'LR-0004', employee: 'رانيا الحربي', type: 'إجازة سنوية', start: '٢٠٢٥/٠٧/١٥', end: '٢٠٢٥/٠٧/٣٠', days: 15, status: 'Approved' },
    { id: '2', code: 'LR-0005', employee: 'فهد المطيري', type: 'إجازة مرضية', start: '٢٠٢٥/٠٧/٢٠', end: '٢٠٢٥/٠٧/٢٢', days: 3, status: 'Pending' }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    employee: 'فهد المطيري',
    type: 'إجازة سنوية',
    start: '2025-07-20',
    end: '2025-07-23',
    days: 3,
    status: 'Pending' as any
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const code = 'LR-' + String(requests.length + 5).padStart(4, '0');
    setRequests([...requests, {
      id: Date.now().toString(),
      code,
      employee: form.employee,
      type: form.type,
      start: '٢٠٢٥/٠٧/٢٠',
      end: '٢٠٢٥/٠٧/٢٣',
      days: form.days,
      status: form.status
    }]);
    setShowModal(false);
  };

  const updateStatus = (id: string, newStatus: 'Approved' | 'Rejected') => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>طلبات وإدارة الإجازات</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          تقديم طلب إجازة
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>رقم الطلب</th>
              <th>الموظف</th>
              <th>نوع الإجازة</th>
              <th>تاريخ البدء</th>
              <th>تاريخ الانتهاء</th>
              <th style={{ textAlign: 'center' }}>المدة المطلوبة</th>
              <th>الحالة</th>
              <th>إجراءات الاعتماد</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id}>
                <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{r.code}</span></td>
                <td style={{ fontWeight: 500 }}>{r.employee}</td>
                <td>{r.type}</td>
                <td className="numeric">{r.start}</td>
                <td className="numeric">{r.end}</td>
                <td className="numeric" style={{ textAlign: 'center' }}>{r.days} يوم</td>
                <td>
                  <span className={`chip ${
                    r.status === 'Approved' ? 'chip-success' :
                    r.status === 'Pending' ? 'chip-warning' : 'chip-error'
                  }`}>
                    {r.status === 'Approved' ? 'معتمدة ومرحلة' :
                     r.status === 'Pending' ? 'بانتظار الموافقة' : 'مرفوضة'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <button className="btn btn-ghost btn-sm text-success" onClick={() => updateStatus(r.id, 'Approved')} disabled={r.status !== 'Pending'} title="موافقة">
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
                    </button>
                    <button className="btn btn-ghost btn-sm text-danger" onClick={() => updateStatus(r.id, 'Rejected')} disabled={r.status !== 'Pending'} title="رفض">
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>cancel</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>تقديم طلب إجازة جديد</h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>الموظف *</label>
                  <select className="input" value={form.employee} onChange={e => setForm({ ...form, employee: e.target.value })}>
                    <option value="سعد القحطاني">سعد القحطاني</option>
                    <option value="فهد المطيري">فهد المطيري</option>
                    <option value="رانيا الحربي">رانيا الحربي</option>
                  </select>
                </div>
                <div>
                  <label>نوع الإجازة *</label>
                  <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="إجازة سنوية">إجازة سنوية</option>
                    <option value="إجازة مرضية">إجازة مرضية</option>
                    <option value="إجازة بدون راتب">إجازة بدون راتب</option>
                  </select>
                </div>
                <div>
                  <label>تاريخ البدء *</label>
                  <input className="input" type="date" value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} required />
                </div>
                <div>
                  <label>تاريخ الانتهاء *</label>
                  <input className="input" type="date" value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} required />
                </div>
                <div>
                  <label>المدة بالأيام *</label>
                  <input className="input numeric" type="number" value={form.days} onChange={e => setForm({ ...form, days: parseInt(e.target.value) })} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">تقديم الطلب</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
