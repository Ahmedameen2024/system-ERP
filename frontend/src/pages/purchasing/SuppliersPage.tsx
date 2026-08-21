import { useState, useEffect } from 'react';
import api from '../../api/client';

interface Currency {
  id: string;
  code: string;
  name_ar: string;
  symbol: string;
}

interface SupplierCurrency {
  currency_id: string;
  currency_code: string;
  currency_name: string;
  symbol?: string;
  balance: number | string;
  opening_balance: number | string;
  credit_limit: number | string | null;
  is_default: boolean;
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
  currencies?: SupplierCurrency[];
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
  currencyIds: string[];
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
  currencyIds: [],
  paymentTerms: '30',
  status: 'Active',
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [_error, setError] = useState<string | null>(null);
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

  const validate = (): boolean => {
    const errors: Partial<Record<keyof SupplierForm, string>> = {};
    if (!form.nameAr.trim()) errors.nameAr = 'الاسم العربي مطلوب';
    if (form.currencyIds.length === 0) errors.currencyId = 'يجب اختيار عملة واحدة على الأقل للمورد';
    if (form.creditLimit !== '' && form.creditLimit !== null) {
      const val = parseFloat(form.creditLimit);
      if (isNaN(val) || val < 0) errors.creditLimit = 'الحد الائتماني يجب أن يكون رقماً موجباً أو صفراً';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openAdd = () => {
    setEditItem(null);
    const defCurIds = currencies.length > 0 ? [currencies[0].id] : [];
    setForm({ ...emptyForm, currencyIds: defCurIds, currencyId: defCurIds[0] || '' });
    setValidationErrors({});
    setShowModal(true);
  };

  const openEdit = (s: Supplier) => {
    setEditItem(s);
    const assignedCurIds = (s.currencies && s.currencies.length > 0)
      ? s.currencies.map(c => c.currency_id)
      : (s.currency_id ? [s.currency_id] : (currencies.length > 0 ? [currencies[0].id] : []));

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
      currencyId: assignedCurIds[0] || '',
      currencyIds: assignedCurIds,
      paymentTerms: String(s.payment_terms || 30),
      status: s.status,
    });
    setValidationErrors({});
    setShowModal(true);
  };

