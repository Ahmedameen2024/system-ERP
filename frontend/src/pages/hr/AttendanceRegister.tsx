import { useState } from 'react';

interface AttendanceRecord {
  id: string;
  empCode: string;
  name: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workHours: number;
  status: 'Present' | 'Absent' | 'Leave' | 'Late';
}

export default function AttendanceRegister() {
  const [records, setRecords] = useState<AttendanceRecord[]>([
    { id: '1', empCode: 'EMP-001', name: 'سعد القحطاني', date: '١٤/٠٧/٢٠٢٥', checkIn: '٠٨:٠٢', checkOut: '١٦:٠٠', workHours: 8, status: 'Present' },
    { id: '2', empCode: 'EMP-002', name: 'فهد المطيري', date: '١٤/٠٧/٢٠٢٥', checkIn: '٠٨:٢٥', checkOut: '١٦:٠٠', workHours: 7.5, status: 'Late' },
    { id: '3', empCode: 'EMP-003', name: 'رانيا الحربي', date: '١٤/٠٧/٢٠٢٥', checkIn: '—', checkOut: '—', workHours: 0, status: 'Leave' }
  ]);

  const [filterDate, setFilterDate] = useState('2025-07-14');

  const simulateBiometricLog = () => {
    alert('تم محاكاة سحب البيانات من جهاز الحضور والانصراف البصمي (بصمة الإصبع / العين) بنجاح!');
  };

  const markCheckIn = (id: string) => {
    const time = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: false });
    setRecords(records.map(r => r.id === id ? { ...r, checkIn: time, status: 'Present' } : r));
  };

  const markCheckOut = (id: string) => {
    const time = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: false });
    setRecords(records.map(r => r.id === id ? { ...r, checkOut: time, workHours: 8 } : r));
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>تسجيل الحضور اليومي</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={simulateBiometricLog}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>fingerprint</span>
            سحب بصمات البصمة
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <label style={{ margin: 0 }}>تحديد التاريخ المحاسبي اليومي:</label>
        <input type="date" className="input" style={{ maxWidth: 180 }} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>كود الموظف</th>
              <th>اسم الموظف</th>
              <th>التاريخ اليومي</th>
              <th style={{ textAlign: 'center' }}>وقت الحضور</th>
              <th style={{ textAlign: 'center' }}>وقت الانصراف</th>
              <th style={{ textAlign: 'center' }}>ساعات العمل</th>
              <th>الحالة</th>
              <th>الإجراءات السريعة للمحاسب</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id}>
                <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{r.empCode}</span></td>
                <td style={{ fontWeight: 500 }}>{r.name}</td>
                <td className="numeric">{r.date}</td>
                <td className="numeric" style={{ textAlign: 'center' }}>{r.checkIn}</td>
                <td className="numeric" style={{ textAlign: 'center' }}>{r.checkOut}</td>
                <td className="numeric" style={{ textAlign: 'center' }}>{r.workHours} ساعة</td>
                <td>
                  <span className={`chip ${
                    r.status === 'Present' ? 'chip-success' :
                    r.status === 'Late' ? 'chip-warning' :
                    r.status === 'Leave' ? 'chip-info' : 'chip-error'
                  }`}>
                    {r.status === 'Present' ? 'حاضر' :
                     r.status === 'Late' ? 'متأخر' :
                     r.status === 'Leave' ? 'إجازة' : 'غائب'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => markCheckIn(r.id)} disabled={r.checkIn !== '—'}>بصمة حضور</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => markCheckOut(r.id)} disabled={r.checkOut !== '—' || r.checkIn === '—'}>بصمة انصراف</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
