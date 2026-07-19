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
  description: string;
  debit: string;
  credit: string;
}

const EMPTY_LINE = {
  id: `line-${Date.now()}`,
  glAccountId: '',
  costCenterId: '',
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
        lines: [EMPTY_LINE],
      });
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.message || 'حدث خطأ أثناء حفظ القيد');
    },
  });

  const updateLine = (index: number, field: keyof JournalLine, value: string) => {
    setForm((current) => ({
      ...current,
      lines: current.lines.map((line, idx) =>
        idx === index ? { ...line, [field]: value } : line
      ),
    }));
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
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, margin: 0 }}>قيود اليومية</h1>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--color-on-surface-variant)' }}>
            شاشة إنشاء وعرض القيود اليومية مع التحقق من القيد المزدوج قبل الاعتماد والترحيل.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/accounting/transaction-analysis')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
            العودة لتحليل المعاملات
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
                  عرض أحدث ١٠٠ قيد مع إمكانية البحث والتصفية.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline)', fontSize: 18 }}>search</span>
                <input
                  className="input"
                  placeholder="بحث برقم القيد أو البيان..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingRight: '2.5rem', width: '100%' }}
                />
              </div>
              <select
                className="input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ minWidth: 170 }}
              >
                <option value="">كل الحالات</option>
                <option value="Draft">مسودة</option>
                <option value="Approved">معتمد</option>
                <option value="Posted">مرحّل</option>
                <option value="Void">ملغي</option>
              </select>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ minWidth: 980, whiteSpace: 'nowrap' }}>
                <thead>
                  <tr>
                    <th>رقم القيد</th>
                    <th>تاريخ القيد</th>
                    <th>البيان</th>
                    <th>المرجع</th>
                    <th>النوع</th>
                    <th className="numeric">المدين</th>
                    <th className="numeric">الدائن</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {entriesLoading ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2rem 0' }}>جاري تحميل القيود...</td>
                    </tr>
                  ) : entriesError ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2rem 0', color: '#b91c1c' }}>
                        حدث خطأ أثناء جلب القيود: {(entriesErrorObj as any)?.response?.data?.message || 'يرجى تسجيل الدخول أو تحديث الصفحة.'}
                      </td>
                    </tr>
                  ) : filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--color-on-surface-variant)' }}>
                        لا توجد قيود مطابقة للبحث.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.slice(0, 20).map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.entry_number}</td>
                        <td className="numeric">{entry.entry_date.split('T')[0]}</td>
                        <td>{entry.description || '—'}</td>
                        <td>{entry.reference_no || '—'}</td>
                        <td>{entry.reference_type || 'يدوي'}</td>
                        <td className="numeric">{formatCurrency(Number(entry.total_debit))}</td>
                        <td className="numeric">{formatCurrency(Number(entry.total_credit))}</td>
                        <td>
                          <span className={`chip ${entry.status === 'Posted' ? 'chip-success' : entry.status === 'Approved' ? 'chip-info' : entry.status === 'Void' ? 'chip-error' : 'chip-neutral'}`}>
                            {entry.status === 'Posted'
                              ? 'مرحّل'
                              : entry.status === 'Approved'
                              ? 'معتمد'
                              : entry.status === 'Void'
                              ? 'ملغي'
                              : 'مسودة'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>لوحة التحقق السريع</h2>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-on-surface-variant)' }}>إجمالي المدين</span>
              <strong>{formatCurrency(totalDebit)}</strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-on-surface-variant)' }}>إجمالي الدائن</span>
              <strong>{formatCurrency(totalCredit)}</strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-on-surface-variant)' }}>الفرق</span>
              <strong>{formatCurrency(balanceDiff)}</strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-on-surface-variant)' }}>عدد الأسطر</span>
              <strong>{form.lines.length}</strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-on-surface-variant)' }}>عدد الحسابات المستخدمة</span>
              <strong>{new Set(form.lines.map((line) => line.glAccountId).filter(Boolean)).size}</strong>
            </div>
            <div style={{ padding: '1rem', borderRadius: '1rem', background: isBalanced ? '#d1fae5' : '#fee2e2', color: isBalanced ? '#065f46' : '#991b1b', fontWeight: 700 }}>
              {isBalanced ? '✔ القيد متوازن' : `✖ القيد غير متوازن (${formatCurrency(balanceDiff)})`}
            </div>
          </div>
        </div>
      </div>

      {showNew && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>إنشاء قيد جديد</h2>
              <p style={{ margin: '0.5rem 0 0', color: 'var(--color-on-surface-variant)' }}>
                املأ بيانات القيد والتفاصيل ثم احفظ للحصول على قيد مسودة.
              </p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowNew(false)}>
              إغلاق النموذج
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1rem' }}>
              <label className="form-field">
                <span>تاريخ القيد</span>
                <input
                  type="date"
                  className="input"
                  value={form.entryDate}
                  onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
                  required
                />
              </label>
              <label className="form-field">
                <span>المرجع</span>
                <input
                  type="text"
                  className="input"
                  value={form.referenceNo}
                  onChange={(e) => setForm({ ...form, referenceNo: e.target.value })}
                />
              </label>
              <label className="form-field">
                <span>نوع القيد</span>
                <select
                  className="input"
                  value={form.referenceType}
                  onChange={(e) => setForm({ ...form, referenceType: e.target.value })}
                >
                  <option value="Manual">يدوي</option>
                  <option value="Automated">آلي</option>
                  <option value="Opening">افتتاحي</option>
                  <option value="Adjustment">تسوية</option>
                  <option value="Closing">إقفال</option>
                </select>
              </label>
              <label className="form-field">
                <span>سعر الصرف</span>
                <input
                  type="number"
                  className="input"
                  value={form.exchangeRate}
                  min="0.0001"
                  step="0.0001"
                  onChange={(e) => setForm({ ...form, exchangeRate: e.target.value })}
                />
              </label>
            </div>

            <label className="form-field">
              <span>البيان الرئيسي</span>
              <textarea
                className="input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </label>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ minWidth: 1080, whiteSpace: 'nowrap' }}>
                <thead>
                  <tr>
                    <th>السطر</th>
                    <th>الحساب</th>
                    <th>مركز التكلفة</th>
                    <th>البيان</th>
                    <th className="numeric">مدين</th>
                    <th className="numeric">دائن</th>
                    <th>أوامر</th>
                  </tr>
                </thead>
                <tbody>
                  {form.lines.map((line, index) => (
                    <tr key={line.id}>
                      <td>{index + 1}</td>
                      <td>
                        <select
                          className="input"
                          value={line.glAccountId}
                          onChange={(e) => updateLine(index, 'glAccountId', e.target.value)}
                          required
                        >
                          <option value="">اختر الحساب</option>
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
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="input"
                          min="0"
                          step="0.01"
                          value={line.debit}
                          onChange={(e) => updateLine(index, 'debit', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="input"
                          min="0"
                          step="0.01"
                          value={line.credit}
                          onChange={(e) => updateLine(index, 'credit', e.target.value)}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => removeLine(index)}
                          disabled={form.lines.length === 1}
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-secondary" onClick={addLine}>
                إضافة سطر
              </button>
              <button type="submit" className="btn btn-primary" disabled={createMutation.status === 'pending'}>
                {createMutation.status === 'pending' ? 'جاري الحفظ...' : 'حفظ القيد'}
              </button>
            </div>

            {errorMessage && (
              <div style={{ padding: '1rem', borderRadius: '1rem', background: '#fee2e2', color: '#991b1b' }}>
                {errorMessage}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
