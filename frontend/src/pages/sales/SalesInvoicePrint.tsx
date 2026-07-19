import { useParams, useNavigate } from 'react-router-dom';

export default function SalesInvoicePrint() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const invoice = {
    number: id || 'INV-0089',
    date: '٢٠٢٥/٠٧/١٤',
    dueDate: '٢٠٢٥/٠٨/١٤',
    paymentMethod: 'تحويل بنكي / آجل',
    crNumber: '١٠١٠٠٠٠٠٠١',
    taxNumber: '٣٠٠٠٠٠٠٠٠٠٠٠٠٠٣',
    companyName: 'مؤسسة الأعمال الحديثة',
    companyAddress: 'شارع الملك فهد، حي المروج، الرياض، المملكة العربية السعودية',
    customerName: 'شركة الأفق للتجارة',
    customerTaxNumber: '٣١٠٢٣٤٥٦٧٨٠٠٠٠٣',
    customerAddress: 'طريق الملك عبدالعزيز، الرياض',
    lines: [
      { code: 'ITM-9923', name: 'شاشة سامسونج LED 55 بوصة', qty: 2, price: 2250, discount: 225, taxRate: 15, subtotal: 4275, tax: 641.25 },
      { code: 'ITM-0887', name: 'كابل HDMI 3 متر', qty: 5, price: 45, discount: 0, taxRate: 15, subtotal: 225, tax: 33.75 }
    ],
    subtotal: 4500,
    discount: 225,
    taxableAmount: 4275,
    vatAmount: 675,
    grandTotal: 4950
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '2rem 1rem', direction: 'rtl', fontFamily: 'system-ui, sans-serif' }}>
      {/* Action panel at the top (hidden during printing) */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-area { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; padding: 0 !important; }
        }
      `}</style>

      <div className="no-print" style={{ maxWidth: '800px', margin: '0 auto 1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
          العودة
        </button>
        <button className="btn btn-primary btn-sm" onClick={handlePrint}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>
          اطبع الفاتورة
        </button>
      </div>

      {/* Invoice Area */}
      <div className="print-area" style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '3rem', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        {/* Header Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', borderBottom: '2px solid #006767', paddingBottom: '1.5rem' }}>
          <div>
            <h1 style={{ color: '#006767', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem' }}>{invoice.companyName}</h1>
            <p style={{ fontSize: '0.8125rem', color: '#6d7979', margin: '0 0 0.25rem' }}>{invoice.companyAddress}</p>
            <p style={{ fontSize: '0.8125rem', color: '#6d7979', margin: 0 }}>
              السجل التجاري: <span className="numeric">{invoice.crNumber}</span> | الرقم الضريبي: <span className="numeric">{invoice.taxNumber}</span>
            </p>
          </div>
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#191c1e' }}>فاتورة ضريبية مبسطة / Tax Invoice</h2>
            <div style={{ fontSize: '0.875rem', color: '#191c1e' }}>
              رقم الفاتورة: <span className="numeric" style={{ fontWeight: 700, color: '#006767' }}>{invoice.number}</span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#6d7979', marginTop: '0.25rem' }}>
              تاريخ الإصدار: <span className="numeric">{invoice.date}</span>
            </div>
          </div>
        </div>

        {/* Customer & Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', margin: '2rem 0' }}>
          <div style={{ background: '#f8f9fb', padding: '1.25rem', borderRadius: '6px' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#006767', margin: '0 0 0.75rem' }}>بيانات العميل (Bill To)</h3>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0 0.5rem' }}>{invoice.customerName}</p>
            <p style={{ fontSize: '0.8125rem', color: '#6d7979', margin: '0 0 0.25rem' }}>العنوان: {invoice.customerAddress}</p>
            <p style={{ fontSize: '0.8125rem', color: '#6d7979', margin: 0 }}>
              الرقم الضريبي للعميل: <span className="numeric">{invoice.customerTaxNumber}</span>
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
            <div style={{ fontSize: '0.8125rem' }}>طريقة الدفع: <strong>{invoice.paymentMethod}</strong></div>
            <div style={{ fontSize: '0.8125rem' }}>تاريخ الاستحقاق: <span className="numeric">{invoice.dueDate}</span></div>
          </div>
        </div>

        {/* Lines Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
          <thead>
            <tr style={{ background: '#006767', color: 'white' }}>
              <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.8125rem' }}>كود البند</th>
              <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.8125rem' }}>الوصف</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8125rem' }}>الكمية</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem' }}>سعر الوحدة</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem' }}>الخصم</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8125rem' }}>الضريبة %</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem' }}>الصافي</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #eceef0' }}>
                <td style={{ padding: '0.75rem', fontSize: '0.8125rem', fontFamily: 'monospace' }}>{line.code}</td>
                <td style={{ padding: '0.75rem', fontSize: '0.8125rem', fontWeight: 600 }}>{line.name}</td>
                <td style={{ padding: '0.75rem', fontSize: '0.8125rem', textAlign: 'center' }}>{line.qty}</td>
                <td style={{ padding: '0.75rem', fontSize: '0.8125rem', textAlign: 'left' }}>{line.price.toFixed(2)} ر.س</td>
                <td style={{ padding: '0.75rem', fontSize: '0.8125rem', textAlign: 'left', color: '#ba1a1a' }}>{line.discount > 0 ? `-${line.discount.toFixed(2)}` : '—'}</td>
                <td style={{ padding: '0.75rem', fontSize: '0.8125rem', textAlign: 'center' }}>{line.taxRate}%</td>
                <td style={{ padding: '0.75rem', fontSize: '0.8125rem', textAlign: 'left', fontWeight: 700 }}>{line.subtotal.toFixed(2)} ر.س</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Block */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'flex-start' }}>
          {/* ZATCA QR Code (Required for e-invoicing in SA) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid #bcc9c8', padding: '1rem', borderRadius: '8px', maxWidth: '300px' }}>
            <div style={{ width: '90px', height: '90px', background: '#eceef0', border: '1px solid #bcc9c8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#6d7979' }}>qr_code_2</span>
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#006767' }}>رمز الاستجابة السريع ZATCA</div>
              <div style={{ fontSize: '0.7rem', color: '#6d7979', marginTop: '0.25rem', lineHeight: 1.3 }}>
                فاتورة ضريبية مبسطة معتمدة ومتوافقة مع متطلبات الفوترة الإلكترونية للمرحلة الثانية.
              </div>
            </div>
          </div>

          {/* Invoice Totals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', paddingRight: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span>المجموع الفرعي (Subtotal)</span>
              <span className="numeric">{invoice.subtotal.toFixed(2)} ر.س</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#ba1a1a' }}>
              <span>إجمالي الخصم (Discount)</span>
              <span className="numeric">-{invoice.discount.toFixed(2)} ر.س</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span>الوعاء الضريبي (Taxable Amount)</span>
              <span className="numeric">{invoice.taxableAmount.toFixed(2)} ر.س</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span>ضريبة القيمة المضافة ١٥% (VAT)</span>
              <span className="numeric">{invoice.vatAmount.toFixed(2)} ر.س</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.0625rem', fontWeight: 800, color: '#006767', borderTop: '2px solid #006767', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
              <span>الإجمالي المستحق (Total Due)</span>
              <span className="numeric">{invoice.grandTotal.toFixed(2)} ر.س</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ marginTop: '4rem', borderTop: '1px solid #eceef0', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#6d7979' }}>
          نشكركم لتعاملكم معنا. في حال وجود أي استفسار يرجى الاتصال بقسم الحسابات أو عبر البريد الإلكتروني المذكور أعلاه.
        </div>
      </div>
    </div>
  );
}
