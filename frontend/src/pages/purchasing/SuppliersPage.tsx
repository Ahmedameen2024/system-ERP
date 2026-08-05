import { useState, useEffect } from 'react';
import api from '../../api/client';

interface Currency {
  id: string;
  code: string;
  name_ar: string;
  symbol: string;
}

interface Supplier {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  contact_person: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  tax_number: string;
  cr_number: string;
  credit_limit: number | null;
  opening_balance: number;
  balance: number;
  currency_id: string;
  currency_code: string;
  currency_name: string;
  ap_account_id: string | null;
  payment_terms: number;
  status: 'Active' | 'Inactive';
}

interface SupplierForm {
  nameAr: string;
  nameEn: string;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  taxNumber: string;
  crNumber: string;
  creditLimit: string;
  openingBalance: string;
  currencyId: string;
  paymentTerms: string;
  status: 'Active' | 'Inactive';
}

const emptyForm: SupplierForm = {
  nameAr: '',
  nameEn: '',
  contactPerson: '',
  phone: '',
  email: '',
  city: '',
  address: '',
  taxNumber: '',
  crNumber: '',
  creditLimit: '',
  openingBalance: '',
  currencyId: '',
  paymentTerms: '30',
  status: 'Active',
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof SupplierForm, string>>>({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [suppRes, curRes] = await Promise.all([
        api.get('/setup/suppliers'),
        api.get('/setup/currencies'),
      ]);
      setSuppliers(suppRes.data.data || []);
      setCurrencies((curRes.data.data || []).filter((c: Currency & { status: string }) => c.status === 'Active' || !('status' in c)));
    } catch {
      setError('تعذّر تحميل البيانات، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedCurrency = () =>
    currencies.find(c => c.id === form.currencyId) || null;

  const validate = (): boolean => {
    const errors: Partial<Record<keyof SupplierForm, string>> = {};
    if (!form.nameAr.trim()) errors.nameAr = 'الاسم العربي مطلوب';
    if (!form.currencyId) errors.currencyId = 'يجب اختيار العملة';
    if (form.creditLimit !== '' && form.creditLimit !== null) {
      const val = parseFloat(form.creditLimit);
      if (isNaN(val) || val < 0) errors.creditLimit = 'الحد الائتماني يجب أن يكون رقماً موجباً أو صفراً';
    }
    if (form.openingBalance !== '' && isNaN(parseFloat(form.openingBalance))) {
      errors.openingBalance = 'الرصيد الافتتاحي يجب أن يكون رقماً';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm);
    setValidationErrors({});
    setShowModal(true);
  };

  const openEdit = (s: Supplier) => {
    setEditItem(s);
    setForm({
      nameAr: s.name_ar,
      nameEn: s.name_en || '',
      contactPerson: s.contact_person || '',
      phone: s.phone || '',
      email: s.email || '',
      city: s.city || '',
      address: s.address || '',
      taxNumber: s.tax_number || '',
      crNumber: s.cr_number || '',
      creditLimit: s.credit_limit !== null && s.credit_limit !== undefined ? String(s.credit_limit) : '',
      openingBalance: String(s.opening_balance || 0),
      currencyId: s.currency_id || '',
      paymentTerms: String(s.payment_terms || 30),
      status: s.status,
    });
    setValidationErrors({});
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        nameAr: form.nameAr,
        nameEn: form.nameEn || null,
        contactPerson: form.contactPerson || null,
        phone: form.phone || null,
        email: form.email || null,
        city: form.city || null,
        address: form.address || null,
        taxNumber: form.taxNumber || null,
        crNumber: form.crNumber || null,
        creditLimit: form.creditLimit !== '' ? parseFloat(form.creditLimit) : null,
        openingBalance: form.openingBalance !== '' ? parseFloat(form.openingBalance) : 0,
        currencyId: form.currencyId,
        paymentTerms: parseInt(form.paymentTerms) || 30,
        status: form.status,
      };

      if (editItem) {
        await api.put(`/setup/suppliers/${editItem.id}`, payload);
      } else {
        await api.post('/setup/suppliers', payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'حدث خطأ أثناء الحفظ';
      setValidationErrors({ nameAr: msg });
    } finally {
      setSaving(false);
    }
  };

  const filtered = suppliers.filter(s =>
    !search ||
    s.name_ar.includes(search) ||
    s.name_en?.toLowerCase().includes(search.toLowerCase()) ||
    s.code.includes(search) ||
    s.phone?.includes(search)
  );

  const selectedCurrency = getSelectedCurrency();

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>دليل الموردين</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>
            إدارة بيانات الموردين والشروط الائتمانية
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            className="input"
            placeholder="بحث باسم المورد أو الكود..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '220px' }}
          />
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            إضافة مورد جديد
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="card" style={{ padding: '0.875rem 1rem', background: 'rgba(var(--color-error-rgb),0.08)', border: '1px solid var(--color-error)', borderRadius: 8, color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
          {error}
          <button className="btn btn-ghost btn-sm" onClick={fetchData} style={{ marginRight: 'auto' }}>إعادة المحاولة</button>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>hourglass_empty</span>
            جارٍ التحميل...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>inventory_2</span>
            {search ? 'لا توجد نتائج مطابقة للبحث' : 'لا يوجد موردون مضافون بعد'}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>كود المورد</th>
                <th>الاسم العربي</th>
                <th>الشخص المسؤول</th>
                <th>المدينة</th>
                <th>الهاتف</th>
                <th>العملة</th>
                <th style={{ textAlign: 'left' }}>الحد الائتماني</th>
                <th style={{ textAlign: 'left' }}>المستحقات</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{s.code}</span></td>
                  <td style={{ fontWeight: 500 }}>{s.name_ar}</td>
                  <td>{s.contact_person || '—'}</td>
                  <td>{s.city || '—'}</td>
                  <td className="numeric">{s.phone || '—'}</td>
                  <td>
                    {s.currency_code ? (
                      <span style={{
                        background: 'var(--color-primary-subtle)',
                        color: 'var(--color-primary)',
                        borderRadius: 4,
                        padding: '2px 8px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        letterSpacing: '0.03em'
                      }}>
                        {s.currency_code}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="numeric" style={{ textAlign: 'left' }}>
                    {s.credit_limit === null || s.credit_limit === undefined
                      ? <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.82rem' }}>غير محدود</span>
                      : `${Number(s.credit_limit).toLocaleString('en')} ${s.currency_code || ''}`
                    }
                  </td>
                  <td className="numeric" style={{
                    textAlign: 'left',
                    fontWeight: 700,
                    color: Number(s.balance) > 0 ? 'var(--color-error)' : 'inherit'
                  }}>
                    {Number(s.balance).toLocaleString('en')} {s.currency_code || ''}
                  </td>
                  <td>
                    <span className={`chip ${s.status === 'Active' ? 'chip-success' : 'chip-neutral'}`}>
                      {s.status === 'Active' ? 'نشط' : 'متوقف'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)} title="تعديل">
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: 700, width: '95%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, verticalAlign: 'middle', marginLeft: 8, color: 'var(--color-primary)' }}>
                  {editItem ? 'edit' : 'person_add'}
                </span>
                {editItem ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => !saving && setShowModal(false)}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>

            <form onSubmit={handleSave} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Section: Basic Info */}
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--color-border)' }}>
                  البيانات الأساسية
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <label>الاسم العربي للمورد <span style={{ color: 'var(--color-error)' }}>*</span></label>
                    <input
                      id="supplier-name-ar"
                      className={`input${validationErrors.nameAr ? ' input-error' : ''}`}
                      value={form.nameAr}
                      onChange={e => { setForm({ ...form, nameAr: e.target.value }); setValidationErrors(v => ({ ...v, nameAr: undefined })); }}
                      placeholder="مثال: شركة البيان للتجارة"
                    />
                    {validationErrors.nameAr && <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{validationErrors.nameAr}</span>}
                  </div>
                  <div>
                    <label>الاسم الإنجليزي</label>
                    <input
                      className="input"
                      value={form.nameEn}
                      onChange={e => setForm({ ...form, nameEn: e.target.value })}
                      placeholder="Al-Bayan Trading Co."
                    />
                  </div>
                  <div>
                    <label>الشخص المسؤول</label>
                    <input
                      className="input"
                      value={form.contactPerson}
                      onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                      placeholder="اسم الشخص"
                    />
                  </div>
                  <div>
                    <label>رقم الهاتف</label>
                    <input
                      className="input numeric"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="05XXXXXXXX"
                    />
                  </div>
                  <div>
                    <label>البريد الإلكتروني</label>
                    <input
                      className="input"
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="supplier@example.com"
                    />
                  </div>
                  <div>
                    <label>المدينة</label>
                    <input
                      className="input"
                      value={form.city}
                      onChange={e => setForm({ ...form, city: e.target.value })}
                      placeholder="الرياض"
                    />
                  </div>
                  <div>
                    <label>الرقم الضريبي (VAT)</label>
                    <input
                      className="input numeric"
                      value={form.taxNumber}
                      onChange={e => setForm({ ...form, taxNumber: e.target.value })}
                      placeholder="300XXXXXXXXXX003"
                    />
                  </div>
                  <div>
                    <label>السجل التجاري</label>
                    <input
                      className="input numeric"
                      value={form.crNumber}
                      onChange={e => setForm({ ...form, crNumber: e.target.value })}
                      placeholder="رقم السجل التجاري"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Financial */}
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--color-border)' }}>
                  البيانات المالية
                </p>

                {/* Currency + Opening Balance - side by side, currency first */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  {/* Currency */}
                  <div>
                    <label>
                      العملة <span style={{ color: 'var(--color-error)' }}>*</span>
                    </label>
                    <select
                      id="supplier-currency"
                      className={`input${validationErrors.currencyId ? ' input-error' : ''}`}
                      value={form.currencyId}
                      onChange={e => { setForm({ ...form, currencyId: e.target.value }); setValidationErrors(v => ({ ...v, currencyId: undefined })); }}
                    >
                      <option value="">-- اختر العملة --</option>
                      {currencies.map(c => (
                        <option key={c.id} value={c.id}>{c.code} — {c.name_ar}</option>
                      ))}
                    </select>
                    {validationErrors.currencyId && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{validationErrors.currencyId}</span>
                    )}
                  </div>

                  {/* Opening Balance */}
                  <div>
                    <label>
                      الرصيد الافتتاحي المستحق
                      {selectedCurrency && (
                        <span style={{
                          marginRight: 6,
                          background: 'var(--color-primary-subtle)',
                          color: 'var(--color-primary)',
                          borderRadius: 4,
                          padding: '1px 7px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          {selectedCurrency.code}
                        </span>
                      )}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="input numeric"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.openingBalance}
                        onChange={e => setForm({ ...form, openingBalance: e.target.value })}
                        disabled={!!editItem}
                        placeholder="0.00"
                        style={editItem ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                      />
                      {selectedCurrency && (
                        <span style={{
                          position: 'absolute',
                          left: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '0.75rem',
                          color: 'var(--color-text-muted)',
                          pointerEvents: 'none'
                        }}>
                          {selectedCurrency.code}
                        </span>
                      )}
                    </div>
                    {editItem && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        لا يمكن تعديل الرصيد الافتتاحي بعد الإنشاء
                      </span>
                    )}
                  </div>

                  {/* Credit Limit */}
                  <div>
                    <label>
                      الحد الائتماني
                      <span style={{
                        marginRight: 6,
                        fontSize: '0.72rem',
                        color: 'var(--color-text-muted)',
                        fontWeight: 400
                      }}>
                        (اختياري — فارغ = غير محدود)
                      </span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="supplier-credit-limit"
                        className={`input numeric${validationErrors.creditLimit ? ' input-error' : ''}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.creditLimit}
                        onChange={e => { setForm({ ...form, creditLimit: e.target.value }); setValidationErrors(v => ({ ...v, creditLimit: undefined })); }}
                        placeholder="اتركه فارغاً إذا لم يكن هناك حد"
                      />
                      {selectedCurrency && form.creditLimit !== '' && (
                        <span style={{
                          position: 'absolute',
                          left: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '0.75rem',
                          color: 'var(--color-text-muted)',
                          pointerEvents: 'none'
                        }}>
                          {selectedCurrency.code}
                        </span>
                      )}
                    </div>
                    {validationErrors.creditLimit && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{validationErrors.creditLimit}</span>
                    )}
                    {!validationErrors.creditLimit && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        {form.creditLimit === ''
                          ? '🔓 غير محدود (NULL)'
                          : form.creditLimit === '0'
                          ? '🔒 الحد = صفر (لا يُسمح بالائتمان)'
                          : `🔐 الحد: ${parseFloat(form.creditLimit || '0').toLocaleString('en')} ${selectedCurrency?.code || ''}`
                        }
                      </span>
                    )}
                  </div>

                  {/* Payment Terms */}
                  <div>
                    <label>شروط الدفع (أيام)</label>
                    <input
                      className="input numeric"
                      type="number"
                      min="0"
                      value={form.paymentTerms}
                      onChange={e => setForm({ ...form, paymentTerms: e.target.value })}
                      placeholder="30"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label>الحالة</label>
                    <select
                      className="input"
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value as 'Active' | 'Inactive' })}
                    >
                      <option value="Active">نشط</option>
                      <option value="Inactive">متوقف</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)} disabled={saving}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>progress_activity</span>
                      جارٍ الحفظ...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
                      {editItem ? 'حفظ التعديلات' : 'إضافة المورد'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
