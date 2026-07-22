import { useState, useEffect } from 'react';
import api from '../../api/client';

interface PaymentVoucherData {
  id: string;
  voucher_number: string;
  voucher_date: string;
  supplier_id?: string;
  supplier_name?: string;
  beneficiary_name?: string;
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

interface SupplierItem {
  id: string;
  code: string;
  name_ar: string;
  currency_id?: string;
  balance?: number;
  ap_account_id?: string;
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

interface GlAccountItem {
  id: string;
  code: string;
  name_ar: string;
}

interface CostCenterItem {
  id: string;
  code: string;
  name_ar: string;
}

interface AllocationLine {
  glAccountId: string;
  costCenterId: string;
  amount: number;
  notes: string;
}

export default function PaymentVoucher() {
  const [payments, setPayments] = useState<PaymentVoucherData[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [cashBoxes, setCashBoxes] = useState<CashBoxItem[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyItem[]>([]);
  const [glAccounts, setGlAccounts] = useState<GlAccountItem[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenterItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [voucherType, setVoucherType] = useState<'cash' | 'bank' | 'cheque'>('cash');

  const [allocations, setAllocations] = useState<AllocationLine[]>([]);

  // Form state
  const [form, setForm] = useState({
    supplierId: '',
    beneficiaryName: '',
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

  const [selectedCashBox, setSelectedCashBox] = useState<CashBoxItem | null>(null);
  const [selectedBankAccount, setSelectedBankAccount] = useState<BankAccountItem | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierItem | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [pRes, sRes, cbRes, baRes, curRes, accRes, ccRes] = await Promise.all([
        api.get('/accounting/payment-vouchers').catch(() => ({ data: { data: [] } })),
        api.get('/setup/suppliers').catch(() => api.get('/purchasing/suppliers')).catch(() => ({ data: { data: [] } })),
        api.get('/setup/cash-boxes').catch(() => ({ data: { data: [] } })),
        api.get('/setup/bank-accounts').catch(() => ({ data: { data: [] } })),
        api.get('/setup/currencies').catch(() => ({ data: { data: [] } })),
        api.get('/accounting/accounts').catch(() => ({ data: { data: [] } })),
        api.get('/accounting/cost-centers').catch(() => ({ data: { data: [] } })),
      ]);

      const rawPayments = pRes.data?.data?.items || pRes.data?.data || (Array.isArray(pRes.data) ? pRes.data : []);
      setPayments(Array.isArray(rawPayments) ? rawPayments : []);

      const sList = sRes.data?.data?.items || sRes.data?.data || (Array.isArray(sRes.data) ? sRes.data : []);
      const cbList = cbRes.data?.data?.items || cbRes.data?.data || (Array.isArray(cbRes.data) ? cbRes.data : []);
      const baList = baRes.data?.data?.items || baRes.data?.data || (Array.isArray(baRes.data) ? baRes.data : []);
      const curList = curRes.data?.data?.items || curRes.data?.data || (Array.isArray(curRes.data) ? curRes.data : []);
      const accList = accRes.data?.data?.items || accRes.data?.data || (Array.isArray(accRes.data) ? accRes.data : []);
      const ccList = ccRes.data?.data?.items || ccRes.data?.data || (Array.isArray(ccRes.data) ? ccRes.data : []);

      setSuppliers(Array.isArray(sList) ? sList : []);
      setCashBoxes(Array.isArray(cbList) ? cbList : []);
      setBankAccounts(Array.isArray(baList) ? baList : []);
      setCurrencies(Array.isArray(curList) ? curList : []);
      setGlAccounts(Array.isArray(accList) ? accList : []);
      setCostCenters(Array.isArray(ccList) ? ccList : []);

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
      console.error('Error loading payment vouchers:', err);
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

  const handleSupplierChange = (id: string) => {
    const supp = suppliers.find((item) => item.id === id);
    if (supp) {
      setSelectedSupplier(supp);
      setForm((prev) => ({
        ...prev,
        supplierId: supp.id,
        beneficiaryName: supp.name_ar,
        currencyId: supp.currency_id || prev.currencyId,
      }));
    }
  };

  const addAllocationLine = () => {
    setAllocations([
      ...(allocations || []),
      {
        glAccountId: glAccounts[0]?.id || '',
        costCenterId: costCenters[0]?.id || '',
        amount: 0,
        notes: '',
      },
    ]);
  };

  const totalAllocated = (allocations || []).reduce((sum, line) => sum + (Number(line.amount) || 0), 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalAmount = allocations.length > 0 ? totalAllocated : form.amount;
      if (finalAmount <= 0) {
        alert('يرجى تحديد المبلغ المصروف (يجب أن يكون أكبر من صفر)');
        return;
      }

      const payload = {
        ...form,
        amount: finalAmount,
        cashBoxId: voucherType === 'cash' ? form.cashBoxId : null,
        bankAccountId: voucherType !== 'cash' ? form.bankAccountId : null,
        lines: allocations,
      };

      const res = await api.post('/accounting/payment-vouchers', payload);
      alert(res.data.message || 'تم حفظ سند الصرف بنجاح');
      setShowModal(false);
      setAllocations([]);
      fetchInitialData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطأ في حفظ سند الصرف');
    }
  };

  const handleStatusAction = async (id: string, action: 'Approve' | 'Post' | 'Reverse') => {
    try {
      const res = await api.put(`/accounting/payment-vouchers/${id}/status`, { action });
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
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>سندات الصرف (المدفوعات والمصاريف)</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
            إصدار ومدفوعات الموردين وتوزيع المصاريف على مراكز التكلفة والصناديق والبنوك
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          إنشاء سند صرف جديد
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>رقم السند</th>
              <th>المستفيد / المورد</th>
              <th>تاريخ السند</th>
              <th style={{ textAlign: 'left' }}>القيمة المصروفة</th>
              <th>مصدر الصرف</th>
              <th>طريقة الترحيل</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {!Array.isArray(payments) || payments.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                  {loading ? 'جاري التحميل...' : 'لا توجد سندات صرف مسجلة'}
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      {p.voucher_number}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{p.beneficiary_name || p.supplier_name || '—'}</td>
                  <td className="numeric">{formatDate(p.voucher_date)}</td>
                  <td className="numeric" style={{ textAlign: 'left', fontWeight: 700 }}>
                    {Number(p.amount || 0).toLocaleString('ar-SA')} {p.currency_code || 'ر.س'}
                  </td>
                  <td>{p.cash_box_name || p.bank_account_name || 'نقداً'}</td>
                  <td>
                    <span className="chip chip-info">
                      {p.posting_mode === 'DueDate' ? 'تاريخ الاستحقاق' :
                       p.posting_mode === 'BillsPayable' ? 'أوراق دفع' : 'فوري'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`chip ${
                        p.status === 'Posted' ? 'chip-success' :
                        p.status === 'Approved' ? 'chip-info' :
                        p.status === 'Rejected' ? 'chip-error' :
                        p.status === 'Reversed' ? 'chip-neutral' : 'chip-neutral'
                      }`}
                    >
                      {p.status === 'Posted' ? 'مرحل مالياً' :
                       p.status === 'Approved' ? 'معتمد' :
                       p.status === 'Rejected' ? 'مرفوض' :
                       p.status === 'Reversed' ? 'معكوس' : 'مسودة'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {p.status === 'Draft' && (
                        <>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleStatusAction(p.id, 'Approve')}
                            title="اعتماد"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified</span>
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleStatusAction(p.id, 'Reject')}
                            title="رفض"
                            style={{ color: 'var(--color-error)' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>cancel</span>
                          </button>
                        </>
                      )}
                      {(p.status === 'Approved' || p.status === 'Draft') && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleStatusAction(p.id, 'Post')}
                          title="ترحيل"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>output</span>
                        </button>
                      )}
                      {p.status === 'Posted' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleStatusAction(p.id, 'Reverse')}
                          title="عكس السند"
                          style={{ color: 'var(--color-error)' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>undo</span>
                        </button>
                      )}
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => alert(`طباعة سند الصرف رقم: ${p.voucher_number}`)}
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
          <div className="modal-box" style={{ maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem' }}>إصدار سند صرف جديد</h2>

            {/* Type Switcher */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-outline-variant)' }}>
              <button
                type="button"
                className={`btn ${voucherType === 'cash' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setVoucherType('cash')}
              >
                صرف نقدي (صندوق مالي)
              </button>
              <button
                type="button"
                className={`btn ${voucherType === 'bank' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setVoucherType('bank')}
              >
                صرف بنكي (تحويل)
              </button>
              <button
                type="button"
                className={`btn ${voucherType === 'cheque' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setVoucherType('cheque')}
              >
                صرف بشيك (أوراق دفع)
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>اختيار المورد المستفيد (اختياري)</label>
                  <select
                    className="input"
                    value={form.supplierId}
                    onChange={(e) => handleSupplierChange(e.target.value)}
                  >
                    <option value="">-- اختياري (أو ادخل اسم المستفيد) --</option>
                    {Array.isArray(suppliers) && suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.code} - {s.name_ar}</option>
                    ))}
                  </select>
                  {selectedSupplier && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', marginTop: '0.25rem' }}>
                      الرصيد المتبقي للمورد: {Number(selectedSupplier.balance || 0).toLocaleString('ar-SA')} ر.س
                    </div>
                  )}
                </div>

                <div>
                  <label>اسم المستفيد / الجهة *</label>
                  <input
                    className="input"
                    value={form.beneficiaryName}
                    onChange={(e) => setForm({ ...form, beneficiaryName: e.target.value })}
                    required
                    placeholder="اسم الشخص أو المورد المستلم"
                  />
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

                {/* Cash Box or Bank Account selection */}
                {voucherType === 'cash' ? (
                  <div>
                    <label>الصندوق الممول للصرف *</label>
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
                        الرصيد المتاح بالصندوق: {Number(selectedCashBox.current_balance || 0).toLocaleString('ar-SA')} {selectedCashBox.currency_code || 'ر.س'}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label>الحساب البنكي الممول للصرف *</label>
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
                        الرصيد المتاح بالبنك: {Number(selectedBankAccount.current_balance || 0).toLocaleString('ar-SA')} | IBAN: {selectedBankAccount.iban || '—'}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label>المبلغ الإجمالي المصروف *</label>
                  <input
                    className="input numeric"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={allocations.length > 0 ? totalAllocated : form.amount || ''}
                    onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                    readOnly={allocations.length > 0}
                    required
                  />
                </div>

                <div>
                  <label>طريقة الترحيل (Posting Method)</label>
                  <select
                    className="input"
                    value={form.postingMode}
                    onChange={(e) => setForm({ ...form, postingMode: e.target.value })}
                  >
                    <option value="Immediate">ترحيل فوري</option>
                    <option value="DueDate">ترحيل بتاريخ الاستحقاق</option>
                    <option value="BillsPayable">أوراق دفع مستحقة</option>
                    <option value="ManualMaturity">مطابقة يدوية</option>
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
                        placeholder="CHQ-882910"
                      />
                    </div>
                    <div>
                      <label>تاريخ استحقاق الشيك</label>
                      <input
                        className="input"
                        type="date"
                        value={form.chequeDate}
                        onChange={(e) => setForm({ ...form, chequeDate: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label>حالة السند</label>
                  <select
                    className="input"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                  >
                    <option value="Draft">مسودة (Draft)</option>
                    <option value="Approved">معتمد (Approved)</option>
                    <option value="Posted">ترحيل وتحديث الأرصدة (Posted)</option>
                  </select>
                </div>
              </div>

              {/* Expense Allocation Table */}
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>
                    توزيع بنود المصاريف وتكلفة النشاط (Expense Allocation)
                  </h3>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={addAllocationLine}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                    إضافة بند مصروف
                  </button>
                </div>

                {Array.isArray(allocations) && allocations.length > 0 && (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                        <th style={{ textAlign: 'right', padding: '0.5rem', fontSize: '0.8125rem' }}>حساب المصروف *</th>
                        <th style={{ textAlign: 'right', padding: '0.5rem', fontSize: '0.8125rem' }}>مركز التكلفة</th>
                        <th style={{ textAlign: 'left', padding: '0.5rem', fontSize: '0.8125rem', width: '25%' }}>المبلغ *</th>
                        <th style={{ width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {allocations.map((line, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--color-surface-container)' }}>
                          <td style={{ padding: '0.5rem' }}>
                            <select
                              className="input"
                              value={line.glAccountId}
                              onChange={(e) => {
                                const newLines = [...allocations];
                                newLines[idx].glAccountId = e.target.value;
                                setAllocations(newLines);
                              }}
                            >
                              {Array.isArray(glAccounts) && glAccounts.map((a) => (
                                <option key={a.id} value={a.id}>{a.code} - {a.name_ar}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            <select
                              className="input"
                              value={line.costCenterId}
                              onChange={(e) => {
                                const newLines = [...allocations];
                                newLines[idx].costCenterId = e.target.value;
                                setAllocations(newLines);
                              }}
                            >
                              <option value="">-- اختياري --</option>
                              {Array.isArray(costCenters) && costCenters.map((cc) => (
                                <option key={cc.id} value={cc.id}>{cc.code} - {cc.name_ar}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            <input
                              className="input numeric"
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={line.amount || ''}
                              onChange={(e) => {
                                const newLines = [...allocations];
                                newLines[idx].amount = parseFloat(e.target.value) || 0;
                                setAllocations(newLines);
                              }}
                              required
                            />
                          </td>
                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--color-error)' }}
                              onClick={() => setAllocations(allocations.filter((_, i) => i !== idx))}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
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
                <button type="submit" className="btn btn-primary">حفظ سند الصرف</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
