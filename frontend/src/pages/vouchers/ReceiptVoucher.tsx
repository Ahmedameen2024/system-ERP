import { useState, useEffect } from 'react';
import api from '../../api/client';

interface ReceiptVoucherData {
  id: string;
  voucher_number: string;
  voucher_date: string;
  customer_id?: string;
  customer_name?: string;
  amount: number;
  payment_method_id?: string;
  cash_box_id?: string;
  cash_box_name?: string;
  bank_account_id?: string;
  bank_account_name?: string;
  currency_code?: string;
  cheque_number?: string;
  cheque_date?: string;
  bank_name?: string;
  status: 'Draft' | 'Approved' | 'Posted' | 'Reversed';
  posting_mode?: string;
  description?: string;
}

interface CustomerItem {
  id: string;
  code: string;
  name_ar: string;
  currency_id?: string;
  balance?: number;
  ar_account_id?: string;
}

interface CashBoxItem {
  id: string;
  code: string;
  name_ar: string;
  branch_id: string;
  currency_id: string;
  currency_code?: string;
  gl_account_id: string;
  current_balance: number;
}

interface BankAccountItem {
  id: string;
  code: string;
  name_ar: string;
  account_number: string;
  iban?: string;
  branch_id: string;
  currency_id: string;
  currency_code?: string;
  gl_account_id: string;
  current_balance: number;
}

interface CurrencyItem {
  id: string;
  code: string;
  name_ar: string;
}

