import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const pageTitles: Record<string, string> = {
  '/accounting': 'الدورة المحاسبية',
  '/accounting/chart-of-accounts': 'دليل الحسابات',
  '/accounting/transaction-analysis': 'تحليل المعاملات',
  '/accounting/trial-balance': 'ميزان المراجعة',
  '/accounting/account-details': 'كشف الحساب',
  '/accounting/financial-statements': 'القوائم المالية',
  '/sales': 'لوحة المبيعات',
  '/sales/customers': 'دليل العملاء',
  '/sales/quotations': 'عروض الأسعار',
  '/sales/invoices': 'فواتير المبيعات',
  '/sales/returns': 'مرتجع المبيعات',
  '/purchasing': 'لوحة المشتريات',
  '/purchasing/suppliers': 'دليل الموردين',
  '/purchasing/orders': 'أوامر الشراء',
  '/purchasing/invoices': 'فواتير المشتريات',
  '/inventory/items': 'الأصناف والمنتجات',
  '/inventory/warehouses': 'إدارة المخازن',
  '/inventory/uoms': 'وحدات القياس',
  '/vouchers/receipt': 'سند القبض',
  '/vouchers/payment': 'سند الصرف',
  '/hr': 'لوحة الموارد البشرية',
  '/hr/employees': 'بيانات الموظفين',
  '/hr/attendance': 'سجل الحضور والانصراف',
  '/hr/attendance-report': 'تقرير الحضور الشهري',
  '/hr/leave': 'إدارة الإجازات',
  '/payroll/sheet': 'كشف الرواتب الشهري',
  '/payroll/allowances': 'البدلات والاستقطاعات',
  '/system': 'إعدادات النظام',
  '/system/branches': 'إدارة الفروع',
  '/system/currencies': 'العملات وأسعار الصرف',
  '/system/users': 'المستخدمون والصلاحيات',
  '/reports': 'لوحة التقارير',
};

export default function Header() {
  const location = useLocation();
  const { user } = useAuthStore();
  const pageTitle = pageTitles[location.pathname] || 'نظام ERP';

  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-SA', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        right: '280px',
        left: 0,
        height: '64px',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-outline-variant)',
        boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
      }}
    >
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
      }}>
        {/* Company Name (Right side - RTL) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>corporate_fare</span>
          <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
            {user?.companyNameAr || 'مؤسسة الأعمال الحديثة'}
          </span>
        </div>

        {/* Page Title (Center) */}
        <div style={{
          fontWeight: 700,
          fontSize: '1.0625rem',
          color: 'var(--color-on-surface)',
        }}>
          {pageTitle}
        </div>

        {/* Right controls (Left side in RTL) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-on-surface-variant)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              تاريخ اليوم
            </span>
            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}>
              {dateStr}
            </span>
          </div>
          <button
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-on-surface-variant)',
              transition: 'background 0.15s',
            }}
            title="الإشعارات"
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-container-high)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>notifications</span>
          </button>
        </div>
      </div>
      {/* Primary accent line */}
      <div style={{ height: 3, background: 'var(--color-primary)' }} />
    </header>
  );
}
