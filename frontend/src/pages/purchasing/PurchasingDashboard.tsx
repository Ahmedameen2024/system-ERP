const KPICard = ({ label, value, icon, color, pct, sub }: { label: string; value: string; icon: string; color: string; pct?: string; sub?: string }) => (
  <div className="kpi-card fade-in" style={{ borderTop: `3px solid ${color}` }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span className="kpi-label">{label}</span>
      <div style={{ width: 36, height: 36, borderRadius: '8px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ color, fontSize: 20 }}>{icon}</span>
      </div>
    </div>
    <div className="kpi-value numeric" style={{ color }}>{value}</div>
    {sub && (
      <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {pct && <span style={{ color: pct.startsWith('+') ? '#ba1a1a' : '#059669', fontWeight: 700 }}>{pct}</span>}
        <span>{sub}</span>
      </div>
    )}
  </div>
);

export default function PurchasingDashboard() {
  const recentInvoices = [
    { id: 'PINV-0045', supplier: 'شركة البيان للمقاولات والتجارة', date: '١٤/٠٧/٢٠٢٥', total: '٢٣٬٤٠٠٫٠٠', status: 'Posted', type: 'شراء بضاعة' },
    { id: 'PINV-0044', supplier: 'مؤسسة الرياض للتوريدات الكهربائية', date: '١٢/٠٧/٢٠٢٥', total: '٨٧٬٩٠٠٫٠٠', status: 'Approved', type: 'شراء أجهزة مكتبية' },
    { id: 'PINV-0043', supplier: 'المصنع السعودي الموحد', date: '١٠/٠٧/٢٠٢٥', total: '١٢٠٬٠٠٠٫٠٠', status: 'Draft', type: 'شراء مواد خام' }
  ];

  const recentOrders = [
    { id: 'PO-0020', supplier: 'شركة البيان للمقاولات والتجارة', date: '١٤/٠٧/٢٠٢٥', total: '٢٣٬٤٠٠٫٠٠', status: 'FullyReceived' },
    { id: 'PO-0019', supplier: 'مؤسسة الرياض للتوريدات الكهربائية', date: '١٢/٠٧/٢٠٢٥', total: '٨٧٬٩٠٠٫٠٠', status: 'PartiallyReceived' },
    { id: 'PO-0018', supplier: 'المصنع السعودي الموحد', date: '١٠/٠٧/٢٠٢٥', total: '١٢٠٬٠٠٠٫٠٠', status: 'Approved' }
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>
            لوحة المشتريات
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
            متابعة طلبات التوريد وفواتير المشتريات ومستحقات الموردين
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <a href="/purchasing/invoices" className="btn btn-primary btn-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            فاتورة مشتريات جديدة
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <KPICard label="إجمالي مشتريات الشهر" value="٢٣١٬٣٠٠٫٠٠ ر.س" icon="shopping_cart" color="var(--color-primary)" pct="+٨٫٥%" sub="مقارنة بالشهر الماضي" />
        <KPICard label="مستحقات الموردين (AP)" value="١١١٬٣٠٠٫٠٠ ر.س" icon="payments" color="#ba1a1a" sub="إجمالي الحسابات الدائنة" />
        <KPICard label="أوامر شراء قيد التوريد" value="٢ أمر" icon="hourglass_empty" color="#d97706" sub="بانتظار الفحص والاستلام" />
        <KPICard label="الموردون النشطون" value="٣ موردين" icon="local_shipping" color="var(--color-secondary)" sub="مسجلين بالنظام" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Recent Invoices */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>receipt</span>
            آخر فواتير المشتريات
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>رقم الفاتورة</th>
                  <th>المورد</th>
                  <th style={{ textAlign: 'left' }}>المبلغ</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map(inv => (
                  <tr key={inv.id}>
                    <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{inv.id}</span></td>
                    <td style={{ fontWeight: 500 }}>{inv.supplier}</td>
                    <td className="numeric" style={{ textAlign: 'left', fontWeight: 700 }}>{inv.total} ر.س</td>
                    <td>
                      <span className={`chip ${
                        inv.status === 'Posted' ? 'chip-success' :
                        inv.status === 'Approved' ? 'chip-info' : 'chip-neutral'
                      }`}>
                        {inv.status === 'Posted' ? 'مرحلة' :
                         inv.status === 'Approved' ? 'معتمدة' : 'مسودة'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Purchase Orders */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>inventory</span>
            أحدث أوامر الشراء
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>رقم الأمر</th>
                  <th>المورد</th>
                  <th style={{ textAlign: 'left' }}>القيمة</th>
                  <th>حالة الاستلام</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id}>
                    <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{order.id}</span></td>
                    <td style={{ fontWeight: 500 }}>{order.supplier}</td>
                    <td className="numeric" style={{ textAlign: 'left', fontWeight: 700 }}>{order.total} ر.س</td>
                    <td>
                      <span className={`chip ${
                        order.status === 'FullyReceived' ? 'chip-success' :
                        order.status === 'PartiallyReceived' ? 'chip-warning' : 'chip-info'
                      }`}>
                        {order.status === 'FullyReceived' ? 'مستلم بالكامل' :
                         order.status === 'PartiallyReceived' ? 'مستلم جزئياً' : 'معتمد'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