export default function ReceiptVoucher() {
  const [receipts, setReceipts] = useState<ReceiptVoucherData[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [cashBoxes, setCashBoxes] = useState<CashBoxItem[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [voucherType, setVoucherType] = useState<'cash' | 'bank' | 'cheque'>('cash');

  // Form state
  const [form, setForm] = useState({
    customerId: '',
    voucherDate: new Date().toISOString().slice(0, 10),
    amount: 0,
    cashBoxId: '',
    bankAccountId: '',
    currencyId: '',
    exchangeRate: 1,
    postingMode: 'Immediate',
    dueDate: '',
    chequeNumber: '',
    chequeDate: '',
    bankName: '',
    description: '',
    status: 'Draft' as 'Draft' | 'Approved' | 'Posted',
  });

  // Selected sub-ledger details
  const [selectedCashBox, setSelectedCashBox] = useState<CashBoxItem | null>(null);
  const [selectedBankAccount, setSelectedBankAccount] = useState<BankAccountItem | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [rRes, cRes, cbRes, baRes, curRes] = await Promise.all([
        api.get('/accounting/receipt-vouchers').catch(() => ({ data: { data: [] } })),
        api.get('/sales/customers').catch(() => ({ data: { data: [] } })),
        api.get('/setup/cash-boxes').catch(() => ({ data: { data: [] } })),
        api.get('/setup/bank-accounts').catch(() => ({ data: { data: [] } })),
        api.get('/setup/currencies').catch(() => ({ data: { data: [] } })),
      ]);

      const rawReceipts = rRes.data?.data?.items || rRes.data?.data || (Array.isArray(rRes.data) ? rRes.data : []);
      setReceipts(Array.isArray(rawReceipts) ? rawReceipts : []);
      
      const cList = cRes.data?.data?.items || cRes.data?.data || (Array.isArray(cRes.data) ? cRes.data : []);
      const cbList = cbRes.data?.data?.items || cbRes.data?.data || (Array.isArray(cbRes.data) ? cbRes.data : []);
      const baList = baRes.data?.data?.items || baRes.data?.data || (Array.isArray(baRes.data) ? baRes.data : []);
      const curList = curRes.data?.data?.items || curRes.data?.data || (Array.isArray(curRes.data) ? curRes.data : []);

      setCustomers(Array.isArray(cList) ? cList : []);
      setCashBoxes(Array.isArray(cbList) ? cbList : []);
      setBankAccounts(Array.isArray(baList) ? baList : []);
      setCurrencies(Array.isArray(curList) ? curList : []);

      if (Array.isArray(cList) && cList.length > 0 && cList[0]) {
        setForm((prev) => ({ ...prev, customerId: cList[0].id || '' }));
        setSelectedCustomer(cList[0]);
      }

      if (Array.isArray(curList) && curList.length > 0 && curList[0]) {
        setForm((prev) => ({ ...prev, currencyId: curList[0].id || '' }));
      }

      if (Array.isArray(cbList) && cbList.length > 0 && cbList[0]) {
        setForm((prev) => ({
          ...prev,
          cashBoxId: cbList[0].id || '',
          currencyId: cbList[0].currency_id || prev.currencyId || (curList[0]?.id || ''),
        }));
        setSelectedCashBox(cbList[0]);
      } else if (Array.isArray(baList) && baList.length > 0 && baList[0]) {
        setForm((prev) => ({
          ...prev,
          bankAccountId: baList[0].id || '',
          currencyId: baList[0].currency_id || prev.currencyId || (curList[0]?.id || ''),
        }));
        setSelectedBankAccount(baList[0]);
      }
    } catch (err: any) {
      console.error('Error loading receipt vouchers:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('ar-SA');
    } catch {
      return '—';
    }
  };

  // Handle Cash Box Change
  const handleCashBoxChange = (id: string) => {
    const cb = cashBoxes.find((item) => item.id === id);
    if (cb) {
      setSelectedCashBox(cb);
      setForm((prev) => ({
        ...prev,
        cashBoxId: cb.id,
        currencyId: cb.currency_id || prev.currencyId,
      }));
    }
  };

  // Handle Bank Account Change
  const handleBankAccountChange = (id: string) => {
    const ba = bankAccounts.find((item) => item.id === id);
    if (ba) {
      setSelectedBankAccount(ba);
      setForm((prev) => ({
        ...prev,
        bankAccountId: ba.id,
        currencyId: ba.currency_id || prev.currencyId,
      }));
    }
  };

  // Handle Customer Change
  const handleCustomerChange = (id: string) => {
    const cust = customers.find((item) => item.id === id);
    if (cust) {
      setSelectedCustomer(cust);
      setForm((prev) => ({
        ...prev,
        customerId: cust.id,
        currencyId: cust.currency_id || prev.currencyId,
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        cashBoxId: voucherType === 'cash' ? form.cashBoxId : null,
        bankAccountId: voucherType !== 'cash' ? form.bankAccountId : null,
      };

      const res = await api.post('/accounting/receipt-vouchers', payload);
      alert(res.data.message || 'تم حفظ سند القبض بنجاح');
      setShowModal(false);
      fetchInitialData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطأ في حفظ سند القبض');
    }
  };

  const handleStatusAction = async (id: string, action: 'Approve' | 'Post' | 'Reverse') => {
    try {
      const res = await api.put(`/accounting/receipt-vouchers/${id}/status`, { action });
      alert(res.data.message || 'تم تحديث حالة السند بنجاح');
      fetchInitialData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'تعذر إجراء العملية');
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>سندات القبض (مقبوضات العملاء والصناديق)</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
            تسجيل وإدارة المتحصلات المالية وتحديث أرصدة الخزينة والحسابات البنكية وحسابات العملاء
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          إنشاء سند قبض جديد
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>رقم السند</th>
              <th>المستلم منه (العميل)</th>
              <th>تاريخ السند</th>
              <th style={{ textAlign: 'left' }}>القيمة المستلمة</th>
              <th>وسيلة / حساب القبض</th>
              <th>طريقة الترحيل</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {!Array.isArray(receipts) || receipts.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                  {loading ? 'جاري التحميل...' : 'لا توجد سندات قبض مسجلة'}
                </td>
              </tr>
            ) : (
              receipts.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      {r.voucher_number}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{r.customer_name || 'عميل نقدي'}</td>
                  <td className="numeric">{formatDate(r.voucher_date)}</td>
                  <td className="numeric" style={{ textAlign: 'left', fontWeight: 700 }}>
                    {Number(r.amount || 0).toLocaleString('ar-SA')} {r.currency_code || 'ر.س'}
                  </td>
                  <td>{r.cash_box_name || r.bank_account_name || 'نقداً'}</td>
                  <td>
                    <span className="chip chip-info">
                      {r.posting_mode === 'DueDate' ? 'تاريخ الاستحقاق' :
                       r.posting_mode === 'BillsReceivable' ? 'أوراق قبض' : 'فوري'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`chip ${
                        r.status === 'Posted' ? 'chip-success' :
                        r.status === 'Approved' ? 'chip-info' :
                        r.status === 'Rejected' ? 'chip-error' :
                        r.status === 'Reversed' ? 'chip-neutral' : 'chip-neutral'
                      }`}
                    >
                      {r.status === 'Posted' ? 'مرحل مالياً' :
                       r.status === 'Approved' ? 'معتمد' :
                       r.status === 'Rejected' ? 'مرفوض' :
                       r.status === 'Reversed' ? 'معكوس' : 'مسودة'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {r.status === 'Draft' && (
                        <>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleStatusAction(r.id, 'Approve')}
                            title="اعتماد"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified</span>
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleStatusAction(r.id, 'Reject')}
                            title="رفض"
                            style={{ color: 'var(--color-error)' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>cancel</span>
                          </button>
                        </>
                      )}
                      {(r.status === 'Approved' || r.status === 'Draft') && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleStatusAction(r.id, 'Post')}
                          title="ترحيل"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>output</span>
                        </button>
                      )}
                      {r.status === 'Posted' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleStatusAction(r.id, 'Reverse')}
                          title="عكس السند"
                          style={{ color: 'var(--color-error)' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>undo</span>
                        </button>
                      )}
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => alert(`طباعة سند القبض رقم: ${r.voucher_number}`)}
                        title="طباعة"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem' }}>إصدار سند قبض جديد</h2>
            
            {/* Voucher Type Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-outline-variant)' }}>
              <button
                type="button"
                className={`btn ${voucherType === 'cash' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setVoucherType('cash')}
              >
                قبض نقدي (صندوق مالي)
              </button>
              <button
                type="button"
                className={`btn ${voucherType === 'bank' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setVoucherType('bank')}
              >
                قبض بنكي (تحويل)
              </button>
              <button
                type="button"
                className={`btn ${voucherType === 'cheque' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setVoucherType('cheque')}
              >
                قبض بشيك (أوراق قبض)
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>المستلم منه (العميل) *</label>
                  <select
                    className="input"
                    value={form.customerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    required
                  >
                    <option value="">-- اختر العميل --</option>
                    {Array.isArray(customers) && customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name_ar}</option>
                    ))}
                  </select>
                  {selectedCustomer && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', marginTop: '0.25rem' }}>
                      الرصيد المستحق: {Number(selectedCustomer.balance || 0).toLocaleString('ar-SA')} ر.س
                    </div>
                  )}
                </div>

                <div>
                  <label>تاريخ السند *</label>
                  <input
                    className="input"
                    type="date"
                    value={form.voucherDate}
                    onChange={(e) => setForm({ ...form, voucherDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label>القيمة المستلمة *</label>
                  <input
                    className="input numeric"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount || ''}
                    onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div>
                  <label>العملة *</label>
                  <select
                    className="input"
                    value={form.currencyId}
                    onChange={(e) => setForm({ ...form, currencyId: e.target.value })}
                    required
                  >
                    {Array.isArray(currencies) && currencies.map((c) => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name_ar}</option>
                    ))}
                  </select>
                </div>

                {/* Subledger Selection based on type */}
                {voucherType === 'cash' ? (
                  <div>
                    <label>الصندوق المستلم *</label>
                    <select
                      className="input"
                      value={form.cashBoxId}
                      onChange={(e) => handleCashBoxChange(e.target.value)}
                      required
                    >
                      {Array.isArray(cashBoxes) && cashBoxes.map((cb) => (
                        <option key={cb.id} value={cb.id}>{cb.code} - {cb.name_ar}</option>
                      ))}
                    </select>
                    {selectedCashBox && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginTop: '0.25rem' }}>
                        الرصيد الحالي للصندوق: {Number(selectedCashBox.current_balance || 0).toLocaleString('ar-SA')} {selectedCashBox.currency_code || 'ر.س'}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label>الحساب البنكي المستلم *</label>
                    <select
                      className="input"
                      value={form.bankAccountId}
                      onChange={(e) => handleBankAccountChange(e.target.value)}
                      required
                    >
                      {Array.isArray(bankAccounts) && bankAccounts.map((ba) => (
                        <option key={ba.id} value={ba.id}>{ba.code} - {ba.name_ar} ({ba.account_number})</option>
                      ))}
                    </select>
                    {selectedBankAccount && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginTop: '0.25rem' }}>
                        الرصيد الحالي: {Number(selectedBankAccount.current_balance || 0).toLocaleString('ar-SA')} | IBAN: {selectedBankAccount.iban || '—'}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label>طريقة الترحيل (Posting Rule)</label>
                  <select
                    className="input"
                    value={form.postingMode}
                    onChange={(e) => setForm({ ...form, postingMode: e.target.value })}
                  >
                    <option value="Immediate">ترحيل فوري</option>
                    <option value="DueDate">ترحيل بتاريخ الاستحقاق</option>
                    <option value="BillsReceivable">أوراق قبض تحت التحصيل</option>
                    <option value="ManualClearing">مقاصة يدوية</option>
                  </select>
                </div>

                {voucherType === 'cheque' && (
                  <>
                    <div>
                      <label>رقم الشيك</label>
                      <input
                        className="input numeric"
                        value={form.chequeNumber}
                        onChange={(e) => setForm({ ...form, chequeNumber: e.target.value })}
                        placeholder="CHQ-100293"
                      />
                    </div>
                    <div>
                      <label>تاريخ الشيك / الاستحقاق</label>
                      <input
                        className="input"
                        type="date"
                        value={form.chequeDate}
                        onChange={(e) => setForm({ ...form, chequeDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label>اسم البنك المسحوب عليه</label>
                      <input
                        className="input"
                        value={form.bankName}
                        onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                        placeholder="مثال: البنك الأهلي السعودي"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label>حالة السند عند الحفظ</label>
                  <select
                    className="input"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                  >
                    <option value="Draft">حفظ كمسودة (Draft)</option>
                    <option value="Approved">حفظ كمعتمد (Approved)</option>
                    <option value="Posted">حفظ وترحيل فوري (Posted)</option>
                  </select>
                </div>
              </div>

              <div>
                <label>البيان / الوصف التفصيلي</label>
                <textarea
                  className="input"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="ملاحظات تفصيلية عن المعاملة..."
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ السند</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
