import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';

// Lazy load pages for better performance
const Login = React.lazy(() => import('./pages/Login'));
const Layout = React.lazy(() => import('./components/Layout'));
const AccountingCycleDashboard = React.lazy(() => import('./pages/accounting/AccountingCycleDashboard'));
const ChartOfAccounts = React.lazy(() => import('./pages/accounting/ChartOfAccounts'));
const CostCenters = React.lazy(() => import('./pages/accounting/CostCenters'));
const TransactionAnalysis = React.lazy(() => import('./pages/accounting/TransactionAnalysis'));
const TrialBalance = React.lazy(() => import('./pages/accounting/TrialBalance'));
const AccountDetails = React.lazy(() => import('./pages/accounting/AccountDetails'));
const FinancialStatements = React.lazy(() => import('./pages/accounting/FinancialStatements'));
const JournalEntries = React.lazy(() => import('./pages/accounting/JournalEntries'));
const SystemConfiguration = React.lazy(() => import('./pages/system/SystemConfiguration'));
const BranchManagement = React.lazy(() => import('./pages/system/BranchManagement'));
const CurrencyRates = React.lazy(() => import('./pages/system/CurrencyRates'));
const UsersPermissions = React.lazy(() => import('./pages/system/UsersPermissions'));
const CustomersPage = React.lazy(() => import('./pages/sales/CustomersPage'));
const SalesDashboard = React.lazy(() => import('./pages/sales/SalesDashboard'));
const SalesInvoice = React.lazy(() => import('./pages/sales/SalesInvoice'));
const SalesInvoicePrint = React.lazy(() => import('./pages/sales/SalesInvoicePrint'));
const SalesQuotation = React.lazy(() => import('./pages/sales/SalesQuotation'));
const SalesReturn = React.lazy(() => import('./pages/sales/SalesReturn'));
const SalesInvoiceList = React.lazy(() => import('./pages/sales/SalesInvoiceList'));
const SuppliersPage = React.lazy(() => import('./pages/purchasing/SuppliersPage'));
const PurchasingDashboard = React.lazy(() => import('./pages/purchasing/PurchasingDashboard'));
const PurchaseOrder = React.lazy(() => import('./pages/purchasing/PurchaseOrder'));
const PurchaseInvoice = React.lazy(() => import('./pages/purchasing/PurchaseInvoice'));
const ItemsPage = React.lazy(() => import('./pages/inventory/ItemsPage'));
const WarehousesPage = React.lazy(() => import('./pages/inventory/WarehousesPage'));
const UnitsOfMeasure = React.lazy(() => import('./pages/inventory/UnitsOfMeasure'));
const ItemCategories = React.lazy(() => import('./pages/inventory/ItemCategories'));
const InventoryTransactions = React.lazy(() => import('./pages/inventory/InventoryTransactions'));
const StockLevels = React.lazy(() => import('./pages/inventory/StockLevels'));
const ReceiptVoucher = React.lazy(() => import('./pages/vouchers/ReceiptVoucher'));
const PaymentVoucher = React.lazy(() => import('./pages/vouchers/PaymentVoucher'));
const EmployeesPage = React.lazy(() => import('./pages/hr/EmployeesPage'));
const AttendanceRegister = React.lazy(() => import('./pages/hr/AttendanceRegister'));
const MonthlyAttendanceReport = React.lazy(() => import('./pages/hr/MonthlyAttendanceReport'));
const LeaveManagement = React.lazy(() => import('./pages/hr/LeaveManagement'));
const HRDashboard = React.lazy(() => import('./pages/hr/HRDashboard'));
const PayrollSheet = React.lazy(() => import('./pages/payroll/PayrollSheet'));
const AllowancesDeductions = React.lazy(() => import('./pages/payroll/AllowancesDeductions'));
const ReportsDashboard = React.lazy(() => import('./pages/reports/ReportsDashboard'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center gap-4">
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
      <span style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.875rem' }}>جاري التحميل...</span>
    </div>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <React.Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}

            <Route path="/login" element={<Login />} />
            <Route path="/invoice-print/:id" element={<SalesInvoicePrint />} />

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              {/* Default redirect */}
              <Route index element={<Navigate to="/accounting" replace />} />

              {/* Accounting */}
              <Route path="accounting" element={<AccountingCycleDashboard />} />
              <Route path="accounting/chart-of-accounts" element={<ChartOfAccounts />} />
              <Route path="accounting/cost-centers" element={<CostCenters />} />
              <Route path="accounting/transaction-analysis" element={<TransactionAnalysis />} />
              <Route path="accounting/journal-entries" element={<JournalEntries />} />
              <Route path="accounting/trial-balance" element={<TrialBalance />} />
              <Route path="accounting/account-details" element={<AccountDetails />} />
              <Route path="accounting/financial-statements" element={<FinancialStatements />} />

              {/* Sales */}
              <Route path="sales" element={<SalesDashboard />} />
              <Route path="sales/customers" element={<CustomersPage />} />
              <Route path="sales/quotations" element={<SalesQuotation />} />
              <Route path="sales/invoices" element={<SalesInvoice />} />
              <Route path="sales/invoices-list" element={<SalesInvoiceList />} />
              <Route path="sales/returns" element={<SalesReturn />} />

              {/* Purchasing */}
              <Route path="purchasing" element={<PurchasingDashboard />} />
              <Route path="purchasing/suppliers" element={<SuppliersPage />} />
              <Route path="purchasing/orders" element={<PurchaseOrder />} />
              <Route path="purchasing/invoices" element={<PurchaseInvoice />} />

              {/* Inventory */}
              <Route path="inventory" element={<Navigate to="inventory/items" replace />} />
              <Route path="inventory/items" element={<ItemsPage />} />
              <Route path="inventory/warehouses" element={<WarehousesPage />} />
              <Route path="inventory/uoms" element={<UnitsOfMeasure />} />
              <Route path="inventory/categories" element={<ItemCategories />} />
              <Route path="inventory/transactions" element={<InventoryTransactions />} />
              <Route path="inventory/stock-levels" element={<StockLevels />} />

              {/* Vouchers */}
              <Route path="vouchers/receipt" element={<ReceiptVoucher />} />
              <Route path="vouchers/payment" element={<PaymentVoucher />} />

              {/* HR */}
              <Route path="hr" element={<HRDashboard />} />
              <Route path="hr/employees" element={<EmployeesPage />} />
              <Route path="hr/attendance" element={<AttendanceRegister />} />
              <Route path="hr/attendance-report" element={<MonthlyAttendanceReport />} />
              <Route path="hr/leave" element={<LeaveManagement />} />

              {/* Payroll */}
              <Route path="payroll/sheet" element={<PayrollSheet />} />
              <Route path="payroll/allowances" element={<AllowancesDeductions />} />

              {/* System */}
              <Route path="system" element={<SystemConfiguration />} />
              <Route path="system/branches" element={<BranchManagement />} />
              <Route path="system/currencies" element={<CurrencyRates />} />
              <Route path="system/users" element={<UsersPermissions />} />

              {/* Reports */}
              <Route path="reports" element={<ReportsDashboard />} />
            </Route>
          </Routes>
        </React.Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
