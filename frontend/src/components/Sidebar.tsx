import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface NavItem {
  path: string;
  icon: string;
  label: string;
  children?: { path: string; label: string; icon: string }[];
}

const navItems: NavItem[] = [
  { path: '/accounting', icon: 'sync_alt', label: 'الدورة المحاسبية' },
  {
    path: '/accounting/chart-of-accounts', icon: 'account_tree', label: 'دليل الحسابات',
  },
  { path: '/accounting/transaction-analysis', icon: 'analytics', label: 'تحليل المعاملات' },
  { path: '/accounting/journal-entries', icon: 'receipt', label: 'قيود اليومية' },
  { path: '/accounting/trial-balance', icon: 'balance', label: 'ميزان المراجعة' },
  { path: '/accounting/account-details', icon: 'receipt_long', label: 'كشف الحساب' },
  { path: '/accounting/financial-statements', icon: 'description', label: 'القوائم المالية' },
  { path: '/sales', icon: 'point_of_sale', label: 'لوحة المبيعات' },
  { path: '/sales/customers', icon: 'groups', label: 'دليل العملاء' },
  { path: '/sales/quotations', icon: 'request_quote', label: 'عروض الأسعار' },
  { path: '/sales/invoices', icon: 'add_circle', label: 'فاتورة مبيعات جديدة' },
  { path: '/sales/invoices-list', icon: 'receipt', label: 'قائمة فواتير المبيعات' },
  { path: '/sales/returns', icon: 'assignment_return', label: 'مرتجع المبيعات' },
  { path: '/purchasing', icon: 'shopping_cart', label: 'لوحة المشتريات' },
  { path: '/purchasing/suppliers', icon: 'local_shipping', label: 'دليل الموردين' },
  { path: '/purchasing/orders', icon: 'inventory', label: 'أوامر الشراء' },
  { path: '/purchasing/invoices', icon: 'description', label: 'فواتير المشتريات' },
  { path: '/inventory/warehouses', icon: 'warehouse', label: 'إدارة المستودعات' },
  { path: '/inventory/items', icon: 'inventory_2', label: 'الأصناف والمنتجات' },
  { path: '/inventory/categories', icon: 'category', label: 'تصنيفات الأصناف' },
  { path: '/inventory/uoms', icon: 'straighten', label: 'وحدات القياس' },
  { path: '/inventory/transactions', icon: 'swap_horiz', label: 'حركات المخزون' },
  { path: '/inventory/stock-levels', icon: 'stacked_bar_chart', label: 'أرصدة المخزون' },
  { path: '/vouchers/receipt', icon: 'payments', label: 'سند القبض' },
  { path: '/vouchers/payment', icon: 'money', label: 'سند الصرف' },
  { path: '/hr', icon: 'people', label: 'لوحة الموارد البشرية' },
  { path: '/hr/employees', icon: 'badge', label: 'بيانات الموظفين' },
  { path: '/hr/attendance', icon: 'schedule', label: 'سجل الحضور' },
  { path: '/hr/attendance-report', icon: 'calendar_month', label: 'تقرير الحضور الشهري' },
  { path: '/hr/leave', icon: 'event_available', label: 'إدارة الإجازات' },
  { path: '/payroll/sheet', icon: 'account_balance_wallet', label: 'كشف الرواتب' },
  { path: '/payroll/allowances', icon: 'tune', label: 'البدلات والخصومات' },
  { path: '/system', icon: 'settings', label: 'إعدادات النظام' },
  { path: '/system/cash-banks', icon: 'account_balance', label: 'إدارة الصناديق والبنوك' },
  { path: '/system/branches', icon: 'business', label: 'إدارة الفروع' },
  { path: '/system/currencies', icon: 'currency_exchange', label: 'العملات وأسعار الصرف' },
  { path: '/system/users', icon: 'manage_accounts', label: 'المستخدمون والصلاحيات' },
  { path: '/reports', icon: 'assessment', label: 'لوحة التقارير' },
];

const sectionHeaders: Record<string, string> = {
  '/accounting': 'المحاسبة المالية',
  '/sales': 'المبيعات والعملاء',
  '/purchasing': 'المشتريات والموردون',
  '/inventory/warehouses': 'المخازن والمستودعات',
  '/vouchers/receipt': 'سندات القبض والصرف',
  '/hr': 'الموارد البشرية',
  '/payroll/sheet': 'الرواتب والمزايا',
  '/system': 'تهيئة النظام',
  '/reports': 'التقارير والتحليلات',
};

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        height: '100vh',
        width: '280px',
        background: 'var(--color-surface-container-lowest)',
        borderLeft: '1px solid var(--color-outline-variant)',
        boxShadow: '-2px 0 12px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        overflowY: 'auto',
      }}
    >
      {/* Logo / Brand */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-outline-variant)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '10px',
            background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-outlined" style={{ color: 'white', fontSize: 22 }}>account_balance</span>
          </div>
          <div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1.2 }}>محاسبة بلس</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-variant)', letterSpacing: '0.04em' }}>ERP SYSTEM</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0.75rem 0.5rem', overflowY: 'auto' }}>
        {navItems.map((item, idx) => {
          const isHeader = sectionHeaders[item.path];
          const prevItem = navItems[idx - 1];
          const showHeader = isHeader && (!prevItem || !sectionHeaders[prevItem.path]);

          return (
            <React.Fragment key={item.path}>
              {showHeader && (
                <div style={{
                  padding: '0.75rem 0.75rem 0.25rem',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: 'var(--color-outline)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginTop: idx > 0 ? '0.5rem' : 0,
                }}>
                  {sectionHeaders[item.path]}
                </div>
              )}
              <NavLink
                to={item.path}
                end={item.path.split('/').length <= 2}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.625rem',
                  textDecoration: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--color-on-primary-container)' : 'var(--color-on-surface-variant)',
                  background: isActive ? 'var(--color-primary-container)' : 'transparent',
                  transition: 'all 0.15s',
                  marginBottom: '0.125rem',
                })}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  if (!el.getAttribute('aria-current')) {
                    el.style.background = 'var(--color-surface-container-high)';
                    el.style.color = 'var(--color-on-surface)';
                  }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  if (!el.getAttribute('aria-current')) {
                    el.style.background = 'transparent';
                    el.style.color = 'var(--color-on-surface-variant)';
                  }
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
              </NavLink>
            </React.Fragment>
          );
        })}
      </nav>

      {/* User Footer */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid var(--color-outline-variant)',
        background: 'var(--color-surface-container-low)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span className="material-symbols-outlined" style={{ color: 'white', fontSize: 16 }}>person</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.nameAr || user?.username}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.roleNameAr || 'مستخدم النظام'}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-ghost btn-sm"
          style={{ width: '100%', justifyContent: 'center', color: 'var(--color-error)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