  const toggleCurrency = (curId: string) => {
    setForm(prev => {
      const exists = prev.currencyIds.includes(curId);
      if (exists) {
        if (prev.currencyIds.length === 1) return prev;
        const updated = prev.currencyIds.filter(id => id !== curId);
        return { ...prev, currencyIds: updated, currencyId: updated[0] || '' };
      } else {
        const updated = [...prev.currencyIds, curId];
        return { ...prev, currencyIds: updated, currencyId: updated[0] };
      }
    });
    setValidationErrors(v => ({ ...v, currencyId: undefined }));
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
        currencyId: form.currencyIds[0] || form.currencyId || null,
        currencyIds: form.currencyIds,
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
      alert(err.response?.data?.message || 'خطأ في حفظ المورد');
    } finally {
      setSaving(false);
    }
  };

  const filtered = suppliers.filter(s =>
    s.name_ar.includes(search) ||
    (s.code && s.code.toLowerCase().includes(search.toLowerCase())) ||
    (s.phone && s.phone.includes(search))
  );

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>دليل الموردين</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>
            إدارة الموردين والعملات المسموح بها والأرصدة المستقلة
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
          إضافة مورد جديد
        </button>
      </div>

      <div style={{ position: 'relative', maxWidth: 400 }}>
        <span className="material-symbols-outlined" style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline)', fontSize: 18 }}>search</span>
        <input className="input" placeholder="بحث بالكود، الاسم أو الهاتف..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingRight: '2.5rem' }} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>كود المورد</th>
                <th>الاسم</th>
                <th>الشخص المسؤول</th>
                <th>الهاتف</th>
                <th>العملات المسموحة</th>
                <th>أيام السداد</th>
                <th style={{ textAlign: 'left' }}>الحد الائتماني</th>
                <th style={{ textAlign: 'left' }}>الأرصدة المستقلة بالعملات</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-on-surface-variant)' }}>لا يوجد موردون مسجلون</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id}>
                  <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{s.code}</span></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.name_ar}</div>
                    {s.name_en && <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>{s.name_en}</div>}
                  </td>
                  <td>{s.contact_person || '—'}</td>
                  <td className="numeric">{s.phone || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {s.currencies && s.currencies.length > 0 ? (
                        s.currencies.map(cur => (
                          <span key={cur.currency_id} className="chip chip-primary" style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem' }}>
                            {cur.currency_code}
                          </span>
                        ))
                      ) : (
                        <span className="chip chip-neutral" style={{ fontSize: '0.7rem' }}>SAR</span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>{s.payment_terms} يوم</td>
                  <td className="numeric" style={{ textAlign: 'left' }}>
                    {s.credit_limit !== null ? Number(s.credit_limit).toLocaleString('en-US', { minimumFractionDigits: 2 }) : 'غير محدد'}
                  </td>
                  <td style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      {s.currencies && s.currencies.length > 0 ? (
                        s.currencies.map(cur => {
                          const balNum = Number(cur.balance) || 0;
                          return (
                            <div key={cur.currency_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.8rem' }}>
                              <span style={{ fontWeight: 700, color: 'var(--color-text-muted)' }}>{cur.currency_code}:</span>
                              <span className="numeric" style={{ fontWeight: 700, color: balNum > 0 ? '#ca8a04' : balNum < 0 ? '#16a34a' : 'inherit' }}>
                                {balNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <span className="numeric" style={{ fontWeight: 700, color: Number(s.balance) > 0 ? '#ca8a04' : 'inherit' }}>
                          {Number(s.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  </td>
                  <td><span className={`chip ${s.status === 'Active' ? 'chip-success' : 'chip-neutral'}`}>{s.status === 'Active' ? 'نشط' : 'متوقف'}</span></td>
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
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--color-border)' }}>
                  البيانات الأساسية
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <label>الاسم العربي للمورد <span style={{ color: 'var(--color-error)' }}>*</span></label>
                    <input className={`input${validationErrors.nameAr ? ' input-error' : ''}`} value={form.nameAr} onChange={e => { setForm({ ...form, nameAr: e.target.value }); setValidationErrors(v => ({ ...v, nameAr: undefined })); }} />
                    {validationErrors.nameAr && <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{validationErrors.nameAr}</span>}
                  </div>
                  <div>
                    <label>الاسم الإنجليزي</label>
                    <input className="input" value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} />
                  </div>
                  <div>
                    <label>الشخص المسؤول</label>
                    <input className="input" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} />
                  </div>
                  <div>
                    <label>رقم الهاتف</label>
                    <input className="input numeric" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div>
                    <label>البريد الإلكتروني</label>
                    <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div>
                    <label>المدينة</label>
                    <input className="input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div>
                    <label>الرقم الضريبي (VAT)</label>
                    <input className="input numeric" value={form.taxNumber} onChange={e => setForm({ ...form, taxNumber: e.target.value })} />
                  </div>
                  <div>
                    <label>السجل التجاري</label>
                    <input className="input numeric" value={form.crNumber} onChange={e => setForm({ ...form, crNumber: e.target.value })} />
                  </div>
                </div>
              </div>

              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--color-border)' }}>
                  البيانات المالية والعملات المسموحة
                </p>

                <div style={{ marginBottom: '1rem', padding: '0.85rem', background: 'var(--color-surface-variant)', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}>
                  <label style={{ fontWeight: 700, marginBottom: '0.35rem', display: 'block' }}>
                    العملات التي يتعامل بها المورد (تعدد العملات) <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 0.6rem' }}>
                    حدد جميع العملات المسموح بها في فواتير وسندات هذا المورد. لكل عملة رصيد مستقل تماماً.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem' }}>
                    {currencies.map(cur => {
                      const isSelected = form.currencyIds.includes(cur.id);
                      return (
                        <button
                          key={cur.id}
                          type="button"
                          onClick={() => toggleCurrency(cur.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '0.5rem',
                            border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                            background: isSelected ? 'var(--color-primary-container)' : 'var(--color-surface)',
                            color: isSelected ? 'var(--color-primary)' : 'var(--color-text)',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <span>{cur.code} - {cur.name_ar}</span>
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                            {isSelected ? 'check_box' : 'check_box_outline_blank'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {validationErrors.currencyId && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-error)', display: 'block', marginTop: '0.4rem' }}>
                      {validationErrors.currencyId}
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <label>الحد الائتماني (اختياري)</label>
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
                  </div>

                  <div>
                    <label>شروط الدفع (أيام)</label>
                    <input
                      className="input numeric"
                      type="number"
                      min="0"
                      value={form.paymentTerms}
                      onChange={e => setForm({ ...form, paymentTerms: e.target.value })}
                    />
                  </div>
                </div>
              </div>

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
