export default function AccountDetails() {
  const lines = [
    { date: '٠١/٠٧/٢٠٢٥', ref: 'JE-000220', desc: 'رصيد افتتاحي', debit: 0, credit: 0, balance: 450000 },
    { date: '٠٣/٠٧/٢٠٢٥', ref: 'JE-000224', desc: 'تحصيل عميل - شركة الأفق', debit: 45600, credit: 0, balance: 495600 },
    { date: '٠٦/٠٧/٢٠٢٥', ref: 'PV-000045', desc: 'سند صرف - مورد البيان', debit: 0, credit: 23400, balance: 472200 },
    { date: '١٠/٠٧/٢٠٢٥', ref: 'JE-000231', desc: 'رواتب يونيو', debit: 0, credit: 123456, balance: 348744 },
    { date: '١٤/٠٧/٢٠٢٥', ref: 'RV-000089', desc: 'سند قبض - مبيعات', debit: 78900, credit: 0, balance: 427644 },
  ];
  const fmt = (n: number) => n > 0 ? n.toLocaleString('ar-SA', { minimumFractionDigits: 2 }) : '—';
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>كشف الحساب التفصيلي</h1>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <select className="input" style={{ minWidth: 220 }}>
          <option>1100 - النقدية والبنوك</option>
          <option>1200 - ذمم مدينة</option>
          <option>5100 - تكلفة المبيعات</option>
        </select>
        <input type="date" className="input" style={{ maxWidth: 160 }} />
        <input type="date" className="input" style={{ maxWidth: 160 }} />
        <button className="btn btn-primary btn-sm"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>search</span>عرض</button>
        <button className="btn btn-secondary btn-sm"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>طباعة</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'إجمالي المدين', value: '١٢٤٬٥٠٠ ر.س', color: '#059669' },
          { label: 'إجمالي الدائن', value: '١٤٦٬٨٥٦ ر.س', color: '#ba1a1a' },
          { label: 'الرصيد الختامي', value: '٤٢٧٬٦٤٤ ر.س', color: 'var(--color-primary)' },
          { label: 'عدد الحركات', value: '٤ حركة', color: 'var(--color-secondary)' },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ borderTop: `3px solid ${k.color}` }}>
            <span className="kpi-label">{k.label}</span>
            <div className="kpi-value" style={{ color: k.color, fontSize: '1.25rem' }}>{k.value}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>المرجع</th>
              <th>البيان</th>
              <th style={{ textAlign: 'left' }}>مدين</th>
              <th style={{ textAlign: 'left' }}>دائن</th>
              <th style={{ textAlign: 'left' }}>الرصيد</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i}>
                <td className="numeric">{l.date}</td>
                <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.8125rem' }}>{l.ref}</span></td>
                <td>{l.desc}</td>
                <td className="numeric" style={{ textAlign: 'left', color: '#059669' }}>{fmt(l.debit)}</td>
                <td className="numeric" style={{ textAlign: 'left', color: '#ba1a1a' }}>{fmt(l.credit)}</td>
                <td className="numeric" style={{ textAlign: 'left', fontWeight: 700 }}>{l.balance.toLocaleString('ar-SA', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
