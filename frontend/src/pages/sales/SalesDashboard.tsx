import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

interface Stats {
  totalSalesThisMonth: number;
  invoiceCountThisMonth: number;
  activeCustomers: number;
  topItems: { name_ar: string; code: string; total_qty: string; total_revenue: string }[];
  monthlyTrend: { month: string; total: string }[];
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  invoice_date: string;
  net_amount: string;
  status: string;
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  Draft:         { label: 'مسودة',        cls: 'chip-neutral' },
  Approved:      { label: 'معتمد',         cls: 'chip-info' },
  Posted:        { label: 'مرحّل',         cls: 'chip-success' },
  Paid:          { label: 'مدفوع',         cls: 'chip-success' },
  PartiallyPaid: { label: 'مدفوع جزئياً', cls: 'chip-info' },
  Void:          { label: 'ملغي',          cls: 'chip-error' },
};

const KPICard = ({ label, value, icon, color, sub }: { label: string; value: string; icon: string; color: string; sub?: string }) => (
  <div className="kpi-card fade-in" style={{ borderTop: `3px solid ${color}` }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span className="kpi-label">{label}</span>
      <div style={{ width: 36, height: 36, borderRadius: '8px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ color, fontSize: 20 }}>{icon}</span>
      </div>
    </div>
    <div className="kpi-value numeric" style={{ color }}>{value}</div>
    {sub && <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', marginTop: '0.25rem' }}>{sub}</div>}
  </div>
);

export default function SalesDashboard() {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['sales-dashboard-stats'],
    queryFn: async () => { const r = await api.get('/sales/dashboard-stats'); return r.data.data as Stats; },
  });

  const { data: invoices = [], isLoading: invLoading } = useQuery({
    queryKey: ['sales-invoices'],
    queryFn: async () => { const r = await api.get('/sales/invoices'); return r.data.data as Invoice[]; },
    initialData: [],
  });

  const recentInvoices = invoices.slice(0, 6);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>لوحة المبيعات</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
            تحليل الفواتير، عروض الأسعار ونشاط العملاء
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/sales/invoices')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            فاتورة مبيعات جديدة
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <KPICard
          label="إجمالي المبيعات (هذا الشهر)"
          value={statsLoading ? '...' : `${(stats?.totalSalesThisMonth || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س`}
          icon="trending_up"
          color="var(--color-primary)"
          sub="الفواتير المرحّلة والمدفوعة"
        />
        <KPICard
          label="عدد الفواتير (هذا الشهر)"
          value={statsLoading ? '...' : String(stats?.invoiceCountThisMonth || 0)}
          icon="receipt"
          color="#0891b2"
          sub="جميع الحالات"
        />
        <KPICard
          label="إجمالي الفواتير"
          value={String(invoices.length)}
          icon="description"
          color="#7c3aed"
          sub="في قاعدة البيانات"
        />
        <KPICard
          label="العملاء النشطون"
          value={statsLoading ? '...' : String(stats?.activeCustomers || 0)}
          icon="groups"
          color="#059669"
          sub="مسجلون في النظام"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Recent Invoices */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>أحدث الفواتير</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/sales/invoices-list')}>
              عرض الكل
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back_ios</span>
            </button>
          </div>
          {invLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner" /></div>
          ) : recentInvoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-on-surface-variant)', fontSize: '0.875rem' }}>
              لا توجد فواتير بعد — قم بإنشاء فاتورة مبيعات أولاً
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>رقم الفاتورة</th>
                  <th>العميل</th>
                  <th style={{ textAlign: 'left' }}>الإجمالي</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map(inv => (
                  <tr key={inv.id}>
                    <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.8125rem' }}>{inv.invoice_number}</span></td>
                    <td style={{ fontWeight: 500, fontSize: '0.8125rem' }}>{inv.customer_name}</td>
                    <td className="numeric" style={{ textAlign: 'left', fontWeight: 700, fontSize: '0.8125rem' }}>
                      {Number(inv.net_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={`chip ${statusConfig[inv.status]?.cls || 'chip-neutral'}`} style={{ fontSize: '0.7rem' }}>
                        {statusConfig[inv.status]?.label || inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Top Selling Items */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-outline-variant)' }}>
            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>الأصناف الأكثر مبيعاً (هذا الشهر)</h3>
          </div>
          {statsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner" /></div>
          ) : !stats?.topItems || stats.topItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-on-surface-variant)', fontSize: '0.875rem' }}>
              لا توجد بيانات مبيعات لهذا الشهر بعد
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>الصنف</th>
                  <th style={{ textAlign: 'left' }}>الكمية</th>
                  <th style={{ textAlign: 'left' }}>الإيراد</th>
                </tr>
              </thead>
              <tbody>
                {stats.topItems.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{item.name_ar}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-variant)' }}>{item.code}</div>
                    </td>
                    <td className="numeric" style={{ textAlign: 'left', fontSize: '0.8125rem' }}>{Number(item.total_qty).toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                    <td className="numeric" style={{ textAlign: 'left', fontWeight: 700, fontSize: '0.8125rem', color: 'var(--color-primary)' }}>
                      {Number(item.total_revenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Monthly Trend */}
      {stats?.monthlyTrend && stats.monthlyTrend.length > 0 && (
        <div className="card">
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.9375rem', fontWeight: 700 }}>الاتجاه الشهري للمبيعات (آخر 6 أشهر)</h3>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', height: 120 }}>
            {stats.monthlyTrend.map((m, idx) => {
              const maxVal = Math.max(...stats.monthlyTrend.map(x => Number(x.total)));
              const heightPct = maxVal > 0 ? (Number(m.total) / maxVal) * 100 : 0;
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>
                    {Number(m.total).toLocaleString('en-US', { notation: 'compact' })}
                  </div>
                  <div style={{
                    width: '100%',
                    height: `${heightPct}%`,
                    minHeight: 4,
                    background: 'var(--color-primary)',
                    borderRadius: '4px 4px 0 0',
                    opacity: 0.8 + (idx / stats.monthlyTrend.length) * 0.2
                  }} />
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-on-surface-variant)', textAlign: 'center' }}>
                    {m.month}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
