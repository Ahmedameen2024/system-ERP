const KPICard = ({ label, value, icon, color, sub }: { label: string; value: string; icon: string; color: string; sub?: string }) => (
  <div className="kpi-card fade-in" style={{ borderTop: `3px solid ${color}` }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span className="kpi-label">{label}</span>
      <div style={{ width: 36, height: 36, borderRadius: '8px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ color, fontSize: 20 }}>{icon}</span>
      </div>
    </div>
    <div className="kpi-value numeric" style={{ color }}>{value}</div>
    {sub && (
      <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', marginTop: '0.25rem' }}>
        <span>{sub}</span>
      </div>
    )}
  </div>
);

export default function HRDashboard() {
  const activeLeaves = [
    { name: 'رانيا الحربي', type: 'إجازة سنوية', duration: '١٥ يوم', status: 'Approved', range: '٠٧/١٥ - ٠٧/٣٠' },
    { name: 'سعد القحطاني', type: 'مأمورية عمل', duration: '٣ أيام', status: 'Approved', range: '٠٧/١٨ - ٠٧/٢٠' }
  ];

  const recentLogs = [
    { name: 'فهد المطيري', time: '٠٨:٢٥ ص', type: 'حضور (متأخر)', date: 'اليوم' },
    { name: 'سعد القحطاني', time: '٠٨:٠٢ ص', type: 'حضور', date: 'اليوم' },
    { name: 'خالد الغامدي', time: '١٦:٠٢ م', type: 'انصراف', date: 'أمس' }
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>
            لوحة الموارد البشرية
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
            مراقبة الموظفين، الحضور والانصراف، وطلبات الإجازات النشطة
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <a href="/hr/employees" className="btn btn-primary btn-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            تسجيل موظف جديد
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <KPICard label="إجمالي الموظفين" value="١٥ موظف" icon="people" color="var(--color-primary)" sub="١٢ على رأس العمل" />
        <KPICard label="في إجازة اليوم" value="٢ موظفين" icon="event_busy" color="#d97706" sub="إجازات معتمدة نشطة" />
        <KPICard label="نسبة الانضباط هذا الشهر" value="٩٤٫٥%" icon="check_circle" color="#059669" sub="متوسط حضور الموظفين" />
        <KPICard label="ساعات الإضافي الكلية" value="٣٢ ساعة" icon="more_time" color="var(--color-secondary)" sub="لشهر يونيو المنصرم" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Active Leave Requests */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>event_available</span>
            الإجازات الجارية والمستقبلية المعتمَدة
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activeLeaves.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: idx < activeLeaves.length - 1 ? '1px solid var(--color-surface-container)' : 'none' }}>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-on-surface)' }}>{item.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-variant)', marginTop: '0.125rem' }}>
                    نوع الإجازة: {item.type} | المدة: {item.duration}
                  </div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <span className="chip chip-success" style={{ fontSize: '0.65rem' }}>مرحل للمسيرات</span>
                  <div className="numeric" style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', marginTop: '0.25rem' }}>{item.range}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Biometric logs feed */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>fingerprint</span>
            سجل بصمات الحضور الفوري
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentLogs.map((log, idx) => (
              <div key={idx} style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: idx < recentLogs.length - 1 ? '1px solid var(--color-surface-container)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-outline)', fontSize: 16 }}>schedule</span>
                  <div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{log.name}</span>
                    <span className="numeric" style={{ fontSize: '0.75rem', color: 'var(--color-outline)', marginRight: '0.5rem' }}>{log.time}</span>
                  </div>
                </div>
                <div>
                  <span className={`chip ${log.type.includes('متأخر') ? 'chip-warning' : log.type.includes('انصراف') ? 'chip-neutral' : 'chip-success'}`} style={{ fontSize: '0.65rem' }}>
                    {log.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
