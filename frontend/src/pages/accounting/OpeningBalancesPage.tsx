import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

interface Currency {
  id: string;
  code: string;
  name_ar: string;
  symbol: string;
}

interface GLAccount {
  id: string;
  code: string;
  name_ar: string;
  account_type: string;
}

interface PartyOption {
  id: string;
  name: string;
  code?: string;
  account_id?: string;
}

interface OpeningBalance {
  id: string;
  company_id: string;
  party_type: 'Customer' | 'Supplier' | 'Bank' | 'CashBox' | 'Employee' | 'FixedAsset' | 'Inventory' | 'GLAccount';
  party_id: string | null;
  party_name: string | null;
  account_id: string;
  account_code: string;
  account_name: string;
  currency_id: string;
  currency_code: string;
  currency_name: string;
  currency_symbol: string;
  nature: 'Debit' | 'Credit';
  foreign_amount: string | number;
  exchange_rate: string | number;
  base_amount: string | number;
  opening_date: string;
  status: 'Draft' | 'Posted' | 'Void';
  journal_entry_id: string | null;
  notes: string | null;
}

const PARTY_TYPES = [
  { value: 'Customer', label: 'عميل (Customer)' },
  { value: 'Supplier', label: 'مورد (Supplier)' },
  { value: 'Bank', label: 'بنك (Bank)' },
  { value: 'CashBox', label: 'صندوق / خزينة (Cash Box)' },
  { value: 'Employee', label: 'موظف (Employee)' },
  { value: 'FixedAsset', label: 'أصل ثابت (Fixed Asset)' },
  { value: 'Inventory', label: 'مخزون (Inventory)' },
  { value: 'GLAccount', label: 'حساب عام (General Ledger Account)' },
];

