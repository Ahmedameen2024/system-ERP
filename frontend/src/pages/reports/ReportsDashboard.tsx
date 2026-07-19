import { useState } from 'react';

export default function ReportsDashboard() {
  const [selectedCategory, setSelectedCategory] = useState<'finance' | 'sales' | 'inventory' | 'hr'>('finance');

  const reportsList = {
    finance: [
      { name: 'ميزان المراجعة التفصيلي', desc: 'كشف الأرصدة والجاميع لكافة الحسابات الفرعية والرئيسية', code: 'FIN-TB' },
      { name: 'قائمة الدخل التقديرية (P&L)', desc: 'تحليل الإيرادات والمصروفات والربحية التشغيلية خلال الفترة', code: 'FIN-IS' },
      { name: 'الميزانية العمومية والمركز المالي', desc: 'تحليل الأصول، الالتزامات وحقوق المساهمين بالمنشأة', code: 'FIN-BS' },
      { name: 'دفتر أستاذ الحساب التفصيلي', desc: 'كشف الحركات والتسويات التي تمت على حساب محدد بالتفصيل', code: 'FIN-GL' }
    ],
    sales: [
      { name: 'تقرير المبيعات اليومي المجمع', desc: 'تفاصيل الفواتير، ضريبة المخرجات وطرق السداد اليومية', code: 'SAL-DR' },
      { name: 'أعمار ذمم العملاء (Aging)', desc: 'تحليل المديونيات المتأخرة للعملاء وفترات السداد المستحقة', code: 'SAL-AG' },
      { name: 'مبيعات الأصناف التفصيلية', desc: 'تحليل حركة بيع المنتجات وربحية كل صنف مباع على حدة', code: 'SAL-PR' }
    ],
    inventory: [
      { name: 'تقييم قيمة المخزون الحالي (WAC)', desc: 'جرد كميات المستودعات ومعدل تكلفتها المرجحة والقيمة السوقية', code: 'INV-VAL' },
      { name: 'حركة كرت الصنف التفصيلي', desc: 'تتبع عمليات الوارد والمنصرف والتحويل لصنف محدد عبر المستودعات', code: 'INV-CARD' },
      { name: 'تقرير الأصناف تحت الحد الأدنى', desc: 'قائمة بالمواد التي قاربت على النفاد وتجاوزت حد إعادة الطلب', code: 'INV-MIN' }
    ],
    hr: [
      { name: 'مسيرات الرواتب المفصلة', desc: 'جدول الرواتب والبدلات والاستقطاعات والتأمينات الشهرية للموظفين', code: 'HR-PAY' },
      { name: 'تقرير نسبة الحضور والانضباط', desc: 'تحليل الحضور، التأخيرات، الغيابات، وساعات الإضافي شهرياً', code: 'HR-ATT' },
      { name: 'رصيد إجازات الموظفين المتبقي', desc: 'كشف بأيام الإجازات المستهلكة والرصيد المتاح لكل موظف', code: 'HR-LV' }
    ]
  };

  const currentReports = reportsList[selectedCategory];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>
          لوحة التقارير والتحليلات
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
          استخراج التقارير الرسمية التفصيلية لمختلف إدارات المنشأة وتصديرها
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '0.75rem' }}>
        {[
          { key: 'finance', label: 'المحاسبة والمالية', icon: 'account_balance' },
          { key: 'sales', label: 'المبيعات والعملاء', icon: 'point_of_sale' },
          { key: 'inventory', label: 'المستودعات والمخزون', icon: 'warehouse' },
          { key: 'hr', label: 'الموارد البشرية والرواتب', icon: 'badge' }
        ].map(cat => (
          <button
            key={cat.key}
            className={`btn ${selectedCategory === cat.key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSelectedCategory(cat.key as any)}
            style={{ gap: '0.5rem', justifyContent: 'center' }}
          >
            <span className="material-symbols-outlined">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {currentReports.map(rep => (
          <div key={rep.code} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, color: 'var(--color-on-surface)' }}>{rep.name}</h3>
                <span className="numeric" style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600, background: 'var(--color-primary-fixed)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                  {rep.code}
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-on-surface-variant)', margin: 0, lineHeight: 1.4 }}>
                {rep.desc}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid var(--color-surface-container)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => alert(`تصدير تقرير ${rep.name} بصيغة Excel...`)}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                تصدير Excel
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => alert(`محاكاة: استخراج وعرض تقرير ${rep.name}`)}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
                عرض التقرير
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
