import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

interface Account {
  id: string;
  code: string;
  name_ar: string;
}

interface CostCenter {
  id: string;
  code: string;
  name_ar: string;
}

interface CashBox {
  id: string;
  code: string;
  name_ar: string;
  gl_account_id: string;
}

interface BankAccount {
  id: string;
  code: string;
  name_ar: string;
  account_number: string;
  gl_account_id: string;
}

interface Customer {
  id: string;
  code: string;
  name_ar: string;
  ar_account_id?: string;
}

interface Supplier {
  id: string;
  code: string;
  name_ar: string;
  ap_account_id?: string;
}

interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  reference_no: string;
  reference_type: string;
  status: string;
  total_debit: string;
  total_credit: string;
}

interface JournalLine {
  id: string;
  glAccountId: string;
  costCenterId: string;
  cashBoxId?: string;
  bankAccountId?: string;
  customerId?: string;
  supplierId?: string;
  description: string;
  debit: string;
  credit: string;
}

const EMPTY_LINE: JournalLine = {
  id: `line-${Date.now()}`,
  glAccountId: '',
  costCenterId: '',
  cashBoxId: '',
  bankAccountId: '',
  customerId: '',
  supplierId: '',
  description: '',
  debit: '',
  credit: '',
};

const formatCurrency = (value: number) =>
  value.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function JournalEntries() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [form, setForm] = useState({
    entryDate: new Date().toISOString().slice(0, 10),
    referenceNo: '',
    referenceType: 'Manual',
    currencyId: '',
    exchangeRate: '1',
    description: '',
    lines: [EMPTY_LINE],
  });

  const { data: entries = [], isLoading: entriesLoading, isError: entriesError, error: entriesErrorObj } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: async () => {
      const res = await api.get('/accounting/journal-entries');
      return res.data.data as JournalEntry[];
    },
    initialData: [],
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await api.get('/accounting/accounts');
      return res.data.data as Account[];
    },
    initialData: [],
  });

  const { data: costCenters = [] } = useQuery({
    queryKey: ['cost-centers'],
    queryFn: async () => {
      const res = await api.get('/accounting/cost-centers');
      return res.data.data as CostCenter[];
    },
    initialData: [],
  });

  const { data: cashBoxes = [] } = useQuery({
    queryKey: ['cash-boxes-lookup'],
    queryFn: async () => {
      const res = await api.get('/setup/cash-boxes');
      return (res.data.data?.items || res.data.data || []) as CashBox[];
    },
    initialData: [],
  });

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ['bank-accounts-lookup'],
    queryFn: async () => {
      const res = await api.get('/setup/bank-accounts');
      return (res.data.data?.items || res.data.data || []) as BankAccount[];
    },
    initialData: [],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-lookup'],
    queryFn: async () => {
      const res = await api.get('/sales/customers');
      return (res.data.data?.items || res.data.data || []) as Customer[];
    },
    initialData: [],
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers-lookup'],
    queryFn: async () => {
      const res = await api.get('/setup/suppliers').catch(() => api.get('/purchasing/suppliers'));
      return (res.data.data?.items || res.data.data || []) as Supplier[];
    },
    initialData: [],
  });

  const filteredEntries = useMemo(
    () =>
      entries.filter((entry) => {
        const matchSearch =
          entry.entry_number.includes(search) ||
          entry.description?.includes(search) ||
          entry.reference_no?.includes(search);
        const matchStatus = statusFilter ? entry.status === statusFilter : true;
        return matchSearch && matchStatus;
      }),
    [entries, search, statusFilter]
  );

  const totalDebit = useMemo(
    () =>
      form.lines.reduce((sum, line) => sum + Number(line.debit || 0), 0),
    [form.lines]
  );
  const totalCredit = useMemo(
    () =>
      form.lines.reduce((sum, line) => sum + Number(line.credit || 0), 0),
    [form.lines]
  );
  const balanceDiff = totalDebit - totalCredit;
  const isBalanced = Math.abs(balanceDiff) < 0.01;

  type CreateJournalEntryPayload = {
    entryDate: string;
    referenceNo: string;
    referenceType: string;
    currencyId: string;
    exchangeRate: string;
    description: string;
    lines: {
      glAccountId: string;
      costCenterId: string | null;
      cashBoxId?: string | null;
      bankAccountId?: string | null;
      customerId?: string | null;
      supplierId?: string | null;
      description: string;
      debit: number;
      credit: number;
    }[];
  };

  const createMutation = useMutation<JournalEntry, any, CreateJournalEntryPayload>({
    mutationFn: async (payload) => {
      const res = await api.post('/accounting/journal-entries', payload);
      return res.data.data as JournalEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      setShowNew(false);
      setErrorMessage('');
      setForm({
        entryDate: new Date().toISOString().slice(0, 10),
        referenceNo: '',
        referenceType: 'Manual',
        currencyId: '',
        exchangeRate: '1',
        description: '',
        lines: [{ ...EMPTY_LINE, id: `line-${Date.now()}` }],
      });
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.message || 'حدث خطأ أثناء حفظ القيد');
    },
  });

  const updateLine = (index: number, field: keyof JournalLine, value: string) => {
    setForm((current) => {
      const newLines = current.lines.map((line, idx) => {
        if (idx !== index) return line;

        const updated = { ...line, [field]: value };

        // Auto-suggest GL Account when Cash Box selected
        if (field === 'cashBoxId' && value) {
          const cb = cashBoxes.find((item) => item.id === value);
          if (cb && cb.gl_account_id) {
            updated.glAccountId = cb.gl_account_id;
          }
          updated.bankAccountId = '';
        }

        // Auto-suggest GL Account when Bank Account selected
        if (field === 'bankAccountId' && value) {
          const ba = bankAccounts.find((item) => item.id === value);
          if (ba && ba.gl_account_id) {
            updated.glAccountId = ba.gl_account_id;
          }
          updated.cashBoxId = '';
        }

        // Auto-suggest AR account for Customer
        if (field === 'customerId' && value) {
          const cust = customers.find((item) => item.id === value);
          if (cust && cust.ar_account_id) {
            updated.glAccountId = cust.ar_account_id;
          }
          updated.supplierId = '';
        }

        // Auto-suggest AP account for Supplier
        if (field === 'supplierId' && value) {
          const supp = suppliers.find((item) => item.id === value);
          if (supp && supp.ap_account_id) {
            updated.glAccountId = supp.ap_account_id;
          }
          updated.customerId = '';
        }

        return updated;
      });

      return { ...current, lines: newLines };
    });
    setErrorMessage('');
  };

  const addLine = () => {
    setForm((current) => ({
      ...current,
      lines: [...current.lines, { ...EMPTY_LINE, id: `line-${Date.now()}` }],
    }));
  };

  const removeLine = (index: number) => {
    setForm((current) => ({
      ...current,
      lines: current.lines.filter((_, idx) => idx !== index),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.entryDate || form.lines.length === 0) {
      setErrorMessage('الرجاء تعبئة تاريخ القيد وإضافة سطر واحد على الأقل');
      return;
    }
    if (!isBalanced) {
      setErrorMessage('القيد غير متوازن: إجمالي المدين يجب أن يساوي إجمالي الدائن');
      return;
    }
    const payload: CreateJournalEntryPayload = {
      entryDate: form.entryDate,
      referenceNo: form.referenceNo,
      referenceType: form.referenceType,
      currencyId: form.currencyId,
      exchangeRate: form.exchangeRate,
      description: form.description,
      lines: form.lines.map((line) => ({
        glAccountId: line.glAccountId,
        costCenterId: line.costCenterId || null,
        cashBoxId: line.cashBoxId || null,
        bankAccountId: line.bankAccountId || null,
        customerId: line.customerId || null,
        supplierId: line.supplierId || null,
        description: line.description,
        debit: Number(line.debit) || 0,
        credit: Number(line.credit) || 0,
      })),
    };

    createMutation.mutate(payload);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, margin: 0 }}>قيود اليومية المحاسبية</h1>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--color-on-surface-variant)' }}>
            شاشة إنشاء وعرض القيود اليومية مع دعم ربط الصناديق والبنوك والعملاء والموردين ومراكز التكلفة
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/accounting/transaction-analysis')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
            تحليل المعاملات
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowNew((prev) => !prev)}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            قيد جديد
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem' }}>
        <div>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>أحدث القيود</h2>
                <p style={{ margin: '0.35rem 0 0', color: 'var(--color-on-surface-variant)', fontSize: '0.875rem' }}>
                  عرض أحدث القيود مع إمكانية البحث والتصفية.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline)', fontSize: 18 }}>search</span>
                <input
                  type="text"
                  className="input"
                  style={{ paddingRight: '2.5rem' }}
                  placeholder="بحث برقم القيد أو البيان أو المرجع..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select className="input" style={{ width: 160 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">جميع الحالات</option>
                <option value="Draft">مسودة</option>
                <option value="Approved">معتمد</option>
                <option value="Posted">مرحل</option>
                <option value="Void">ملغى</option>
              </select>
            </div>

            {entriesLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-on-surface-variant)' }}>
                جاري تحميل القيود...
              </div>
            ) : entriesError ? (
              <div style={{ color: 'var(--color-error)', padding: '1rem' }}>
                {(entriesErrorObj as any)?.response?.data?.message || 'خطأ في جلب القيود اليومية'}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>رقم القيد</th>
                      <th>تاريخ القيد</th>
                      <th>المرجع</th>
                      <th>البيان الرئيسي</th>
                      <th style={{ textAlign: 'left' }}>إجمالي المدين</th>
                      <th style={{ textAlign: 'left' }}>إجمالي الدائن</th>
                      <th>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                          لا توجد قيود مسجلة
                        </td>
                      </tr>
                    ) : (
                      filteredEntries.map((entry) => (
                        <tr key={entry.id}>
                          <td>
                            <span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                              {entry.entry_number}
                            </span>
                          </td>
                          <td className="numeric">{new Date(entry.entry_date).toLocaleDateString('ar-SA')}</td>
                          <td className="numeric">{entry.reference_no || '—'}</td>
                          <td>{entry.description || '—'}</td>
                          <td className="numeric" style={{ textAlign: 'left', fontWeight: 600 }}>
                            {formatCurrency(Number(entry.total_debit))} ر.س
                          </td>
                          <td className="numeric" style={{ textAlign: 'left', fontWeight: 600 }}>
                            {formatCurrency(Number(entry.total_credit))} ر.س
                          </td>
                          <td>
                            <span
                              className={`chip ${
                                entry.status === 'Posted' ? 'chip-success' :
                                entry.status === 'Approved' ? 'chip-info' : 'chip-neutral'
                              }`}
                            >
                              {entry.status === 'Posted' ? 'مرحل' :
                               entry.status === 'Approved' ? 'معتمد' : 'مسودة'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Status Summary */}
        <div>
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>ملخص توازن القيد</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-on-surface-variant)' }}>إجمالي المدين</span>
              <strong>{formatCurrency(totalDebit)} ر.س</strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-on-surface-variant)' }}>إجمالي الدائن</span>
              <strong>{formatCurrency(totalCredit)} ر.س</strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-on-surface-variant)' }}>الفرق</span>
              <strong>{formatCurrency(balanceDiff)} ر.س</strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-on-surface-variant)' }}>عدد الأسطر</span>
              <strong>{form.lines.length}</strong>
            </div>
            <div
              style={{
                padding: '1rem',
                borderRadius: '0.75rem',
                background: isBalanced ? '#d1fae5' : '#fee2e2',
                color: isBalanced ? '#065f46' : '#991b1b',
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              {isBalanced ? '✔ القيد متوازن' : `✖ القيد غير متوازن (${formatCurrency(balanceDiff)})`}
            </div>
          </div>
        </div>
      </div>

      {/* CREATE JOURNAL ENTRY FORM */}
      {showNew && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>إنشاء قيد محاسبي جديد</h2>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--color-on-surface-variant)', fontSize: '0.875rem' }}>
                يمكنك تحديد الصندوق أو البنك أو العميل في أسطر القيد لاقتراح الحساب المحاسبي تلقائياً
              </p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowNew(false)}>
              إغلاق النموذج
            </button>
          </div>

          {errorMessage && (
            <div style={{ padding: '0.75rem 1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1rem' }}>
              <div>
                <label>تاريخ القيد *</label>
                <input
                  type="date"
                  className="input"
                  value={form.entryDate}
                  onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label>المرجع</label>
                <input
                  type="text"
                  className="input"
                  value={form.referenceNo}
                  onChange={(e) => setForm({ ...form, referenceNo: e.target.value })}
                  placeholder="رقم المستند/الفاتورة"
                />
              </div>
              <div>
                <label>نوع القيد</label>
                <select
                  className="input"
                  value={form.referenceType}
                  onChange={(e) => setForm({ ...form, referenceType: e.target.value })}
                >
                  <option value="Manual">يدوي (Manual)</option>
                  <option value="Automated">آلي (Automated)</option>
                  <option value="Opening">افتتاحي (Opening)</option>
                  <option value="Adjustment">تسوية (Adjustment)</option>
                  <option value="Closing">إقفال (Closing)</option>
                </select>
              </div>
              <div>
                <label>سعر الصرف</label>
                <input
                  type="number"
                  className="input numeric"
                  value={form.exchangeRate}
                  min="0.0001"
                  step="0.0001"
                  onChange={(e) => setForm({ ...form, exchangeRate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label>البيان الرئيسي للقيد</label>
              <textarea
                className="input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="الوصف التفصيلي للقيد اليومي..."
              />
            </div>

            {/* LINES TABLE */}
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ minWidth: 1200 }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th style={{ width: '180px' }}>الصندوق / البنك (اختياري)</th>
                    <th style={{ width: '180px' }}>العميل / المورد</th>
                    <th style={{ width: '220px' }}>الحساب المحاسبي (GL) *</th>
                    <th style={{ width: '160px' }}>مركز التكلفة</th>
                    <th>البيان التفصيلي</th>
                    <th className="numeric" style={{ width: '120px' }}>مدين</th>
                    <th className="numeric" style={{ width: '120px' }}>دائن</th>
                    <th style={{ width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {form.lines.map((line, index) => (
                    <tr key={line.id}>
                      <td>{index + 1}</td>
                      <td>
                        {/* Subledger Cash / Bank Selection */}
                        <select
                          className="input"
                          value={line.cashBoxId ? `cb-${line.cashBoxId}` : line.bankAccountId ? `ba-${line.bankAccountId}` : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.startsWith('cb-')) {
                              updateLine(index, 'cashBoxId', val.replace('cb-', ''));
                            } else if (val.startsWith('ba-')) {
                              updateLine(index, 'bankAccountId', val.replace('ba-', ''));
                            } else {
                              updateLine(index, 'cashBoxId', '');
                              updateLine(index, 'bankAccountId', '');
                            }
                          }}
                        >
                          <option value="">-- اختياري --</option>
                          <optgroup label="الصناديق المالية">
                            {cashBoxes.map((cb) => (
                              <option key={cb.id} value={`cb-${cb.id}`}>📦 {cb.name_ar}</option>
                            ))}
                          </optgroup>
                          <optgroup label="الحسابات البنكية">
                            {bankAccounts.map((ba) => (
                              <option key={ba.id} value={`ba-${ba.id}`}>🏛️ {ba.name_ar}</option>
                            ))}
                          </optgroup>
                        </select>
                      </td>
                      <td>
                        {/* Subledger Customer / Supplier Selection */}
                        <select
                          className="input"
                          value={line.customerId ? `c-${line.customerId}` : line.supplierId ? `s-${line.supplierId}` : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.startsWith('c-')) {
                              updateLine(index, 'customerId', val.replace('c-', ''));
                            } else if (val.startsWith('s-')) {
                              updateLine(index, 'supplierId', val.replace('s-', ''));
                            } else {
                              updateLine(index, 'customerId', '');
                              updateLine(index, 'supplierId', '');
                            }
                          }}
                        >
                          <option value="">-- اختياري --</option>
                          <optgroup label="العملاء">
                            {customers.map((c) => (
                              <option key={c.id} value={`c-${c.id}`}>👤 {c.name_ar}</option>
                            ))}
                          </optgroup>
                          <optgroup label="الموردون">
                            {suppliers.map((s) => (
                              <option key={s.id} value={`s-${s.id}`}>🚚 {s.name_ar}</option>
                            ))}
                          </optgroup>
                        </select>
                      </td>
                      <td>
                        <select
                          className="input"
                          value={line.glAccountId}
                          onChange={(e) => updateLine(index, 'glAccountId', e.target.value)}
                          required
                        >
                          <option value="">اختر الحساب المحاسبي</option>
                          {accounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.code} - {account.name_ar}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="input"
                          value={line.costCenterId}
                          onChange={(e) => updateLine(index, 'costCenterId', e.target.value)}
                        >
                          <option value="">افتراضي</option>
                          {costCenters.map((center) => (
                            <option key={center.id} value={center.id}>
                              {center.code} - {center.name_ar}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="input"
                          value={line.description}
                          onChange={(e) => updateLine(index, 'description', e.target.value)}
                          placeholder="البيان..."
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="input numeric"
                          min="0"
                          step="0.01"
                          value={line.debit}
                          onChange={(e) => updateLine(index, 'debit', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="input numeric"
                          min="0"
                          step="0.01"
                          value={line.credit}
                          onChange={(e) => updateLine(index, 'credit', e.target.value)}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => removeLine(index)}
                          disabled={form.lines.length <= 1}
                          style={{ color: 'var(--color-error)' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                إضافة سطر جديد
              </button>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowNew(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={!isBalanced || createMutation.isPending}>
                  {createMutation.isPending ? 'جاري الحفظ...' : 'حفظ القيد المحاسبي'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