export default function OpeningBalancesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<OpeningBalance | null>(null);

  const [form, setForm] = useState({
    partyType: 'Customer' as OpeningBalance['party_type'],
    partyId: '',
    accountId: '',
    currencyId: '',
    nature: 'Debit' as 'Debit' | 'Credit',
    foreignAmount: '',
    exchangeRate: '1.000000',
    openingDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [partyOptions, setPartyOptions] = useState<PartyOption[]>([]);
  const [loadingParties, setLoadingParties] = useState(false);

  // Queries
  const { data: openingBalances = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['opening-balances'],
    queryFn: async () => {
      const r = await api.get('/accounting/opening-balances');
      return (r.data.data || []) as OpeningBalance[];
    },
  });

  const { data: currencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const r = await api.get('/setup/currencies');
      return (r.data.data || []) as Currency[];
    },
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['gl-accounts'],
    queryFn: async () => {
      const r = await api.get('/accounting/accounts');
      return (r.data.data || []) as GLAccount[];
    },
  });

  // Fetch party options when partyType changes
  useEffect(() => {
    if (!showModal) return;
    fetchPartyOptions(form.partyType);
  }, [form.partyType, showModal]);

  const fetchPartyOptions = async (type: OpeningBalance['party_type']) => {
    setLoadingParties(true);
    setPartyOptions([]);
    try {
      if (type === 'Customer') {
        const res = await api.get('/sales/customers');
        setPartyOptions((res.data.data || []).map((c: any) => ({
          id: c.id,
          name: `${c.code} - ${c.name_ar}`,
          account_id: c.ar_account_id,
        })));
      } else if (type === 'Supplier') {
        const res = await api.get('/setup/suppliers');
        setPartyOptions((res.data.data || []).map((s: any) => ({
          id: s.id,
          name: `${s.code} - ${s.name_ar}`,
          account_id: s.ap_account_id,
        })));
      } else if (type === 'Bank') {
        const res = await api.get('/system/bank-accounts');
        setPartyOptions((res.data.data || []).map((b: any) => ({
          id: b.id,
          name: `${b.code} - ${b.name_ar}`,
          account_id: b.gl_account_id,
        })));
      } else if (type === 'CashBox') {
        const res = await api.get('/system/cash-boxes');
        setPartyOptions((res.data.data || []).map((cb: any) => ({
          id: cb.id,
          name: `${cb.code} - ${cb.name_ar}`,
          account_id: cb.gl_account_id,
        })));
      } else if (type === 'Employee') {
        const res = await api.get('/hr/employees');
        setPartyOptions((res.data.data || []).map((e: any) => ({
          id: e.id,
          name: `${e.employee_number} - ${e.name_ar}`,
        })));
      }
    } catch {
      // ignore
    } finally {
      setLoadingParties(false);
    }
  };

  // When partyId changes, auto-select matched accountId
  const handlePartyChange = (pId: string) => {
    const selected = partyOptions.find(p => p.id === pId);
    setForm(prev => ({
      ...prev,
      partyId: pId,
      accountId: selected?.account_id || prev.accountId,
    }));
  };

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (editItem) return api.put(`/accounting/opening-balances/${editItem.id}`, data);
      return api.post('/accounting/opening-balances', data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opening-balances'] });
      setShowModal(false);
      setEditItem(null);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'حدث خطأ أثناء الحفظ');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/accounting/opening-balances/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opening-balances'] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'فشل حذف الرصيد');
    },
  });

  const postMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/accounting/opening-balances/${id}/post`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opening-balances'] });
      alert('تم اعتماد الرصيد الافتتاحي وتوليد القيد المحاسبي بنجاح');
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'فشل اعتماد الرصيد الافتتاحي');
    },
  });

  const openAdd = () => {
    setEditItem(null);
    setForm({
      partyType: 'Customer',
      partyId: '',
      accountId: '',
      currencyId: currencies[0]?.id || '',
      nature: 'Debit',
      foreignAmount: '',
      exchangeRate: '1.000000',
      openingDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowModal(true);
  };

  const openEdit = (ob: OpeningBalance) => {
    setEditItem(ob);
    setForm({
      partyType: ob.party_type,
      partyId: ob.party_id || '',
      accountId: ob.account_id || '',
      currencyId: ob.currency_id,
      nature: ob.nature,
      foreignAmount: String(ob.foreign_amount),
      exchangeRate: String(ob.exchange_rate),
      openingDate: ob.opening_date ? ob.opening_date.substring(0, 10) : new Date().toISOString().split('T')[0],
      notes: ob.notes || '',
    });
    setShowModal(true);
  };

  const filtered = openingBalances.filter(ob => {
    const matchSearch =
      !search ||
      (ob.party_name && ob.party_name.includes(search)) ||
      (ob.account_name && ob.account_name.includes(search)) ||
      (ob.notes && ob.notes.includes(search));
    const matchStatus = !statusFilter || ob.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const calculatedBaseAmount = (
    (parseFloat(form.foreignAmount) || 0) * (parseFloat(form.exchangeRate) || 1)
  ).toFixed(2);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>الأرصدة الافتتاحية (Opening Balances)</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>
            إدخال وتتبع الأرصدة الافتتاحية للأطراف والحسابات بكافة العملات وفق عملة النظام الأساسية
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          إضافة رصيد افتتاحي
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-outline)',
              fontSize: 18,
            }}
          >
            search
          </span>
          <input
            className="input"
            placeholder="بحث بالطرف، الحساب أو الملاحظات..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingRight: '2.5rem' }}
          />
        </div>

        <select
          className="input"
          style={{ width: 160 }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">جميع الحالات</option>
          <option value="Draft">مسودة</option>
          <option value="Posted">معتمد</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" />
          </div>
        ) : isError ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-error)' }}>
            حدث خطأ أثناء تحميل الأرصدة الافتتاحية
            <div style={{ marginTop: '1rem' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => refetch()}>
                إعادة المحاولة
              </button>
            </div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>نوع الطرف</th>
                <th>اسم الطرف</th>
                <th>الحساب المحاسبي</th>
                <th>العملة</th>
                <th style={{ textAlign: 'left' }}>المبلغ (أجنبي)</th>
                <th style={{ textAlign: 'center' }}>سعر الصرف</th>
                <th style={{ textAlign: 'left' }}>المبلغ بعملة الأساس</th>
                <th>الطبيعة</th>
                <th>التاريخ</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-on-surface-variant)' }}>
                    لا توجد أرصدة افتتاحية مضافة
                  </td>
                </tr>
              ) : (
                filtered.map(ob => (
                  <tr key={ob.id}>
                    <td>
                      <span className="chip" style={{ background: 'var(--color-surface-variant)', fontWeight: 600 }}>
                        {ob.party_type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{ob.party_name || '—'}</td>
                    <td>
                      {ob.account_code ? `${ob.account_code} - ${ob.account_name}` : '—'}
                    </td>
                    <td>
                      <span className="chip" style={{ background: 'rgba(5, 150, 105, 0.1)', color: '#059669', fontWeight: 700 }}>
                        {ob.currency_code}
                      </span>
                    </td>
                    <td className="numeric" style={{ textAlign: 'left', fontWeight: 700 }}>
                      {Number(ob.foreign_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {ob.currency_symbol}
                    </td>
                    <td className="numeric" style={{ textAlign: 'center' }}>
                      {Number(ob.exchange_rate).toFixed(4)}
                    </td>
                    <td className="numeric" style={{ textAlign: 'left', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {Number(ob.base_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={`chip ${ob.nature === 'Debit' ? 'chip-neutral' : 'chip-success'}`}>
                        {ob.nature === 'Debit' ? 'مدين' : 'دائن'}
                      </span>
                    </td>
                    <td>{ob.opening_date ? ob.opening_date.substring(0, 10) : '—'}</td>
                    <td>
                      <span className={`chip ${ob.status === 'Posted' ? 'chip-success' : 'chip-neutral'}`}>
                        {ob.status === 'Posted' ? 'معتمد' : 'مسودة'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {ob.status === 'Draft' && (
                          <>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => postMutation.mutate(ob.id)}
                              disabled={postMutation.isPending}
                              title="اعتماد وتوليد القيد"
                              style={{ color: '#059669' }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(ob)} title="تعديل">
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                if (confirm('هل أنت متأكد من حذف هذا الرصيد الافتتاحي؟')) {
                                  deleteMutation.mutate(ob.id);
                                }
                              }}
                              title="حذف"
                              style={{ color: '#b91c1c' }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                            </button>
                          </>
                        )}
                        {ob.status === 'Posted' && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>مرحل</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              {editItem ? 'تعديل رصيد افتتاحي' : 'إضافة رصيد افتتاحي جديد'}
            </h2>

            <form
              onSubmit={e => {
                e.preventDefault();
                saveMutation.mutate(form);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>نوع الطرف *</label>
                  <select
                    className="input"
                    value={form.partyType}
                    onChange={e => setForm({ ...form, partyType: e.target.value as any, partyId: '' })}
                  >
                    {PARTY_TYPES.map(pt => (
                      <option key={pt.value} value={pt.value}>
                        {pt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {form.partyType !== 'GLAccount' && (
                  <div>
                    <label>الطرف المالي *</label>
                    <select
                      className="input"
                      value={form.partyId}
                      onChange={e => handlePartyChange(e.target.value)}
                      disabled={loadingParties}
                    >
                      <option value="">-- اختر الطرف --</option>
                      {partyOptions.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label>الحساب المحاسبي (GL Account) *</label>
                  <select
                    className="input"
                    value={form.accountId}
                    onChange={e => setForm({ ...form, accountId: e.target.value })}
                    required
                  >
                    <option value="">-- اختر الحساب --</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.code} - {a.name_ar}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>العملة *</label>
                  <select
                    className="input"
                    value={form.currencyId}
                    onChange={e => setForm({ ...form, currencyId: e.target.value })}
                    required
                  >
                    <option value="">-- اختر العملة --</option>
                    {currencies.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.name_ar} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>طبيعة الرصيد *</label>
                  <select
                    className="input"
                    value={form.nature}
                    onChange={e => setForm({ ...form, nature: e.target.value as 'Debit' | 'Credit' })}
                  >
                    <option value="Debit">مدين (Debit)</option>
                    <option value="Credit">دائن (Credit)</option>
                  </select>
                </div>

                <div>
                  <label>المبلغ (بالعملة المختارة) *</label>
                  <input
                    className="input numeric"
                    type="number"
                    step="0.01"
                    value={form.foreignAmount}
                    onChange={e => setForm({ ...form, foreignAmount: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label>سعر الصرف (مقابل عملة الأساس) *</label>
                  <input
                    className="input numeric"
                    type="number"
                    step="0.000001"
                    value={form.exchangeRate}
                    onChange={e => setForm({ ...form, exchangeRate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label>القيمة المحولة بعملة النظام الأساسية</label>
                  <input
                    className="input numeric"
                    value={calculatedBaseAmount}
                    disabled
                    style={{ background: 'var(--color-surface-variant)', fontWeight: 700, color: 'var(--color-primary)' }}
                  />
                </div>

                <div>
                  <label>تاريخ الرصيد الافتتاحي *</label>
                  <input
                    className="input"
                    type="date"
                    value={form.openingDate}
                    onChange={e => setForm({ ...form, openingDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label>ملاحظات / البيان</label>
                <textarea
                  className="input"
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="بيان الرصيد الافتتاحي..."
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ الرصيد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
