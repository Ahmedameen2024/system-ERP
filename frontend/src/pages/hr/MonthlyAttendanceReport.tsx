import { useState } from 'react';

interface AttendanceReportRow {
  empCode: string;
  name: string;
  department: string;
  presentDays: number;
  absentDays: number;
  lateHours: number;
  overtimeHours: number;
  netWorkHours: number;
}

export default function MonthlyAttendanceReport() {
  const [reportRows] = useState<AttendanceReportRow[]>([
    { empCode: 'EMP-001', name: 'سعد القحطاني', department: 'الإدارة العامة', presentDays: 22, absentDays: 0, lateHours: 0, overtimeHours: 12, netWorkHours: 188 },
    { empCode: 'EMP-002', name: 'فهد المطيري', department: 'المبيعات التسويق', presentDays: 20, absentDays: 2, lateHours: 4.5, overtimeHours: 5, netWorkHours: 165 },
    { empCode: 'EMP-003', name: 'رانيا الحربي', department: 'الحسابات والميزانية', presentDays: 15, absentDays: 0, lateHours: 1, overtimeHours: 0, netWorkHours: 120 }
  ]);

  const [selectedMonth, setSelectedMonth] = useState('06');
  const [selectedYear, setSelectedYear] = useState('2025');

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>تقرير الحضور والانصراف الشهري</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>
            طباعة التقرير
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ margin: 0 }}>تحديد الشهر والسنوات:</label>
        <select className="input" style={{ maxWidth: 120 }} value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
          <option value="01">يناير</option>
          <option value="02">فبراير</option>
          <option value="03">مارس</option>
          <option value="04">أبريل</option>
          <option value="05">مايو</option>
          <option value="06">يونيو</option>
          <option value="07">يوليو</option>
        </select>
        <select className="input" style={{ maxWidth: 100 }} value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>كود الموظف</th>
              <th>اسم الموظف</th>
              <th>القسم</th>
              <th style={{ textAlign: 'center' }}>أيام الحضور</th>
              <th style={{ textAlign: 'center' }}>أيام الغياب</th>
              <th style={{ textAlign: 'center' }}>ساعات التأخير</th>
              <th style={{ textAlign: 'center' }}>ساعات الإضافي</th>
              <th style={{ textAlign: 'center' }}>صافي ساعات العمل</th>
            </tr>
          </thead>
          <tbody>
            {reportRows.map(row => (
              <tr key={row.empCode}>
                <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{row.empCode}</span></td>
                <td style={{ fontWeight: 500 }}>{row.name}</td>
                <td>{row.department}</td>
                <td className="numeric" style={{ textAlign: 'center', color: '#059669', fontWeight: 700 }}>{row.presentDays} يوم</td>
                <td className="numeric" style={{ textAlign: 'center', color: row.absentDays > 0 ? '#ba1a1a' : 'inherit' }}>{row.absentDays} يوم</td>
                <td className="numeric" style={{ textAlign: 'center', color: row.lateHours > 0 ? '#d97706' : 'inherit' }}>{row.lateHours} س</td>
                <td className="numeric" style={{ textAlign: 'center', color: '#059669' }}>{row.overtimeHours} س</td>
                <td className="numeric" style={{ textAlign: 'center', fontWeight: 700 }}>{row.netWorkHours} ساعة</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
