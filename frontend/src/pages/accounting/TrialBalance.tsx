export default function TrialBalance() {
  const accounts = [
    { code: '1100', name: 'النقدية والبنوك', type: 'Asset', debit: 450000, credit: 0 },
    { code: '1200', name: 'ذمم مدينة', type: 'Asset', debit: 234500, credit: 0 },
    { code: '1300', name: 'مخزون البضاعة', type: 'Asset', debit: 567800, credit: 0 },
    { code: '1500', name: 'أصول ثابتة', type: 'Asset', debit: 1093378, credit: 0 },
    { code: '2100', name: 'ذمم دائنة', type: 'Liability', debit: 0, credit: 345000 },
    { code: '2200', name: 'قروض بنكية', type: 'Liability', debit: 0, credit: 444456 },
    { code: '3100', name: 'رأس المال', type: 'Equity', debit: 0, credit: 1000000 },
    { code: '3200', name: 'الأرباح المبقاة', type: 'Equity', debit: 0, credit: 556222 },
    { code: '4100', name: 'إيرادات المبيعات', type: 'Revenue', debit: 0, credit: 234567 },
    { code: '5100', name: 'تكلفة البضاعة المباعة', type: 'Expense', debit: 123456, credit: 0 },
    { code: '5200', name: 'مصاريف إدارية وعمومية', type: 'Expense', debit: 87900, credit: 0 },
    { code: '5300', name: 'مصاريف رواتب', type: 'Expense', debit: 123456, credit: 0 },
  ];
  const totalDebit = accounts.reduce((s, a) => s + a.debit, 0);
  const totalCredit = accounts.reduce((s, a) => s + a.credit, 0);
  const fmt = (n: number) => n.toLocaleString('ar-SA', { minimumFractionDigits: 2 });
  const typeColors: Record<string, string> = { Asset: '#059669', Liability: '#d97706', Equity: '#4c56af', Revenue: '#8237b2', Expense: '#ba1a1a' };
  const typeLabels: Record<string, string> = { Asset: 'أصول', Liability: 'التزامات', Equity: 'حقوق ملكية', Revenue: 'إيرادات', Expense: 'مصروفات' };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>ميزان المراجعة</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>تصدير Excel</button>
          <button className="btn btn-secondary btn-sm"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>طباعة</button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <select className="input" style={{ maxWidth: 180 }}><option>السنة المالية 2025</option></select>
        <select className="input" style={{ maxWidth: 180 }}><option>كل الفترات</option></select>
        <input type="date" className="input" style={{ maxWidth: 160 }} />
        <input type="date" className="input" style={{ maxWidth: 160 }} />
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>رقم الحساب</th>
              <th>اسم الحساب</th>
              <th>النوع</th>
              <th style={{ textAlign: 'left' }}>الأرصدة المدينة</th>
              <th style={{ textAlign: 'left' }}>الأرصدة الدائنة</th>
              <th style={{ textAlign: 'left' }}>الرصيد</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(a => (
              <tr key={a.code}>
                <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{a.code}</span></td>
                <td style={{ fontWeight: 500 }}>{a.name}</td>
                <td><span className="chip" style={{ background: `${typeColors[a.type]}15`, color: typeColors[a.type] }}>{typeLabels[a.type]}</span></td>
                <td className="numeric" style={{ textAlign: 'left' }}>{a.debit > 0 ? fmt(a.debit) : '—'}</td>
                <td className="numeric" style={{ textAlign: 'left' }}>{a.credit > 0 ? fmt(a.credit) : '—'}</td>
                <td className="numeric" style={{ textAlign: 'left', fontWeight: 700 }}>{fmt(Math.abs(a.debit - a.credit))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--color-surface-container)', fontWeight: 800 }}>
              <td colSpan={3} style={{ padding: '0.875rem 1rem', fontSize: '0.875rem' }}>الإجمالي</td>
              <td className="numeric" style={{ padding: '0.875rem 1rem', textAlign: 'left', color: 'var(--color-primary)', fontSize: '0.9375rem' }}>{fmt(totalDebit)}</td>
              <td className="numeric" style={{ padding: '0.875rem 1rem', textAlign: 'left', color: 'var(--color-primary)', fontSize: '0.9375rem' }}>{fmt(totalCredit)}</td>
              <td style={{ padding: '0.875rem 1rem' }}>
                <span className={totalDebit === totalCredit ? 'chip chip-success' : 'chip chip-error'}>
                  {totalDebit === totalCredit ? '✓ متوازن' : '✗ غير متوازن'}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
