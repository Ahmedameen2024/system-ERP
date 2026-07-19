import { useState } from 'react';

interface PayrollLine {
  code: string;
  name: string;
  basic: number;
  housing: number;
  transport: number;
  otherAllowances: number;
  gosiEmployee: number;
  deductions: number;
  net: number;
}

export default function PayrollSheet() {
  const [lines] = useState<PayrollLine[]>([
    { code: 'EMP-001', name: 'سعد القحطاني', basic: 15000, housing: 3750, transport: 1000, otherAllowances: 500, gosiEmployee: 1462.5, deductions: 0, net: 18787.5 },
    { code: 'EMP-002', name: 'فهد المطيري', basic: 8500, housing: 2125, transport: 800, otherAllowances: 200, gosiEmployee: 828.75, deductions: 450, net: 10346.25 },
    { code: 'EMP-003', name: 'رانيا الحربي', basic: 9000, housing: 2250, transport: 800, otherAllowances: 0, gosiEmployee: 877.5, deductions: 0, net: 11172.5 }
  ]);

  const [month, setMonth] = useState('06');
  const [year, setYear] = useState('2025');
  const [status, setStatus] = useState<'Draft' | 'Calculated' | 'Approved' | 'Posted'>('Calculated');

  const totalBasic = lines.reduce((sum, l) => sum + l.basic, 0);
  const totalNet = lines.reduce((sum, l) => sum + l.net, 0);

  const calculatePayroll = () => {
    setStatus('Calculated');
    alert('تم احتساب مسيرات رواتب الموظفين للشهر المحدد بناءً على سجلات البصمة، الإجازات، وقواعد التأمينات الاجتماعية GOSI بنجاح!');
  };

  const approvePayroll = () => {
    setStatus('Approved');
    alert('تم اعتماد مسير الرواتب وإرساله للإدارة المالية للتوجيه والمطابقة البنكية.');
  };

  const postToLedger = () => {
    setStatus('Posted');
    alert('تم ترحيل مسير الرواتب بنجاح وقيد الاستحقاق آلياً (مدين: مصروف رواتب وبدلات، دائن: رواتب مستحقة الدفع / التأمينات الاجتماعية).');
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>مسير الرواتب الشهري (Payroll)</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={calculatePayroll} disabled={status === 'Posted'}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>calculate</span>
            احتساب الرواتب
          </button>
          <button className="btn btn-secondary btn-sm" onClick={approvePayroll} disabled={status !== 'Calculated'}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock_open</span>
            اعتماد المسير
          </button>
          <button className="btn btn-primary btn-sm" onClick={postToLedger} disabled={status !== 'Approved'}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>publish</span>
            ترحيل للحسابات
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <label style={{ margin: 0 }}>فترة الرواتب:</label>
          <select className="input" style={{ maxWidth: 120 }} value={month} onChange={e => setMonth(e.target.value)}>
            <option value="06">يونيو</option>
            <option value="07">يوليو</option>
          </select>
          <select className="input" style={{ maxWidth: 100 }} value={year} onChange={e => setYear(e.target.value)}>
            <option value="2025">2025</option>
          </select>
        </div>

        <div>
          <span>حالة المسير: </span>
          <span className={`chip ${
            status === 'Posted' ? 'chip-success' :
            status === 'Approved' ? 'chip-info' :
            status === 'Calculated' ? 'chip-warning' : 'chip-neutral'
          }`}>
            {status === 'Posted' ? 'مرحّل للقيود اليومية' :
             status === 'Approved' ? 'معتمَد مالياً' :
             status === 'Calculated' ? 'تم الاحتساب (مسودة)' : 'غير محتسب بعد'}
          </span>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="data-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>كود الموظف</th>
              <th>الموظف</th>
              <th style={{ textAlign: 'left' }}>الراتب الأساسي</th>
              <th style={{ textAlign: 'left' }}>بدل السكن</th>
              <th style={{ textAlign: 'left' }}>بدل النقل</th>
              <th style={{ textAlign: 'left' }}>بدلات أخرى</th>
              <th style={{ textAlign: 'left' }}>تأمينات GOSI</th>
              <th style={{ textAlign: 'left' }}>استقطاعات وغيابات</th>
              <th style={{ textAlign: 'left' }}>صافي الراتب</th>
            </tr>
          </thead>
          <tbody>
            {lines.map(l => (
              <tr key={l.code}>
                <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{l.code}</span></td>
                <td style={{ fontWeight: 500 }}>{l.name}</td>
                <td className="numeric" style={{ textAlign: 'left' }}>{l.basic.toLocaleString('ar-SA')} ر.س</td>
                <td className="numeric" style={{ textAlign: 'left' }}>{l.housing.toLocaleString('ar-SA')} ر.س</td>
                <td className="numeric" style={{ textAlign: 'left' }}>{l.transport.toLocaleString('ar-SA')} ر.س</td>
                <td className="numeric" style={{ textAlign: 'left' }}>{l.otherAllowances.toLocaleString('ar-SA')} ر.س</td>
                <td className="numeric" style={{ textAlign: 'left', color: '#ba1a1a' }}>-{l.gosiEmployee.toLocaleString('ar-SA')} ر.س</td>
                <td className="numeric" style={{ textAlign: 'left', color: l.deductions > 0 ? '#ba1a1a' : 'inherit' }}>{l.deductions > 0 ? `-${l.deductions.toLocaleString('ar-SA')} ر.س` : '—'}</td>
                <td className="numeric" style={{ textAlign: 'left', fontWeight: 800, color: 'var(--color-primary)' }}>{l.net.toLocaleString('ar-SA')} ر.س</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--color-surface-container)', fontWeight: 800 }}>
              <td colSpan={2} style={{ padding: '0.875rem 1rem' }}>الإجمالي</td>
              <td className="numeric" style={{ padding: '0.875rem 1rem', textAlign: 'left' }}>{totalBasic.toLocaleString('ar-SA')} ر.س</td>
              <td colSpan={5} style={{ padding: '0.875rem 1rem' }}></td>
              <td className="numeric" style={{ padding: '0.875rem 1rem', textAlign: 'left', color: 'var(--color-primary)', fontSize: '0.9375rem' }}>{totalNet.toLocaleString('ar-SA')} ر.س</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
