import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';

interface TrialBalanceRow {
  account_code: string;
  account_name_ar: string;
  account_type: string;
  total_debit: string;
  total_credit: string;
  balance: string;
}

const KPICard = ({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) => (
  <div className="kpi-card fade-in" style={{ borderTop: `3px solid ${color}` }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span className="kpi-label">{label}</span>
      <div style={{ width: 36, height: 36, borderRadius: '8px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ color, fontSize: 20 }}>{icon}</span>
      </div>
    </div>
    <div className="kpi-value numeric" style={{ color }}>{value}</div>
  </div>
);

const CycleStep = ({ icon, label, status, onClick }: { icon: string; label: string; status: string; onClick?: () => void }) => {
  const colors: Record<string, { bg: string; fg: string; border: string }> = {
    active:   { bg: '#e8f5e9', fg: '#2e7d32', border: '#4caf50' },
    pending:  { bg: '#fff3e0', fg: '#e65100', border: '#ff9800' },
    complete: { bg: '#e3f2fd', fg: '#1565c0', border: '#2196f3' },
    default:  { bg: 'var(--color-surface-container)', fg: 'var(--color-on-surface-variant)', border: 'var(--color-outline-variant)' },
  };
  const c = colors[status] || colors.default;
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
        padding: '1rem 0.75rem',
        background: c.bg,
        border: `2px solid ${c.border}`,
        borderRadius: '1rem',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        minWidth: 90,
        flex: 1,
      }}
    >
      <span className="material-symbols-outlined" style={{ color: c.fg, fontSize: 28 }}>{icon}</span>
      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: c.fg, textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
    </button>
  );
};

export default function AccountingCycleDashboard() {
  const { data: _trialBalance } = useQuery({
    queryKey: ['trial-balance-summary'],
    queryFn: async () => {
      const res = await api.get('/accounting/trial-balance');
      return res.data.data as TrialBalanceRow[];
    },
    enabled: false, // will enable when accounting routes are added
    initialData: [],
  });

  const currentYear = new Date().getFullYear();

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>
            لوحة الدورة المحاسبية
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
            السنة المالية {currentYear} — مراقبة حية للوضع المالي
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>
            طباعة
          </button>
          <button className="btn btn-primary btn-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            قيد جديد
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <KPICard label="إجمالي الأصول" value="٢٬٣٤٥٬٦٧٨ ر.س" icon="account_balance" color="var(--color-primary)" />
        <KPICard label="إجمالي الالتزامات" value="٧٨٩٬٤٥٦ ر.س" icon="credit_card" color="#d97706" />
        <KPICard label="حقوق الملكية" value="١٬٥٥٦٬٢٢٢ ر.س" icon="trending_up" color="#059669" />
        <KPICard label="صافي الأرباح" value="٢٣٤٬٥٦٧ ر.س" icon="payments" color="var(--color-secondary)" />
      </div>

      {/* Accounting Cycle Flowchart */}
      <div className="card">
        <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1.25rem', color: 'var(--color-on-surface)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: 22 }}>sync_alt</span>
          خطوات الدورة المحاسبية
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {[
            { icon: 'receipt_long', label: 'المستندات\nالمصدرية', status: 'complete' },
            { icon: 'chevron_right', label: '', status: 'arrow' },
            { icon: 'edit_note', label: 'القيد\nاليومي', status: 'active' },
            { icon: 'chevron_right', label: '', status: 'arrow' },
            { icon: 'book_2', label: 'دفتر\nالأستاذ', status: 'active' },
            { icon: 'chevron_right', label: '', status: 'arrow' },
            { icon: 'balance', label: 'ميزان\nالمراجعة', status: 'pending' },
            { icon: 'chevron_right', label: '', status: 'arrow' },
            { icon: 'tune', label: 'القيود\nالتعديلية', status: 'pending' },
            { icon: 'chevron_right', label: '', status: 'arrow' },
            { icon: 'description', label: 'القوائم\nالمالية', status: 'default' },
            { icon: 'chevron_right', label: '', status: 'arrow' },
            { icon: 'lock', label: 'إقفال\nالفترة', status: 'default' },
          ].map((step, idx) => (
            step.status === 'arrow' ? (
              <span key={idx} className="material-symbols-outlined" style={{ color: 'var(--color-outline)', fontSize: 24, flexShrink: 0 }}>
                chevron_left
              </span>
            ) : (
              <CycleStep key={idx} icon={step.icon} label={step.label} status={step.status} />
            )
          ))}
        </div>
      </div>

      {/* Recent Activity + Financial Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Recent Journal Entries */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, color: 'var(--color-on-surface)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-primary)', verticalAlign: 'middle', marginLeft: '0.375rem' }}>receipt</span>
              آخر القيود المحاسبية
            </h3>
            <a href="/accounting/transaction-analysis" style={{ fontSize: '0.75rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>عرض الكل</a>
          </div>
          {[
            { no: 'JE-000234', date: '١٤/٠٧/٢٠٢٥', desc: 'فاتورة مبيعات #INV-0089', amount: '٤٥٬٦٠٠', status: 'Posted' },
            { no: 'JE-000233', date: '١٣/٠٧/٢٠٢٥', desc: 'سند صرف نقدي', amount: '١٢٬٣٠٠', status: 'Approved' },
            { no: 'JE-000232', date: '١٢/٠٧/٢٠٢٥', desc: 'فاتورة مشتريات #PO-0045', amount: '٨٧٬٩٠٠', status: 'Posted' },
            { no: 'JE-000231', date: '١٢/٠٧/٢٠٢٥', desc: 'رواتب يونيو ٢٠٢٥', amount: '١٢٣٬٤٥٦', status: 'Posted' },
            { no: 'JE-000230', date: '١١/٠٧/٢٠٢٥', desc: 'قيد إيرادات', amount: '٢٣٬٧٨٩', status: 'Draft' },
          ].map(entry => (
            <div key={entry.no} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.625rem 0', borderBottom: '1px solid var(--color-surface-container)',
              fontSize: '0.8125rem',
            }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: '0.75rem', fontFamily: 'monospace' }}>{entry.no}</div>
                <div style={{ color: 'var(--color-on-surface)', marginTop: '0.125rem' }}>{entry.desc}</div>
                <div style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.7rem' }}>{entry.date}</div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div className="numeric" style={{ fontWeight: 700 }}>{entry.amount}</div>
                <span className={`chip ${entry.status === 'Posted' ? 'chip-success' : entry.status === 'Approved' ? 'chip-info' : 'chip-neutral'}`} style={{ fontSize: '0.65rem', marginTop: '0.25rem' }}>
                  {entry.status === 'Posted' ? 'مرحّل' : entry.status === 'Approved' ? 'معتمد' : 'مسودة'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Account Type Summary */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 1rem', color: 'var(--color-on-surface)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-primary)', verticalAlign: 'middle', marginLeft: '0.375rem' }}>pie_chart</span>
            ملخص القوائم المالية
          </h3>
          {[
            { label: 'الأصول', amount: '٢٬٣٤٥٬٦٧٨', type: 'Asset', color: 'var(--color-primary)', percentage: 100 },
            { label: 'الالتزامات', amount: '٧٨٩٬٤٥٦', type: 'Liability', color: '#d97706', percentage: 34 },
            { label: 'حقوق الملكية', amount: '١٬٥٥٦٬٢٢٢', type: 'Equity', color: '#059669', percentage: 66 },
            { label: 'الإيرادات', amount: '٥٦٧٬٨٩٠', type: 'Revenue', color: 'var(--color-secondary)', percentage: 24 },
            { label: 'المصروفات', amount: '٣٣٣٬٣٢٣', type: 'Expense', color: '#ba1a1a', percentage: 14 },
          ].map(item => (
            <div key={item.type} style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{item.label}</span>
                <span className="numeric" style={{ fontSize: '0.875rem', fontWeight: 700, color: item.color }}>{item.amount} ر.س</span>
              </div>
              <div style={{ height: 6, background: 'var(--color-surface-container)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${item.percentage}%`,
                  background: item.color, borderRadius: 3,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Month vs Previous month comparison */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 1rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-primary)', verticalAlign: 'middle', marginLeft: '0.375rem' }}>bar_chart</span>
          مقارنة الأداء الشهري — يوليو مقابل يونيو ٢٠٢٥
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {[
            { label: 'المبيعات', thisMonth: 234567, lastMonth: 198000, icon: 'point_of_sale', color: '#059669' },
            { label: 'المشتريات', thisMonth: 123456, lastMonth: 145000, icon: 'shopping_cart', color: '#d97706' },
            { label: 'المصروفات التشغيلية', thisMonth: 87900, lastMonth: 82000, icon: 'paid', color: '#6d7979' },
          ].map(item => {
            const diff = ((item.thisMonth - item.lastMonth) / item.lastMonth * 100).toFixed(1);
            const isPositive = item.thisMonth >= item.lastMonth;
            return (
              <div key={item.label} style={{ padding: '1rem', background: 'var(--color-surface-container-low)', borderRadius: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span className="material-symbols-outlined" style={{ color: item.color, fontSize: 20 }}>{item.icon}</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{item.label}</span>
                </div>
                <div className="numeric" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-on-surface)' }}>
                  {item.thisMonth.toLocaleString('ar-SA')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', marginTop: '0.25rem' }}>
                  الشهر الماضي: <span className="numeric">{item.lastMonth.toLocaleString('ar-SA')}</span>
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                  marginTop: '0.5rem', padding: '0.25rem 0.5rem', borderRadius: '100px',
                  background: isPositive ? '#d1fae5' : '#fee2e2',
                  color: isPositive ? '#065f46' : '#991b1b',
                  fontSize: '0.75rem', fontWeight: 700,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    {isPositive ? 'trending_up' : 'trending_down'}
                  </span>
                  {isPositive ? '+' : ''}{diff}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
