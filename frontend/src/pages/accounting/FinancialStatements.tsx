import { useState } from 'react';

export default function FinancialStatements() {
  const [statementType, setStatementType] = useState<'income' | 'balance_sheet'>('income');

  const incomeStatement = {
    revenue: [
      { name: 'إيرادات المبيعات', amount: 567890 },
      { name: 'إيرادات أخرى', amount: 12000 }
    ],
    cogs: [
      { name: 'تكلفة البضاعة المباعة', amount: -123456 }
    ],
    expenses: [
      { name: 'مصاريف رواتب وأجور', amount: -123456 },
      { name: 'مصاريف إدارية وعمومية', amount: -87900 },
      { name: 'مصاريف إيجار', amount: -24000 },
      { name: 'مصاريف كهرباء ومياه', amount: -5600 }
    ]
  };

  const balanceSheet = {
    assets: {
      current: [
        { name: 'النقدية والبنوك', amount: 450000 },
        { name: 'ذمم مدينة', amount: 234500 },
        { name: 'مخزون البضاعة', amount: 567800 }
      ],
      nonCurrent: [
        { name: 'أصول ثابتة (بالصافي)', amount: 1093378 }
      ]
    },
    liabilities: {
      current: [
        { name: 'ذمم دائنة', amount: 345000 },
        { name: 'مصاريف مستحقة', amount: 12300 }
      ],
      nonCurrent: [
        { name: 'قروض طويلة الأجل', amount: 444456 }
      ]
    },
    equity: [
      { name: 'رأس المال المدفوع', amount: 1000000 },
      { name: 'الأرباح المبقاة', amount: 556222 }
    ]
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ر.س';
  };

  const totalRevenue = incomeStatement.revenue.reduce((sum, item) => sum + item.amount, 0);
  const totalCogs = incomeStatement.cogs.reduce((sum, item) => sum + item.amount, 0);
  const grossProfit = totalRevenue + totalCogs;
  const totalExpenses = incomeStatement.expenses.reduce((sum, item) => sum + item.amount, 0);
  const netIncome = grossProfit + totalExpenses;

  const totalCurrentAssets = balanceSheet.assets.current.reduce((sum, item) => sum + item.amount, 0);
  const totalNonCurrentAssets = balanceSheet.assets.nonCurrent.reduce((sum, item) => sum + item.amount, 0);
  const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

  const totalCurrentLiabilities = balanceSheet.liabilities.current.reduce((sum, item) => sum + item.amount, 0);
  const totalNonCurrentLiabilities = balanceSheet.liabilities.nonCurrent.reduce((sum, item) => sum + item.amount, 0);
  const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;
  const totalEquity = balanceSheet.equity.reduce((sum, item) => sum + item.amount, 0);
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>
            القوائم المالية
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
            التقارير الختامية للوضع المالي والأداء التشغيلي للمنشأة
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
            تصدير PDF
          </button>
          <button className="btn btn-secondary btn-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>
            طباعة
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '0.5rem' }}>
        <button
          className={`btn ${statementType === 'income' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setStatementType('income')}
          style={{ borderRadius: '0.5rem 0.5rem 0 0' }}
        >
          قائمة الدخل (الأرباح والخسائر)
        </button>
        <button
          className={`btn ${statementType === 'balance_sheet' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setStatementType('balance_sheet')}
          style={{ borderRadius: '0.5rem 0.5rem 0 0' }}
        >
          الميزانية العمومية (قائمة المركز المالي)
        </button>
      </div>

      <div className="card" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)', margin: '0 0 0.5rem' }}>مؤسسة الأعمال الحديثة</h2>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
            {statementType === 'income' ? 'قائمة الدخل التقديرية' : 'قائمة المركز المالي'}
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', margin: 0 }}>
            للفترة المنتهية في ٣١ ديسمبر ٢٠٢٥ (المبالغ بالريال السعودي)
          </p>
        </div>

        {statementType === 'income' ? (
          <div>
            {/* Revenue Section */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ borderBottom: '2px solid var(--color-primary)', paddingBottom: '0.5rem', fontWeight: 700, fontSize: '0.9375rem' }}>الإيرادات التشغيلية</h4>
              {incomeStatement.revenue.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.875rem' }}>
                  <span>{item.name}</span>
                  <span className="numeric">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontWeight: 700, borderTop: '1px dashed var(--color-outline-variant)' }}>
                <span>إجمالي الإيرادات</span>
                <span className="numeric">{formatCurrency(totalRevenue)}</span>
              </div>
            </div>

            {/* COGS Section */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ borderBottom: '2px solid var(--color-primary)', paddingBottom: '0.5rem', fontWeight: 700, fontSize: '0.9375rem' }}>تكلفة المبيعات</h4>
              {incomeStatement.cogs.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.875rem' }}>
                  <span>{item.name}</span>
                  <span className="numeric">({formatCurrency(Math.abs(item.amount))})</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontWeight: 700, borderTop: '1px dashed var(--color-outline-variant)' }}>
                <span>إجمالي تكلفة المبيعات</span>
                <span className="numeric">({formatCurrency(Math.abs(totalCogs))})</span>
              </div>
            </div>

            {/* Gross Profit */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--color-surface-container)', fontWeight: 800, borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
              <span>إجمالي الربح (الهامش)</span>
              <span className="numeric" style={{ color: 'var(--color-primary)' }}>{formatCurrency(grossProfit)}</span>
            </div>

            {/* Expenses Section */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ borderBottom: '2px solid var(--color-primary)', paddingBottom: '0.5rem', fontWeight: 700, fontSize: '0.9375rem' }}>المصاريف التشغيلية والإدارية</h4>
              {incomeStatement.expenses.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.875rem' }}>
                  <span>{item.name}</span>
                  <span className="numeric">({formatCurrency(Math.abs(item.amount))})</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontWeight: 700, borderTop: '1px dashed var(--color-outline-variant)' }}>
                <span>إجمالي المصاريف التشغيلية</span>
                <span className="numeric">({formatCurrency(Math.abs(totalExpenses))})</span>
              </div>
            </div>

            {/* Net Income */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--color-primary)', color: 'var(--color-on-primary)', fontWeight: 800, borderRadius: '0.5rem' }}>
              <span style={{ fontSize: '1rem' }}>صافي الأرباح (الخسائر) للفترة</span>
              <span className="numeric" style={{ fontSize: '1.125rem' }}>{formatCurrency(netIncome)}</span>
            </div>
          </div>
        ) : (
          <div>
            {/* Assets */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.0625rem', color: 'var(--color-primary)', borderBottom: '2px solid var(--color-primary)', paddingBottom: '0.25rem', marginBottom: '0.75rem' }}>الأصول (Assets)</h3>
              
              {/* Current Assets */}
              <div style={{ paddingRight: '1rem', marginBottom: '1rem' }}>
                <h4 style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem' }}>الأصول المتداولة</h4>
                {balanceSheet.assets.current.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', fontSize: '0.875rem' }}>
                    <span>{item.name}</span>
                    <span className="numeric">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontWeight: 700, borderTop: '1px dashed var(--color-outline-variant)' }}>
                  <span>إجمالي الأصول المتداولة</span>
                  <span className="numeric">{formatCurrency(totalCurrentAssets)}</span>
                </div>
              </div>

              {/* Non-Current Assets */}
              <div style={{ paddingRight: '1rem' }}>
                <h4 style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem' }}>الأصول غير المتداولة</h4>
                {balanceSheet.assets.nonCurrent.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', fontSize: '0.875rem' }}>
                    <span>{item.name}</span>
                    <span className="numeric">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontWeight: 700, borderTop: '1px dashed var(--color-outline-variant)' }}>
                  <span>إجمالي الأصول غير المتداولة</span>
                  <span className="numeric">{formatCurrency(totalNonCurrentAssets)}</span>
                </div>
              </div>

              {/* Total Assets */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--color-surface-container)', fontWeight: 800, borderRadius: '0.5rem', marginTop: '1rem' }}>
                <span>إجمالي الأصول</span>
                <span className="numeric" style={{ color: 'var(--color-primary)' }}>{formatCurrency(totalAssets)}</span>
              </div>
            </div>

            {/* Liabilities and Equity */}
            <div>
              <h3 style={{ fontWeight: 800, fontSize: '1.0625rem', color: 'var(--color-primary)', borderBottom: '2px solid var(--color-primary)', paddingBottom: '0.25rem', marginBottom: '0.75rem' }}>الالتزامات وحقوق الملكية (Liabilities & Equity)</h3>
              
              {/* Liabilities */}
              <div style={{ paddingRight: '1rem', marginBottom: '1rem' }}>
                <h4 style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem' }}>الالتزامات المتداولة</h4>
                {balanceSheet.liabilities.current.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', fontSize: '0.875rem' }}>
                    <span>{item.name}</span>
                    <span className="numeric">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontWeight: 700, borderTop: '1px dashed var(--color-outline-variant)' }}>
                  <span>إجمالي الالتزامات المتداولة</span>
                  <span className="numeric">{formatCurrency(totalCurrentLiabilities)}</span>
                </div>

                <h4 style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem', marginTop: '1rem' }}>الالتزامات غير المتداولة</h4>
                {balanceSheet.liabilities.nonCurrent.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', fontSize: '0.875rem' }}>
                    <span>{item.name}</span>
                    <span className="numeric">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontWeight: 700, borderTop: '1px dashed var(--color-outline-variant)' }}>
                  <span>إجمالي الالتزامات غير المتداولة</span>
                  <span className="numeric">{formatCurrency(totalNonCurrentLiabilities)}</span>
                </div>
              </div>

              {/* Equity */}
              <div style={{ paddingRight: '1rem', marginBottom: '1rem' }}>
                <h4 style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem' }}>حقوق الملكية</h4>
                {balanceSheet.equity.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', fontSize: '0.875rem' }}>
                    <span>{item.name}</span>
                    <span className="numeric">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontWeight: 700, borderTop: '1px dashed var(--color-outline-variant)' }}>
                  <span>إجمالي حقوق الملكية</span>
                  <span className="numeric">{formatCurrency(totalEquity)}</span>
                </div>
              </div>

              {/* Total Liabilities & Equity */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--color-surface-container)', fontWeight: 800, borderRadius: '0.5rem', marginTop: '1rem' }}>
                <span>إجمالي الالتزامات وحقوق الملكية</span>
                <span className="numeric" style={{ color: 'var(--color-primary)' }}>{formatCurrency(totalLiabilitiesAndEquity)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
