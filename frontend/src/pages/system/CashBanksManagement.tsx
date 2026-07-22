import { useState, useEffect } from 'react';
import api from '../../api/client';

interface CashBox {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  branch_id: string;
  branch_name_ar?: string;
  currency_id: string;
  currency_code?: string;
  currency_symbol?: string;
  gl_account_id: string;
  gl_account_code?: string;
  gl_account_name?: string;
  responsible_employee_id?: string;
  responsible_employee_name?: string;
  opening_balance: number;
  current_balance: number;
  maximum_balance: number;
  status: 'Active' | 'Inactive';
  notes?: string;
}

interface BankAccount {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  branch_id: string;
  branch_name_ar?: string;
  currency_id: string;
  currency_code?: string;
  currency_symbol?: string;
  gl_account_id: string;
  gl_account_code?: string;
  gl_account_name?: string;
  account_number: string;
  iban?: string;
  swift?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  opening_balance: number;
  current_balance: number;
  status: 'Active' | 'Inactive';
  notes?: string;
}

interface OptionItem {
  id: string;
  code?: string;
  name_ar: string;
  name_en?: string;
}

export default function CashBanksManagement() {
  const [activeTab, setActiveTab] = useState<'cashBoxes' | 'bankAccounts'>('cashBoxes');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Data lists
  const [cashBoxes, setCashBoxes] = useState<CashBox[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [branches, setBranches] = useState<OptionItem[]>([]);
  const [currencies, setCurrencies] = useState<OptionItem[]>([]);
  const [glAccounts, setGlAccounts] = useState<OptionItem[]>([]);
  const [users, setUsers] = useState<OptionItem[]>([]);

  // Modals state
  const [showCashModal, setShowCashModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Cash Box Form
  const [cashForm, setCashForm] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    branchId: '',
    currencyId: '',
    glAccountId: '',
    responsibleEmployeeId: '',
    openingBalance: 0,
    maximumBalance: 0,
    status: 'Active' as 'Active' | 'Inactive',
    notes: '',
  });

  // Bank Account Form
  const [bankForm, setBankForm] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    branchId: '',
    currencyId: '',
    glAccountId: '',
    accountNumber: '',
    iban: '',
    swift: '',
    contactPerson: '',
    phone: '',
    email: '',
    openingBalance: 0,
    status: 'Active' as 'Active' | 'Inactive',
    notes: '',
  });

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab, search]);

  const fetchLookups = async () => {
    try {
      const [bRes, cRes, aRes, uRes] = await Promise.all([
        api.get('/setup/branches').catch(() => ({ data: { data: [] } })),
        api.get('/setup/currencies').catch(() => ({ data: { data: [] } })),
        api.get('/accounting/accounts').catch(() => ({ data: { data: [] } })),
        api.get('/setup/users').catch(() => ({ data: { data: [] } })),
      ]);

      const bData = bRes.data.data || [];
      const cData = cRes.data.data || [];
      const aData = aRes.data.data || [];
      const uData = uRes.data.data || [];

      setBranches(bData);
      setCurrencies(cData);
      setGlAccounts(aData);
      setUsers(uData);

      // Default dropdown values for new forms
      if (bData.length > 0) {
        setCashForm((prev) => ({ ...prev, branchId: bData[0].id }));
        setBankForm((prev) => ({ ...prev, branchId: bData[0].id }));
      }
      if (cData.length > 0) {
        setCashForm((prev) => ({ ...prev, currencyId: cData[0].id }));
        setBankForm((prev) => ({ ...prev, currencyId: cData[0].id }));
      }
      if (aData.length > 0) {
        setCashForm((prev) => ({ ...prev, glAccountId: aData[0].id }));
        setBankForm((prev) => ({ ...prev, glAccountId: aData[0].id }));
      }
    } catch (err: any) {
      console.error('Error loading lookup options:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'cashBoxes') {
        const res = await api.get('/setup/cash-boxes', { params: { search } });
        setCashBoxes(res.data.data?.items || res.data.data || []);
      } else {
        const res = await api.get('/setup/bank-accounts', { params: { search } });
        setBankAccounts(res.data.data?.items || res.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'تعذر تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  // Handle Cash Box Save
  const handleCashSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/setup/cash-boxes/${editingId}`, cashForm);
        alert('تم تحديث بيانات الصندوق بنجاح');
      } else {
        await api.post('/setup/cash-boxes', cashForm);
        alert('تم إنشاء الصندوق بنجاح');
      }
      setShowCashModal(false);
      resetCashForm();
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطأ في حفظ بيانات الصندوق');
    }
  };

  // Handle Bank Account Save
  const handleBankSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/setup/bank-accounts/${editingId}`, bankForm);
        alert('تم تحديث بيانات الحساب البنكي بنجاح');
      } else {
        await api.post('/setup/bank-accounts', bankForm);
        alert('تم إضافة الحساب البنكي بنجاح');
      }
      setShowBankModal(false);
      resetBankForm();
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطأ في حفظ الحساب البنكي');
    }
  };

  // Delete Handlers
  const handleDeleteCash = async (id: string) => {
    if (!window.confirm('هل أنت تأكد من رغبتك في حذف هذا الصندوق؟')) return;
    try {
      await api.delete(`/setup/cash-boxes/${id}`);
      alert('تم حذف الصندوق بنجاح');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'تعذر حذف الصندوق');
    }
  };

  const handleDeleteBank = async (id: string) => {
    if (!window.confirm('هل أنت تأكد من رغبتك في حذف هذا الحساب البنكي؟')) return;
    try {
      await api.delete(`/setup/bank-accounts/${id}`);
      alert('تم حذف الحساب البنكي بنجاح');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'تعذر حذف الحساب البنكي');
    }
  };

  // Reset forms
  const resetCashForm = () => {
    setEditingId(null);
    setCashForm({
      code: '',
      nameAr: '',
      nameEn: '',
      branchId: branches[0]?.id || '',
      currencyId: currencies[0]?.id || '',
      glAccountId: glAccounts[0]?.id || '',
      responsibleEmployeeId: '',
      openingBalance: 0,
      maximumBalance: 0,
      status: 'Active',
      notes: '',
    });
  };

  const resetBankForm = () => {
    setEditingId(null);
    setBankForm({
      code: '',
      nameAr: '',
      nameEn: '',
      branchId: branches[0]?.id || '',
      currencyId: currencies[0]?.id || '',
      glAccountId: glAccounts[0]?.id || '',
      accountNumber: '',
      iban: '',
      swift: '',
      contactPerson: '',
      phone: '',
      email: '',
      openingBalance: 0,
      status: 'Active',
      notes: '',
    });
  };

  // Edit Cash Box
  const handleEditCash = (cb: CashBox) => {
    setEditingId(cb.id);
    setCashForm({
      code: cb.code,
      nameAr: cb.name_ar,
      nameEn: cb.name_en,
      branchId: cb.branch_id,
      currencyId: cb.currency_id,
      glAccountId: cb.gl_account_id,
      responsibleEmployeeId: cb.responsible_employee_id || '',
      openingBalance: Number(cb.opening_balance) || 0,
      maximumBalance: Number(cb.maximum_balance) || 0,
      status: cb.status,
      notes: cb.notes || '',
    });
    setShowCashModal(true);
  };

  // Edit Bank Account
  const handleEditBank = (ba: BankAccount) => {
    setEditingId(ba.id);
    setBankForm({
      code: ba.code,
      nameAr: ba.name_ar,
      nameEn: ba.name_en,
      branchId: ba.branch_id,
      currencyId: ba.currency_id,
      glAccountId: ba.gl_account_id,
      accountNumber: ba.account_number,
      iban: ba.iban || '',
      swift: ba.swift || '',
      contactPerson: ba.contact_person || '',
      phone: ba.phone || '',
      email: ba.email || '',
      openingBalance: Number(ba.opening_balance) || 0,
      status: ba.status,
      notes: ba.notes || '',
    });
    setShowBankModal(true);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>
            إدارة الصناديق والبنوك
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
            البيانات الأساسية للصناديق المالية والحسابات البنكية المعتمدة بالمنشأة
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            if (activeTab === 'cashBoxes') {
              resetCashForm();
              setShowCashModal(true);
            } else {
              resetBankForm();
              setShowBankModal(true);
            }
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          {activeTab === 'cashBoxes' ? 'إضافة صندوق جديد' : 'إضافة حساب بنكي جديد'}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-outline-variant)' }}>
        <button
          className={`btn ${activeTab === 'cashBoxes' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => { setActiveTab('cashBoxes'); setSearch(''); }}
          style={{ borderRadius: '0.5rem 0.5rem 0 0' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>point_of_sale</span>
          الصناديق المالية (Cash Boxes)
        </button>
        <button
          className={`btn ${activeTab === 'bankAccounts' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => { setActiveTab('bankAccounts'); setSearch(''); }}
          style={{ borderRadius: '0.5rem 0.5rem 0 0' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>account_balance</span>
          الحسابات البنكية (Bank Accounts)
        </button>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '0.75rem 1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span
              className="material-symbols-outlined"
              style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline)' }}
            >
              search
            </span>
            <input
              className="input"
              style={{ paddingRight: '2.5rem' }}
              placeholder={activeTab === 'cashBoxes' ? 'بحث بكود أو اسم الصندوق...' : 'بحث برقم الحساب أو اسم البنك أو IBAN...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Loading & Error Status */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-on-surface-variant)' }}>
          جاري التحميل...
        </div>
      )}

      {error && (
        <div className="card" style={{ background: '#fde8e8', color: '#9b1c1c', padding: '1rem' }}>
          {error}
        </div>
      )}

      {/* CASH BOXES TABLE */}
      {!loading && !error && activeTab === 'cashBoxes' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>كود الصندوق</th>
                <th>اسم الصندوق (عربي)</th>
                <th>الفرع</th>
                <th>العملة</th>
                <th>الحساب المحاسبي</th>
                <th>الموظف المسؤول</th>
                <th style={{ textAlign: 'left' }}>الرصيد الحالي</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {cashBoxes.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
                    لا توجد صناديق مالية معرفة
                  </td>
                </tr>
              ) : (
                cashBoxes.map((cb) => (
                  <tr key={cb.id}>
                    <td>
                      <span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        {cb.code}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{cb.name_ar}</td>
                    <td>{cb.branch_name_ar || '—'}</td>
                    <td><span className="chip chip-info">{cb.currency_code || 'SAR'}</span></td>
                    <td className="numeric">{cb.gl_account_code} - {cb.gl_account_name}</td>
                    <td>{cb.responsible_employee_name || '—'}</td>
                    <td className="numeric" style={{ textAlign: 'left', fontWeight: 700, dir: 'ltr' }}>
                      {Number(cb.current_balance || 0).toLocaleString('ar-SA')} {cb.currency_symbol || 'ر.س'}
                    </td>
                    <td>
                      <span className={`chip ${cb.status === 'Active' ? 'chip-success' : 'chip-neutral'}`}>
                        {cb.status === 'Active' ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleEditCash(cb)} title="تعديل">
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteCash(cb.id)} title="حذف" style={{ color: 'var(--color-error)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* BANK ACCOUNTS TABLE */}
      {!loading && !error && activeTab === 'bankAccounts' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>كود البنك</th>
                <th>اسم البنك</th>
                <th>رقم الحساب</th>
                <th>IBAN</th>
                <th>الفرع</th>
                <th>العملة</th>
                <th>الحساب المحاسبي</th>
                <th style={{ textAlign: 'left' }}>الرصيد الحالي</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {bankAccounts.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '2rem' }}>
                    لا توجد حسابات بنكية معرفة
                  </td>
                </tr>
              ) : (
                bankAccounts.map((ba) => (
                  <tr key={ba.id}>
                    <td>
                      <span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        {ba.code}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{ba.name_ar}</td>
                    <td className="numeric">{ba.account_number}</td>
                    <td className="numeric" style={{ fontSize: '0.75rem' }}>{ba.iban || '—'}</td>
                    <td>{ba.branch_name_ar || '—'}</td>
                    <td><span className="chip chip-info">{ba.currency_code || 'SAR'}</span></td>
                    <td className="numeric">{ba.gl_account_code} - {ba.gl_account_name}</td>
                    <td className="numeric" style={{ textAlign: 'left', fontWeight: 700, dir: 'ltr' }}>
                      {Number(ba.current_balance || 0).toLocaleString('ar-SA')} {ba.currency_symbol || 'ر.س'}
                    </td>
                    <td>
                      <span className={`chip ${ba.status === 'Active' ? 'chip-success' : 'chip-neutral'}`}>
                        {ba.status === 'Active' ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleEditBank(ba)} title="تعديل">
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteBank(ba.id)} title="حذف" style={{ color: 'var(--color-error)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CASH BOX MODAL */}
      {showCashModal && (
        <div className="modal-overlay" onClick={() => setShowCashModal(false)}>
          <div className="modal-box" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              {editingId ? 'تعديل بيانات الصندوق المالي' : 'إضافة صندوق مالي جديد'}
            </h2>
            <form onSubmit={handleCashSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>كود الصندوق (Cash Code) *</label>
                  <input
                    className="input numeric"
                    value={cashForm.code}
                    onChange={(e) => setCashForm({ ...cashForm, code: e.target.value })}
                    required
                    placeholder="مثال: CASH-01"
                  />
                </div>
                <div>
                  <label>الاسم بالعربية *</label>
                  <input
                    className="input"
                    value={cashForm.nameAr}
                    onChange={(e) => setCashForm({ ...cashForm, nameAr: e.target.value })}
                    required
                    placeholder="مثال: الخزينة الرئيسية"
                  />
                </div>
                <div>
                  <label>الاسم بالإنجليزي</label>
                  <input
                    className="input"
                    value={cashForm.nameEn}
                    onChange={(e) => setCashForm({ ...cashForm, nameEn: e.target.value })}
                    placeholder="Main Cash Box"
                  />
                </div>
                <div>
                  <label>الفرع *</label>
                  <select
                    className="input"
                    value={cashForm.branchId}
                    onChange={(e) => setCashForm({ ...cashForm, branchId: e.target.value })}
                    required
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name_ar}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>العملة *</label>
                  <select
                    className="input"
                    value={cashForm.currencyId}
                    onChange={(e) => setCashForm({ ...cashForm, currencyId: e.target.value })}
                    required
                  >
                    {currencies.map((c) => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name_ar}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>الحساب المحاسبي المرتبط (GL Account) *</label>
                  <select
                    className="input"
                    value={cashForm.glAccountId}
                    onChange={(e) => setCashForm({ ...cashForm, glAccountId: e.target.value })}
                    required
                  >
                    {glAccounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.code} - {a.name_ar}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>الموظف المسؤول</label>
                  <select
                    className="input"
                    value={cashForm.responsibleEmployeeId}
                    onChange={(e) => setCashForm({ ...cashForm, responsibleEmployeeId: e.target.value })}
                  >
                    <option value="">-- اختياري --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name_ar}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>الرصيد الافتتاحي</label>
                  <input
                    className="input numeric"
                    type="number"
                    step="0.01"
                    value={cashForm.openingBalance}
                    onChange={(e) => setCashForm({ ...cashForm, openingBalance: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label>الحد الأقصى للرصيد</label>
                  <input
                    className="input numeric"
                    type="number"
                    step="0.01"
                    value={cashForm.maximumBalance}
                    onChange={(e) => setCashForm({ ...cashForm, maximumBalance: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label>الحالة</label>
                  <select
                    className="input"
                    value={cashForm.status}
                    onChange={(e) => setCashForm({ ...cashForm, status: e.target.value as 'Active' | 'Inactive' })}
                  >
                    <option value="Active">نشط</option>
                    <option value="Inactive">غير نشط</option>
                  </select>
                </div>
              </div>

              <div>
                <label>ملاحظات</label>
                <textarea
                  className="input"
                  rows={2}
                  value={cashForm.notes}
                  onChange={(e) => setCashForm({ ...cashForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCashModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ بيانات الصندوق</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BANK ACCOUNT MODAL */}
      {showBankModal && (
        <div className="modal-overlay" onClick={() => setShowBankModal(false)}>
          <div className="modal-box" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              {editingId ? 'تعديل بيانات الحساب البنكي' : 'إضافة حساب بنكي جديد'}
            </h2>
            <form onSubmit={handleBankSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>كود البنك (Bank Code) *</label>
                  <input
                    className="input numeric"
                    value={bankForm.code}
                    onChange={(e) => setBankForm({ ...bankForm, code: e.target.value })}
                    required
                    placeholder="مثال: BANK-01"
                  />
                </div>
                <div>
                  <label>اسم البنك (عربي) *</label>
                  <input
                    className="input"
                    value={bankForm.nameAr}
                    onChange={(e) => setBankForm({ ...bankForm, nameAr: e.target.value })}
                    required
                    placeholder="مثال: مصرف الراجحي"
                  />
                </div>
                <div>
                  <label>اسم البنك (إنجليزي)</label>
                  <input
                    className="input"
                    value={bankForm.nameEn}
                    onChange={(e) => setBankForm({ ...bankForm, nameEn: e.target.value })}
                    placeholder="Al Rajhi Bank"
                  />
                </div>
                <div>
                  <label>رقم الحساب البنكي *</label>
                  <input
                    className="input numeric"
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                    required
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <label>رقم الآيبان (IBAN)</label>
                  <input
                    className="input numeric"
                    value={bankForm.iban}
                    onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })}
                    placeholder="SA0000000000000000000000"
                  />
                </div>
                <div>
                  <label>رمز السويفت (SWIFT Code)</label>
                  <input
                    className="input numeric"
                    value={bankForm.swift}
                    onChange={(e) => setBankForm({ ...bankForm, swift: e.target.value })}
                    placeholder="RJHISASA"
                  />
                </div>
                <div>
                  <label>الفرع *</label>
                  <select
                    className="input"
                    value={bankForm.branchId}
                    onChange={(e) => setBankForm({ ...bankForm, branchId: e.target.value })}
                    required
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name_ar}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>العملة *</label>
                  <select
                    className="input"
                    value={bankForm.currencyId}
                    onChange={(e) => setBankForm({ ...bankForm, currencyId: e.target.value })}
                    required
                  >
                    {currencies.map((c) => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name_ar}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>الحساب المحاسبي (GL Account) *</label>
                  <select
                    className="input"
                    value={bankForm.glAccountId}
                    onChange={(e) => setBankForm({ ...bankForm, glAccountId: e.target.value })}
                    required
                  >
                    {glAccounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.code} - {a.name_ar}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>الشخص المسؤول / الاتصال</label>
                  <input
                    className="input"
                    value={bankForm.contactPerson}
                    onChange={(e) => setBankForm({ ...bankForm, contactPerson: e.target.value })}
                  />
                </div>
                <div>
                  <label>الهاتف</label>
                  <input
                    className="input numeric"
                    value={bankForm.phone}
                    onChange={(e) => setBankForm({ ...bankForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label>البريد الإلكتروني</label>
                  <input
                    className="input"
                    type="email"
                    value={bankForm.email}
                    onChange={(e) => setBankForm({ ...bankForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label>الرصيد الافتتاحي</label>
                  <input
                    className="input numeric"
                    type="number"
                    step="0.01"
                    value={bankForm.openingBalance}
                    onChange={(e) => setBankForm({ ...bankForm, openingBalance: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label>الحالة</label>
                  <select
                    className="input"
                    value={bankForm.status}
                    onChange={(e) => setBankForm({ ...bankForm, status: e.target.value as 'Active' | 'Inactive' })}
                  >
                    <option value="Active">نشط</option>
                    <option value="Inactive">غير نشط</option>
                  </select>
                </div>
              </div>

              <div>
                <label>ملاحظات</label>
                <textarea
                  className="input"
                  rows={2}
                  value={bankForm.notes}
                  onChange={(e) => setBankForm({ ...bankForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowBankModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ الحساب البنكي</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
