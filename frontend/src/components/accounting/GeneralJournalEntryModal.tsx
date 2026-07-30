import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';

export interface JournalLineItem {
  id: string;
  glAccountId: string;
  accountCode: string;
  accountName: string;
  costCenterId: string;
  costCenterName?: string;
  projectId: string;
  description: string;
  debitForeign: string;
  creditForeign: string;
  debitLocal: string;
  creditLocal: string;
  notes?: string;
  // Party fields
  partyType: 'none' | 'customer' | 'supplier';
  partyId: string;
  partyName: string;
  referenceNumber: string;
}

export interface GeneralJournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryId?: string | null;
  onSuccess?: () => void;
  /** When true the component renders as a full page instead of a modal overlay */
  fullPage?: boolean;
}

const DEFAULT_LINE = (): JournalLineItem => ({
  id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
  glAccountId: '',
  accountCode: '',
  accountName: '',
  costCenterId: '',
  projectId: '',
  description: '',
  debitForeign: '',
  creditForeign: '',
  debitLocal: '0.00',
  creditLocal: '0.00',
  notes: '',
  partyType: 'none',
  partyId: '',
  partyName: '',
  referenceNumber: '',
});

export default function GeneralJournalEntryModal({
  isOpen,
  onClose,
  entryId = null,
  onSuccess,
  fullPage = false,
}: GeneralJournalEntryModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Header State
  const [branchId, setBranchId] = useState<string>('');
  const [periodId, setPeriodId] = useState<string>('');
  const [fiscalYear] = useState<string>(new Date().getFullYear().toString());
  const [documentType, setDocumentType] = useState<string>('قيد يومية عام');
  const [entryNumber, setEntryNumber] = useState<string>('JV-2024-0042');
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [mainDescription, setMainDescription] = useState<string>('');
  const [currencyId, setCurrencyId] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState<string>('1.0000');
  const [status, setStatus] = useState<string>('Draft');

  // Entry Properties
  const [isReviewable, setIsReviewable] = useState<boolean>(true);
  const [isAutoReverse, setIsAutoReverse] = useState<boolean>(false);
  const [isRecurring, setIsRecurring] = useState<boolean>(false);


  // Table Lines (Default 2 rows)
  const [lines, setLines] = useState<JournalLineItem[]>([
    {
      id: 'line-1',
      glAccountId: '',
      accountCode: '1201001',
      accountName: 'البنك الأهلي السعودي - جاري',
      costCenterId: '',
      projectId: '',
      description: 'سداد فاتورة مشتريات رقم 102',
      debitForeign: '',
      creditForeign: '',
      debitLocal: '15000.00',
      creditLocal: '0.00',
      partyType: 'none',
      partyId: '',
      partyName: '',
      referenceNumber: '',
    },
    {
      id: 'line-2',
      glAccountId: '',
      accountCode: '2101005',
      accountName: 'شركة الحلول الرقمية - مورد',
      costCenterId: '',
      projectId: '',
      description: 'سداد فاتورة مشتريات رقم 102',
      debitForeign: '',
      creditForeign: '',
      debitLocal: '0.00',
      creditLocal: '15000.00',
      partyType: 'none',
      partyId: '',
      partyName: '',
      referenceNumber: '',
    },
  ]);

  // Sub-modals
  const [showAccountTree, setShowAccountTree] = useState<boolean>(false);
  const [activeAccountLineIndex, setActiveAccountLineIndex] = useState<number | null>(null);
  const [showAuditLogs, setShowAuditLogs] = useState<boolean>(false);
  const [showAttachments, setShowAttachments] = useState<boolean>(false);
  const [showJournalList, setShowJournalList] = useState<boolean>(false);
  const [searchAccountQuery, setSearchAccountQuery] = useState<string>('');
  const [searchJournalListQuery, setSearchJournalListQuery] = useState<string>('');
  const [journalListStatusFilter, setJournalListStatusFilter] = useState<string>('');
  const [activeEntryId, setActiveEntryId] = useState<string | null>(entryId || null);
  const [partySearchQueries] = useState<Record<string, string>>({});

  useEffect(() => {
    setActiveEntryId(entryId || null);
  }, [entryId]);

  // Alerts
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Fetch Lookups
  const { data: branches = [] } = useQuery({
    queryKey: ['branches-lookup'],
    queryFn: async () => {
      const res = await api.get('/setup/branches');
      return res.data.data?.items || res.data.data || [];
    },
    enabled: isOpen,
  });

  const { data: currencies = [] } = useQuery({
    queryKey: ['currencies-lookup'],
    queryFn: async () => {
      const res = await api.get('/setup/currencies');
      return res.data.data || [];
    },
    enabled: isOpen,
  });

  const { data: periods = [] } = useQuery({
    queryKey: ['financial-periods-lookup'],
    queryFn: async () => {
      const res = await api.get('/setup/financial-periods');
      return res.data.data || [];
    },
    enabled: isOpen,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts-lookup'],
    queryFn: async () => {
      const res = await api.get('/accounting/accounts');
      return res.data.data || [];
    },
    enabled: isOpen,
  });

  const { data: costCenters = [] } = useQuery({
    queryKey: ['cost-centers-lookup'],
    queryFn: async () => {
      const res = await api.get('/accounting/cost-centers');
      return res.data.data || [];
    },
    enabled: isOpen,
  });

  // Customers lookup
  const { data: customers = [] } = useQuery({
    queryKey: ['customers-lookup-journal'],
    queryFn: async () => {
      const res = await api.get('/sales/customers').catch(() => ({ data: { data: [] } }));
      const list = res.data?.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      return Array.isArray(list) ? list : [];
    },
    enabled: isOpen,
  });

  // Suppliers lookup
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers-lookup-journal'],
    queryFn: async () => {
      const res = await api.get('/setup/suppliers').catch(() => ({ data: { data: [] } }));
      const list = res.data?.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      return Array.isArray(list) ? list : [];
    },
    enabled: isOpen,
  });

  // Helper: detect if an account belongs to AR (customer) or AP (supplier) group
  const detectPartyType = (accountCode: string, accountId: string): 'customer' | 'supplier' | 'none' => {
    const acc = accounts.find((a: any) => a.code === accountCode || a.id === accountId);
    if (!acc) return 'none';
    // Check by account type tags or linked ar/ap flag
    const nameAr = (acc.name_ar || '').toLowerCase();
    const nameEn = (acc.name_en || '').toLowerCase();
    const accountType = (acc.account_type || '').toLowerCase();
    // Accounts starting with 1-2 digit prefix that typically belong to AR/AP
    if (accountType === 'receivable' || nameAr.includes('ذمم') && nameAr.includes('مدين') || nameEn.includes('receivable') || nameAr.includes('عملاء')) {
      return 'customer';
    }
    if (accountType === 'payable' || nameAr.includes('ذمم') && nameAr.includes('دائن') || nameEn.includes('payable') || nameAr.includes('مورد') || nameAr.includes('الموردين') || nameAr.includes('دائنون')) {
      return 'supplier';
    }
    // Customers in DB have ar_account_id, check if this GL account is an AR account
    const isAR = customers.some((c: any) => c.ar_account_id === accountId);
    if (isAR) return 'customer';
    const isAP = suppliers.some((s: any) => s.ap_account_id === accountId);
    if (isAP) return 'supplier';
    return 'none';
  };

  // Base local currency
  const baseCurrency = useMemo(() => {
    return currencies.find((c: any) => c.is_default) || currencies[0] || { code: 'SAR', symbol: 'ر.س', name_ar: 'ريال سعودي' };
  }, [currencies]);

  const selectedCurrencyObj = useMemo(() => {
    return currencies.find((c: any) => c.id === currencyId) || baseCurrency;
  }, [currencies, currencyId, baseCurrency]);

  const isForeignCurrency = useMemo(() => {
    if (!selectedCurrencyObj || !baseCurrency) return false;
    return selectedCurrencyObj.id !== baseCurrency.id && selectedCurrencyObj.code !== baseCurrency.code;
  }, [selectedCurrencyObj, baseCurrency]);

  // Default selection
  useEffect(() => {
    if (branches.length > 0 && !branchId) {
      const userBranch = branches.find((b: any) => b.id === user?.branchId) || branches[0];
      setBranchId(userBranch.id);
    }
  }, [branches, user, branchId]);

  useEffect(() => {
    if (currencies.length > 0 && !currencyId) {
      const def = currencies.find((c: any) => c.is_default) || currencies[0];
      setCurrencyId(def.id);
    }
  }, [currencies, currencyId]);

  // Load existing entry details
  const { data: entryDetail } = useQuery({
    queryKey: ['journal-entry-detail', activeEntryId],
    queryFn: async () => {
      if (!activeEntryId) return null;
      const res = await api.get(`/accounting/journal-entries/${activeEntryId}`);
      return res.data.data;
    },
    enabled: isOpen && !!activeEntryId,
  });

  // Fetch all journal entries for history list modal
  const { data: allJournalEntries = [] } = useQuery({
    queryKey: ['journal-entries-list'],
    queryFn: async () => {
      const res = await api.get('/accounting/journal-entries');
      return (res.data.data || []) as any[];
    },
    enabled: isOpen,
  });

  const handleNewEntry = () => {
    setActiveEntryId(null);
    setEntryNumber(`JV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setEntryDate(new Date().toISOString().slice(0, 10));
    setReferenceNo('');
    setMainDescription('');
    setStatus('Draft');
    setLines([
      {
        id: 'line-1',
        glAccountId: '',
        accountCode: '',
        accountName: '',
        costCenterId: '',
        projectId: '',
        description: '',
        debitForeign: '',
        creditForeign: '',
        debitLocal: '0.00',
        creditLocal: '0.00',
        partyType: 'none',
        partyId: '',
        partyName: '',
        referenceNumber: '',
      },
      {
        id: 'line-2',
        glAccountId: '',
        accountCode: '',
        accountName: '',
        costCenterId: '',
        projectId: '',
        description: '',
        debitForeign: '',
        creditForeign: '',
        debitLocal: '0.00',
        creditLocal: '0.00',
        partyType: 'none',
        partyId: '',
        partyName: '',
        referenceNumber: '',
      },
    ]);
  };

  useEffect(() => {
    if (entryDetail && entryId) {
      setEntryNumber(entryDetail.entry_number || '');
      setEntryDate(entryDetail.entry_date ? entryDetail.entry_date.split('T')[0] : new Date().toISOString().slice(0, 10));
      setReferenceNo(entryDetail.reference_no || '');
      setMainDescription(entryDetail.description || '');
      setBranchId(entryDetail.branch_id || '');
      setCurrencyId(entryDetail.currency_id || '');
      setExchangeRate(entryDetail.exchange_rate?.toString() || '1.0000');
      setStatus(entryDetail.status || 'Draft');
      setPeriodId(entryDetail.period_id || '');

      if (entryDetail.lines && entryDetail.lines.length > 0) {
        const mapped = entryDetail.lines.map((l: any) => {
          // Determine partyType from stored customer_id/supplier_id
          let partyType: 'none' | 'customer' | 'supplier' = 'none';
          let partyId = '';
          let partyName = '';
          if (l.customerId) {
            partyType = 'customer';
            partyId = l.customerId;
            const cust = customers.find((c: any) => c.id === l.customerId);
            partyName = cust?.name_ar || '';
          } else if (l.supplierId) {
            partyType = 'supplier';
            partyId = l.supplierId;
            const supp = suppliers.find((s: any) => s.id === l.supplierId);
            partyName = supp?.name_ar || '';
          }
          return {
            id: l.id,
            glAccountId: l.glAccountId,
            accountCode: l.accountCode || '',
            accountName: l.accountName || '',
            costCenterId: l.costCenterId || '',
            costCenterName: l.costCenterName || '',
            projectId: l.projectId || '',
            description: l.description || '',
            debitForeign: Number(l.debit || 0) ? Number(l.debit).toFixed(2) : '',
            creditForeign: Number(l.credit || 0) ? Number(l.credit).toFixed(2) : '',
            debitLocal: Number(l.debitBase || 0).toFixed(2),
            creditLocal: Number(l.creditBase || 0).toFixed(2),
            partyType,
            partyId,
            partyName,
            referenceNumber: '',
          };
        });
        setLines(mapped);
      }
    }
  }, [entryDetail, entryId, customers, suppliers]);

  // Recalculate local amounts when rate changes
  useEffect(() => {
    const rate = parseFloat(exchangeRate) || 1;
    if (isForeignCurrency) {
      setLines((prevLines) =>
        prevLines.map((line) => {
          const dForeign = parseFloat(line.debitForeign) || 0;
          const cForeign = parseFloat(line.creditForeign) || 0;
          return {
            ...line,
            debitLocal: (dForeign * rate).toFixed(2),
            creditLocal: (cForeign * rate).toFixed(2),
          };
        })
      );
    }
  }, [exchangeRate, isForeignCurrency]);

  const handleCurrencyChange = async (newCurrId: string) => {
    setCurrencyId(newCurrId);
    const currObj = currencies.find((c: any) => c.id === newCurrId);
    if (currObj && (currObj.is_default || currObj.code === baseCurrency?.code)) {
      setExchangeRate('1.0000');
    } else if (newCurrId) {
      try {
        const ratesRes = await api.get(`/setup/exchange-rates?currencyId=${newCurrId}`);
        if (ratesRes.data.data && ratesRes.data.data.length > 0) {
          setExchangeRate(ratesRes.data.data[0].mid_rate.toString());
        } else {
          setExchangeRate('3.7500');
        }
      } catch {
        setExchangeRate('1.0000');
      }
    }
  };

  const updateLineField = (index: number, field: keyof JournalLineItem, value: string) => {
    setLines((prevLines) => {
      const newLines = [...prevLines];
      const line = { ...newLines[index] };
      (line as any)[field] = value;

      const rate = parseFloat(exchangeRate) || 1;

      if (field === 'accountCode') {
        const matched = accounts.find((a: any) => a.code === value);
        if (matched) {
          line.glAccountId = matched.id;
          line.accountName = matched.name_ar;
          // Auto-detect party type based on account
          const detected = detectPartyType(matched.code, matched.id);
          if (detected !== line.partyType) {
            line.partyType = detected;
            line.partyId = '';
            line.partyName = '';
          }
        } else {
          line.glAccountId = '';
          line.accountName = '';
        }
      }

      if (field === 'glAccountId') {
        const matched = accounts.find((a: any) => a.id === value);
        if (matched) {
          line.accountCode = matched.code;
          line.accountName = matched.name_ar;
          // Auto-detect party type based on account
          const detected = detectPartyType(matched.code, matched.id);
          if (detected !== line.partyType) {
            line.partyType = detected;
            line.partyId = '';
            line.partyName = '';
          }
        }
      }

      if (field === 'partyType') {
        // Reset party selection when type changes
        line.partyId = '';
        line.partyName = '';
      }

      if (field === 'partyId') {
        // Resolve party name from id
        if (line.partyType === 'customer') {
          const cust = customers.find((c: any) => c.id === value);
          line.partyName = cust?.name_ar || '';
        } else if (line.partyType === 'supplier') {
          const supp = suppliers.find((s: any) => s.id === value);
          line.partyName = supp?.name_ar || '';
        }
      }

      if (isForeignCurrency) {
        if (field === 'debitForeign') {
          const valNum = parseFloat(value) || 0;
          line.debitLocal = (valNum * rate).toFixed(2);
          if (valNum > 0) {
            line.creditForeign = '';
            line.creditLocal = '0.00';
          }
        }
        if (field === 'creditForeign') {
          const valNum = parseFloat(value) || 0;
          line.creditLocal = (valNum * rate).toFixed(2);
          if (valNum > 0) {
            line.debitForeign = '';
            line.debitLocal = '0.00';
          }
        }
      } else {
        if (field === 'debitLocal') {
          const valNum = parseFloat(value) || 0;
          if (valNum > 0) {
            line.creditLocal = '0.00';
          }
        }
        if (field === 'creditLocal') {
          const valNum = parseFloat(value) || 0;
          if (valNum > 0) {
            line.debitLocal = '0.00';
          }
        }
      }

      newLines[index] = line;
      return newLines;
    });
  };

  const addLine = () => {
    setLines((prev) => [...prev, DEFAULT_LINE()]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const copyLine = (index: number) => {
    const lineToCopy = lines[index];
    const copied: JournalLineItem = {
      ...lineToCopy,
      id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      // Copy party and reference data as well
      partyType: lineToCopy.partyType,
      partyId: lineToCopy.partyId,
      partyName: lineToCopy.partyName,
      referenceNumber: lineToCopy.referenceNumber,
    };
    setLines((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, copied);
      return next;
    });
  };

  // Balance calculations
  const totals = useMemo(() => {
    let totalDebitForeign = 0;
    let totalCreditForeign = 0;
    let totalDebitLocal = 0;
    let totalCreditLocal = 0;

    lines.forEach((line) => {
      totalDebitForeign += parseFloat(line.debitForeign) || 0;
      totalCreditForeign += parseFloat(line.creditForeign) || 0;
      totalDebitLocal += parseFloat(line.debitLocal) || 0;
      totalCreditLocal += parseFloat(line.creditLocal) || 0;
    });

    const diffLocal = totalDebitLocal - totalCreditLocal;
    const isBalanced = Math.abs(diffLocal) < 0.01;

    return {
      totalDebitForeign,
      totalCreditForeign,
      totalDebitLocal,
      totalCreditLocal,
      diffLocal,
      isBalanced,
    };
  }, [lines]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (targetStatus: string = 'Draft') => {
      setErrorMessage('');
      setSuccessMessage('');

      if (!branchId && branches.length > 0) setBranchId(branches[0].id);
      if (lines.length < 1) throw new Error('يرجى إضافة سطر محاسبي واحد على الأقل');
      if (!totals.isBalanced) throw new Error('القيد غير متزن: إجمالي المدين يجب أن يساوي إجمالي الدائن');

      // Validate party fields: if party is required but not selected, block save
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        if (l.partyType === 'customer' && !l.partyId) {
          throw new Error(`السطر رقم ${i + 1}: الحساب مرتبط بالعملاء - يرجى اختيار العميل`);
        }
        if (l.partyType === 'supplier' && !l.partyId) {
          throw new Error(`السطر رقم ${i + 1}: الحساب مرتبط بالموردين - يرجى اختيار المورد`);
        }
      }

      const payload = {
        entryDate,
        periodId: periodId || null,
        description: mainDescription,
        referenceNo,
        referenceType: documentType,
        branchId: branchId || (branches[0]?.id || user?.branchId),
        currencyId: currencyId || baseCurrency?.id,
        exchangeRate: parseFloat(exchangeRate) || 1,
        status: targetStatus,
        lines: lines.map((l) => {
          const accObj = accounts.find((a: any) => a.code === l.accountCode || a.id === l.glAccountId);
          return {
            glAccountId: accObj?.id || l.glAccountId,
            costCenterId: l.costCenterId || null,
            projectId: l.projectId || null,
            customerId: l.partyType === 'customer' ? (l.partyId || null) : null,
            supplierId: l.partyType === 'supplier' ? (l.partyId || null) : null,
            debit: parseFloat(l.debitForeign) || parseFloat(l.debitLocal) || 0,
            credit: parseFloat(l.creditForeign) || parseFloat(l.creditLocal) || 0,
            debitBase: parseFloat(l.debitLocal) || 0,
            creditBase: parseFloat(l.creditLocal) || 0,
            description: l.description,
          };
        }),
      };

      if (entryId) {
        const res = await api.put(`/accounting/journal-entries/${entryId}`, payload);
        return res.data;
      } else {
        const res = await api.post('/accounting/journal-entries', payload);
        return res.data;
      }
    },
    onSuccess: (data) => {
      setSuccessMessage(data.message || 'تم حفظ القيد اليومي بنجاح');
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      if (onSuccess) onSuccess();
      setTimeout(() => setSuccessMessage(''), 4000);
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || err.message || 'حدث خطأ أثناء حفظ القيد');
    },
  });

  const statusActionMutation = useMutation({
    mutationFn: async (action: 'Review' | 'Approve' | 'Post' | 'Reverse' | 'Void') => {
      setErrorMessage('');
      setSuccessMessage('');
      if (!entryId) throw new Error('يرجى حفظ القيد كمسودة أولاً قبل اعتماد أو ترحيل الحالة');
      const res = await api.put(`/accounting/journal-entries/${entryId}/status`, { action });
      return res.data;
    },
    onSuccess: (data) => {
      setSuccessMessage(data.message || 'تم تحديث حالة القيد بنجاح');
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entry-detail', entryId] });
      if (onSuccess) onSuccess();
      setTimeout(() => setSuccessMessage(''), 4000);
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || err.message || 'حدث خطأ في تحديث الحالة');
    },
  });

  // Filter accounts for tree view dialog
  const filteredAccountsForTree = useMemo(() => {
    if (!searchAccountQuery) return accounts;
    return accounts.filter(
      (a: any) =>
        a.code.toLowerCase().includes(searchAccountQuery.toLowerCase()) ||
        a.name_ar.toLowerCase().includes(searchAccountQuery.toLowerCase())
    );
  }, [accounts, searchAccountQuery]);

  if (!isOpen) return null;

  // ─────────────────────── Full-Page Layout ───────────────────────
  // Pure presentation layer. All state/handlers/mutations above are unchanged.
  if (fullPage) {
    const statusBadgeClass = status === 'Posted'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'Approved'
      ? 'bg-blue-100 text-blue-800'
      : status === 'Void'
      ? 'bg-red-100 text-red-700'
      : 'bg-[#e0e3e5] text-[#3d4949]';

    const currentPeriodLabel = (() => {
      const p = periods.find((p: any) => p.id === periodId);
      if (p) return p.name;
      const m = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      return `${m[new Date().getMonth()]}-${new Date().getFullYear()}`;
    })();

    return (
      <div className="flex flex-col min-h-screen bg-[#f8f9fb] font-sans text-[#191c1e]" dir="rtl">

        {/* ── Alert Banners ── */}
        {errorMessage && (
          <div className="fixed top-0 inset-x-0 z-[200] bg-red-50 text-red-700 px-6 py-3 flex items-center justify-between text-sm font-medium border-b border-red-200 shadow-md">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage('')} className="font-bold text-lg leading-none">×</button>
          </div>
        )}
        {successMessage && (
          <div className="fixed top-0 inset-x-0 z-[200] bg-emerald-50 text-emerald-700 px-6 py-3 flex items-center justify-between text-sm font-medium border-b border-emerald-200 shadow-md">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage('')} className="font-bold text-lg leading-none">×</button>
          </div>
        )}

        {/* ── Sticky Page Header ── */}
        <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-[#f8f9fb]/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.06)] border-b border-[#bcc9c8]/20">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#eceef0] transition-colors text-[#3d4949]"
              title="رجوع"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-[#191c1e] tracking-tight">
                  القيود اليومية العامة
                  <span className="text-[#d8dadc] font-light mx-2">|</span>
                  <span className="text-[#3d4949] font-normal text-lg">General Journal Entry</span>
                </h1>
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${statusBadgeClass}`}>
                  {status}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-bold text-[#006767] font-mono bg-[#006767]/8 px-2 py-0.5 rounded">#{entryNumber}</span>
                <span className="w-1 h-1 rounded-full bg-[#bcc9c8]"></span>
                <span className="text-xs text-[#6d7979]">آخر تعديل: منذ دقيقتين</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Icon toolbar */}
            <div className="flex items-center bg-[#eceef0] rounded-lg p-1 gap-1">
              <button
                onClick={() => saveMutation.mutate('Draft')}
                disabled={saveMutation.isPending}
                className="p-2 hover:bg-[#e6e8ea] rounded-md transition-colors text-[#3d4949]"
                title="حفظ / Save"
              >
                <span className="material-symbols-outlined text-[20px]">save</span>
              </button>
              <button onClick={addLine} className="p-2 hover:bg-[#e6e8ea] rounded-md transition-colors text-[#3d4949]" title="إضافة سطر / Add Row">
                <span className="material-symbols-outlined text-[20px]">add_box</span>
              </button>
              <button onClick={() => window.print()} className="p-2 hover:bg-[#e6e8ea] rounded-md transition-colors text-[#3d4949]" title="طباعة / Print">
                <span className="material-symbols-outlined text-[20px]">print</span>
              </button>
              <button onClick={() => setShowAttachments(true)} className="p-2 hover:bg-[#e6e8ea] rounded-md transition-colors text-[#3d4949]" title="مرفقات / Attachments">
                <span className="material-symbols-outlined text-[20px]">attach_file</span>
              </button>
            </div>

            <button
              onClick={handleNewEntry}
              className="px-3.5 py-2 bg-[#006767]/10 text-[#006767] hover:bg-[#006767]/20 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              قيد جديد
            </button>
            <button
              onClick={() => setShowJournalList(true)}
              className="px-3.5 py-2 bg-[#f2f4f6] hover:bg-[#e6e8ea] text-[#191c1e] rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all border border-[#bcc9c8]/30"
            >
              <span className="material-symbols-outlined text-[18px]">list_alt</span>
              سجل القيود ({allJournalEntries.length})
            </button>

            <div className="w-px h-8 bg-[#bcc9c8]/40"></div>

            <button
              onClick={() => saveMutation.mutate('Draft')}
              disabled={saveMutation.isPending}
              className="px-5 py-2.5 rounded-lg border border-[#006767] text-[#006767] font-bold text-sm hover:bg-[#006767]/5 transition-all disabled:opacity-50"
            >
              Review / مراجعة
            </button>
            <button
              disabled={saveMutation.isPending || statusActionMutation.isPending || status === 'Posted'}
              onClick={() => {
                if (activeEntryId && status !== 'Posted') {
                  statusActionMutation.mutate('Post');
                } else {
                  saveMutation.mutate('Posted');
                }
              }}
              className="px-5 py-2.5 rounded-lg bg-[#006767] text-white font-bold text-sm shadow-md hover:shadow-lg hover:bg-[#005252] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Approve &amp; Post / اعتماد وترحيل
            </button>
          </div>
        </div>

        {/* ── Two-Panel Body ── */}
        <div className="flex flex-row-reverse w-full px-6 py-8 gap-5 flex-1">

          {/* ──── Main Content ──── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Header Form Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-[#bcc9c8]/20">
              <div className="grid grid-cols-12 gap-5">
                <div className="col-span-3 flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-[#6d7979] uppercase tracking-wider">تاريخ القيد / Entry Date</label>
                  <input
                    type="date" value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="bg-[#f2f4f6] border-none rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#006767] outline-none transition-all"
                  />
                </div>
                <div className="col-span-3 flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-[#6d7979] uppercase tracking-wider">رقم المرجع / Reference No</label>
                  <input
                    type="text" placeholder="REF-00921" value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="bg-[#f2f4f6] border-none rounded-lg px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-[#006767] outline-none transition-all"
                  />
                </div>
                <div className="col-span-3 flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-[#6d7979] uppercase tracking-wider">نوع المستند / Document Type</label>
                  <select
                    value={documentType} onChange={(e) => setDocumentType(e.target.value)}
                    className="bg-[#f2f4f6] border-none rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#006767] outline-none appearance-none transition-all"
                  >
                    <option value="قيد عام / General">قيد عام / General</option>
                    <option value="قيد يومية عام">قيد يومية عام</option>
                    <option value="تسوية جردية">تسوية جردية / Adjustment</option>
                    <option value="قيد افتتاح">قيد افتتاح / Opening</option>
                  </select>
                </div>
                <div className="col-span-3 flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-[#6d7979] uppercase tracking-wider">الفرع / Branch</label>
                  <select
                    value={branchId} onChange={(e) => setBranchId(e.target.value)}
                    className="bg-[#f2f4f6] border-none rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#006767] outline-none appearance-none transition-all"
                  >
                    <option value="">اختر الفرع...</option>
                    {branches.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.name_ar || b.code}</option>
                    ))}
                    {branches.length === 0 && <option value="default">الفرع الرئيسي - الرياض</option>}
                  </select>
                </div>
                <div className="col-span-2 flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-[#6d7979] uppercase tracking-wider">العملة / Currency</label>
                  <select
                    value={currencyId} onChange={(e) => handleCurrencyChange(e.target.value)}
                    className="bg-[#f2f4f6] border-none rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#006767] outline-none appearance-none transition-all"
                  >
                    {currencies.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name_ar}</option>
                    ))}
                    {currencies.length === 0 && (
                      <>
                        <option value="USD">USD - United States Dollar</option>
                        <option value="SAR">SAR - Saudi Riyal</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="col-span-2 flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-[#6d7979] uppercase tracking-wider">سعر الصرف / Rate</label>
                  <input
                    type="number" step="0.00001" value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    className="bg-[#f2f4f6] border-none rounded-lg px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-[#006767] outline-none transition-all"
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-[#6d7979] uppercase tracking-wider">الفترة المالية / Period</label>
                  <div className="bg-[#f2f4f6] rounded-lg px-4 py-2.5 text-sm text-[#3d4949] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                    {currentPeriodLabel}
                  </div>
                </div>
                <div className="col-span-6 flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-[#6d7979] uppercase tracking-wider">الوصف الرئيسي / Main Description</label>
                  <input
                    type="text" placeholder="تسوية المصاريف التشغيلية لشهر مايو ..."
                    value={mainDescription} onChange={(e) => setMainDescription(e.target.value)}
                    className="bg-[#f2f4f6] border-none rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#006767] outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Enterprise Accounting Grid */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-[#bcc9c8]/20">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#bcc9c8]/20 bg-[#f8f9fb]">
                <h3 className="font-bold text-sm text-[#191c1e] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006767] text-[20px]">table_rows</span>
                  تفاصيل القيد المحاسبي
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={addLine}
                    className="px-4 py-2 bg-[#006767] text-white rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-[#005252] transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    إضافة سطر جديد
                  </button>
                  <button
                    onClick={() => setLines([DEFAULT_LINE()])}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-bold text-xs flex items-center gap-1 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    حذف الكل
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-right text-xs">
                  <thead>
                    <tr className="bg-[#f2f4f6] border-b border-[#bcc9c8]/40">
                      <th className="p-4 text-[11px] text-[#6d7979] font-bold">#</th>
                      <th className="p-4 text-[11px] text-[#6d7979] font-bold">الحساب / Account</th>
                      <th className="p-4 text-[11px] text-[#6d7979] font-bold">مركز التكلفة / Cost Center</th>
                      <th className="p-4 text-[11px] text-[#6d7979] font-bold">نوع الطرف</th>
                      <th className="p-4 text-[11px] text-[#6d7979] font-bold">الطرف</th>
                      <th className="p-4 text-[11px] text-[#6d7979] font-bold">المرجع</th>
                      <th className="p-4 text-[11px] text-[#6d7979] font-bold">البيان / Description</th>
                      {isForeignCurrency && (
                        <>
                          <th className="p-4 text-[11px] text-[#006767] font-bold bg-[#006767]/5">مدين (عملة) Dr (FX)</th>
                          <th className="p-4 text-[11px] text-[#ba1a1a] font-bold bg-[#ba1a1a]/5">دائن (عملة) Cr (FX)</th>
                        </>
                      )}
                      <th className="p-4 text-[11px] text-[#006767] font-bold bg-[#006767]/5">مدين / Debit (Base)</th>
                      <th className="p-4 text-[11px] text-[#ba1a1a] font-bold bg-[#ba1a1a]/5">دائن / Credit (Base)</th>
                      <th className="p-4 text-[11px] text-[#6d7979] font-bold"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eceef0]">
                    {lines.map((line, idx) => (
                      <tr key={line.id} className="group hover:bg-[#f2f4f6]/60 transition-colors">
                        <td className="p-4 font-mono text-[#6d7979]">{idx + 1}</td>
                        {/* Account */}
                        <td className="p-2 min-w-[180px]">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center bg-[#f2f4f6] rounded px-2 gap-1">
                              <input
                                className="w-20 bg-transparent border-none py-1.5 outline-none font-mono font-bold text-xs text-[#006767]"
                                type="text" value={line.accountCode}
                                onChange={(e) => updateLineField(idx, 'accountCode', e.target.value)}
                              />
                              <span
                                onClick={() => { setActiveAccountLineIndex(idx); setShowAccountTree(true); }}
                                className="material-symbols-outlined text-[#6d7979] text-[16px] cursor-pointer hover:text-[#006767] transition-colors"
                              >search</span>
                            </div>
                            {line.accountName && (
                              <span className="text-[10px] text-[#6d7979] px-1 truncate max-w-[160px]">{line.accountName}</span>
                            )}
                          </div>
                        </td>
                        {/* Cost Center */}
                        <td className="p-2 min-w-[130px]">
                          <select
                            value={line.costCenterId}
                            onChange={(e) => updateLineField(idx, 'costCenterId', e.target.value)}
                            className="w-full bg-[#f2f4f6] border-none rounded px-2 py-1.5 outline-none text-xs"
                          >
                            <option value="">اختر المركز...</option>
                            {costCenters.map((cc: any) => (
                              <option key={cc.id} value={cc.id}>{cc.code} - {cc.name_ar}</option>
                            ))}
                          </select>
                        </td>
                        {/* Party Type */}
                        <td className="p-2 min-w-[100px]">
                          <select
                            value={line.partyType}
                            onChange={(e) => updateLineField(idx, 'partyType', e.target.value as any)}
                            className={`w-full border-none rounded px-2 py-1.5 outline-none text-xs font-semibold ${
                              line.partyType === 'customer' ? 'bg-blue-50 text-blue-700'
                                : line.partyType === 'supplier' ? 'bg-amber-50 text-amber-700'
                                : 'bg-[#f2f4f6] text-[#3d4949]'
                            }`}
                          >
                            <option value="none">—</option>
                            <option value="customer">عميل</option>
                            <option value="supplier">مورد</option>
                          </select>
                        </td>
                        {/* Party */}
                        <td className="p-2 min-w-[140px]">
                          {line.partyType === 'none' ? (
                            <span className="text-[#bcc9c8] px-2">—</span>
                          ) : (
                            <select
                              value={line.partyId}
                              onChange={(e) => updateLineField(idx, 'partyId', e.target.value)}
                              className={`w-full border-none rounded px-2 py-1.5 outline-none text-xs ${
                                !line.partyId ? 'bg-red-50 ring-1 ring-red-300 text-red-600'
                                  : line.partyType === 'customer' ? 'bg-blue-50 text-blue-800'
                                  : 'bg-amber-50 text-amber-800'
                              }`}
                            >
                              <option value="">{line.partyType === 'customer' ? 'اختر العميل...' : 'اختر المورد...'}</option>
                              {(line.partyType === 'customer' ? customers : suppliers).map((p: any) => (
                                <option key={p.id} value={p.id}>{p.code} - {p.name_ar}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        {/* Reference */}
                        <td className="p-2 min-w-[110px]">
                          <input
                            className="w-full bg-[#f2f4f6] border-none rounded px-2 py-1.5 outline-none text-xs font-mono"
                            type="text" placeholder="فاتورة/أمر شراء..."
                            value={line.referenceNumber}
                            onChange={(e) => updateLineField(idx, 'referenceNumber', e.target.value)}
                          />
                        </td>
                        {/* Description */}
                        <td className="p-2 min-w-[180px]">
                          <input
                            className="w-full bg-[#f2f4f6] border-none rounded px-2 py-1.5 outline-none text-xs"
                            type="text" placeholder="بيان السطر..."
                            value={line.description}
                            onChange={(e) => updateLineField(idx, 'description', e.target.value)}
                          />
                        </td>
                        {/* FX Columns */}
                        {isForeignCurrency && (
                          <>
                            <td className="p-2 bg-[#006767]/5 min-w-[100px]">
                              <input
                                className="w-full bg-transparent border-none text-left font-mono px-2 py-1.5 outline-none font-bold text-[#006767] text-xs"
                                placeholder="0.00" type="number" value={line.debitForeign}
                                onChange={(e) => updateLineField(idx, 'debitForeign', e.target.value)}
                              />
                            </td>
                            <td className="p-2 bg-[#ba1a1a]/5 min-w-[100px]">
                              <input
                                className="w-full bg-transparent border-none text-left font-mono px-2 py-1.5 outline-none font-bold text-[#ba1a1a] text-xs"
                                placeholder="0.00" type="number" value={line.creditForeign}
                                onChange={(e) => updateLineField(idx, 'creditForeign', e.target.value)}
                              />
                            </td>
                          </>
                        )}
                        {/* Debit Local */}
                        <td className="p-2 bg-[#006767]/5 min-w-[110px]">
                          {isForeignCurrency ? (
                            <span className="block text-left font-mono font-bold text-[#006767] px-2 py-1.5 text-xs">{line.debitLocal}</span>
                          ) : (
                            <input
                              type="number" step="0.01" placeholder="0.00" value={line.debitLocal}
                              onChange={(e) => updateLineField(idx, 'debitLocal', e.target.value)}
                              className="w-full bg-transparent border-none text-left outline-none font-mono font-bold text-[#006767] px-2 py-1.5 text-xs"
                            />
                          )}
                        </td>
                        {/* Credit Local */}
                        <td className="p-2 bg-[#ba1a1a]/5 min-w-[110px]">
                          {isForeignCurrency ? (
                            <span className="block text-left font-mono font-bold text-[#ba1a1a] px-2 py-1.5 text-xs">{line.creditLocal}</span>
                          ) : (
                            <input
                              type="number" step="0.01" placeholder="0.00" value={line.creditLocal}
                              onChange={(e) => updateLineField(idx, 'creditLocal', e.target.value)}
                              className="w-full bg-transparent border-none text-left outline-none font-mono font-bold text-[#ba1a1a] px-2 py-1.5 text-xs"
                            />
                          )}
                        </td>
                        {/* Row Actions */}
                        <td className="p-2">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => copyLine(idx)} className="p-1 text-[#6d7979] hover:text-[#006767] transition-colors" title="نسخ">
                              <span className="material-symbols-outlined text-[18px]">content_copy</span>
                            </button>
                            <button onClick={() => removeLine(idx)} className="p-1 text-[#6d7979] hover:text-[#ba1a1a] transition-colors" title="حذف">
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {/* Add row hint */}
                    <tr className="bg-[#f8f9fb]">
                      <td className="p-4 font-mono text-[#bcc9c8]">{lines.length + 1}</td>
                      <td colSpan={isForeignCurrency ? 9 : 7} className="p-4">
                        <button
                          onClick={addLine}
                          className="flex items-center gap-2 text-[#006767] hover:text-[#005252] text-xs font-semibold transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">add_circle</span>
                          إضافة سطر جديد...
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary Panel */}
            <div className="flex items-stretch gap-5">
              {/* Balance cards */}
              <div className="flex-1 grid grid-cols-3 gap-4">
                {/* Total Debit */}
                <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col items-center justify-center relative overflow-hidden border border-[#bcc9c8]/20">
                  <div className="absolute inset-0 bg-[#006767]/4"></div>
                  <span className="text-[11px] text-[#6d7979] font-bold uppercase tracking-wider relative">إجمالي المدين / Total Debit</span>
                  <span className="text-2xl font-bold font-mono text-[#006767] mt-1 relative">
                    {totals.totalDebitLocal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {/* Total Credit */}
                <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col items-center justify-center relative overflow-hidden border border-[#bcc9c8]/20">
                  <div className="absolute inset-0 bg-[#ba1a1a]/4"></div>
                  <span className="text-[11px] text-[#6d7979] font-bold uppercase tracking-wider relative">إجمالي الدائن / Total Credit</span>
                  <span className="text-2xl font-bold font-mono text-[#ba1a1a] mt-1 relative">
                    {totals.totalCreditLocal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {/* Difference */}
                <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col items-center justify-center border border-[#bcc9c8]/20">
                  <span className="text-[11px] text-[#6d7979] font-bold uppercase tracking-wider">الفارق / Difference</span>
                  <div className="flex items-center gap-2 mt-1 flex-wrap justify-center">
                    <span className="text-2xl font-bold font-mono text-[#191c1e]">
                      {Math.abs(totals.diffLocal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    {totals.isBalanced ? (
                      <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        متزن / BALANCED
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-[10px] font-bold">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        غير متزن
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Creator Card */}
              <div className="w-72 bg-white rounded-xl shadow-sm p-5 flex flex-col justify-between border border-[#bcc9c8]/20">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6d7979]">منشئ بواسطة:</span>
                    <span className="text-[#191c1e] font-bold">{user?.nameAr || 'أحمد عبد الله'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6d7979]">تاريخ الإنشاء:</span>
                    <span className="text-[#191c1e] font-mono font-bold">24/05/2024 10:20 AM</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowAuditLogs(true)}
                  className="flex items-center gap-2 text-[#006767] font-bold text-xs hover:underline mt-4"
                >
                  <span className="material-symbols-outlined text-[16px]">history</span>
                  سجل المراجعة / Audit Log
                </button>
              </div>
            </div>
          </div>

          {/* ──── Right Sidebar (Properties + Workflow + Shortcuts) ──── */}
          <aside className="w-[300px] flex flex-col gap-5 shrink-0">

            {/* Properties Panel */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-[#bcc9c8]/20">
              <h3 className="font-bold text-sm text-[#191c1e] mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006767] text-[20px]">tune</span>
                الخصائص / Properties
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'قابل للمراجعة / Reviewable', value: isReviewable, set: setIsReviewable },
                  { label: 'عكس تلقائي / Auto Reverse', value: isAutoReverse, set: setIsAutoReverse },
                  { label: 'قيد متكرر / Recurring', value: isRecurring, set: setIsRecurring },
                ].map(({ label, value, set }) => (
                  <label key={label} className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm text-[#191c1e] group-hover:text-[#006767] transition-colors">{label}</span>
                    <div
                      onClick={() => set(!value)}
                      className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${value ? 'bg-[#006767]' : 'bg-[#e6e8ea]'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                        value ? 'translate-x-5' : 'translate-x-0.5'
                      }`}></div>
                    </div>
                  </label>
                ))}
                <div className="pt-4 mt-2 border-t border-[#eceef0] flex justify-between items-center">
                  <span className="text-sm text-[#6d7979]">فروق العملة</span>
                  <span className="font-mono font-bold text-[#ba1a1a] text-sm">0.00 SAR</span>
                </div>
              </div>
            </div>

            {/* Workflow Timeline */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-[#bcc9c8]/20">
              <h3 className="font-bold text-sm text-[#191c1e] mb-5">مسار العمل / Workflow</h3>
              <div className="relative space-y-7 before:content-[''] before:absolute before:right-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[#eceef0]">
                {/* Step 1: Created */}
                <div className="relative flex items-start gap-4 pr-9">
                  <div className="absolute right-0 w-6 h-6 rounded-full bg-[#006767] flex items-center justify-center text-white z-10 shadow-sm">
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#191c1e]">تم الإنشاء / Created</span>
                    <span className="text-xs text-[#6d7979] font-mono">24/05/2024 - 10:20</span>
                  </div>
                </div>
                {/* Step 2: Pending */}
                <div className="relative flex items-start gap-4 pr-9">
                  <div className="absolute right-0 w-6 h-6 rounded-full bg-white border-2 border-[#006767] flex items-center justify-center z-10 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-[#006767] animate-pulse"></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#006767]">قيد المراجعة / Pending</span>
                    <span className="text-xs text-[#6d7979]">بانتظار المدير المالي</span>
                  </div>
                </div>
                {/* Step 3: Posted */}
                <div className="relative flex items-start gap-4 pr-9 opacity-40">
                  <div className="absolute right-0 w-6 h-6 rounded-full bg-[#e6e8ea] border-2 border-[#bcc9c8]/40 z-10"></div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#3d4949]">الترحيل / Posted</span>
                    <span className="text-xs text-[#6d7979]">بانتظار الموافقة النهائية</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="bg-[#4c56af]/5 rounded-xl p-6 border border-[#4c56af]/10">
              <h3 className="text-[11px] text-[#4c56af] font-bold uppercase tracking-widest mb-4">اختصارات لوحة المفاتيح</h3>
              <div className="space-y-3">
                {[
                  { label: 'إضافة سطر جديد', shortcut: 'Alt + N' },
                  { label: 'حفظ المسودة', shortcut: 'Ctrl + S' },
                  { label: 'ترحيل القيد', shortcut: 'Ctrl + Enter' },
                ].map(({ label, shortcut }) => (
                  <div key={label} className="flex justify-between items-center text-sm">
                    <span className="text-[#3d4949]">{label}</span>
                    <kbd className="bg-white px-2 py-1 rounded shadow-sm font-mono text-[11px] border border-[#eceef0] text-[#191c1e]">{shortcut}</kbd>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* ── Account Picker Modal (reused as-is) ── */}
        {showAccountTree && (
          <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAccountTree(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between pb-4 border-b border-[#eceef0] mb-4">
                <h3 className="font-bold text-base text-[#191c1e] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006767]">account_tree</span>
                  شجرة دليل الحسابات
                </h3>
                <button onClick={() => setShowAccountTree(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f2f4f6] text-[#6d7979] font-bold text-lg">×</button>
              </div>
              <input
                type="text" placeholder="بحث برقم الحساب أو الاسم..."
                value={searchAccountQuery} onChange={(e) => setSearchAccountQuery(e.target.value)}
                className="w-full bg-[#f2f4f6] rounded-lg px-4 py-2.5 text-sm mb-3 border-none outline-none focus:ring-2 focus:ring-[#006767]"
              />
              <div className="max-h-80 overflow-y-auto space-y-1">
                {filteredAccountsForTree.map((acc: any) => (
                  <div
                    key={acc.id}
                    onClick={() => {
                      if (activeAccountLineIndex !== null) {
                        updateLineField(activeAccountLineIndex, 'glAccountId', acc.id);
                        updateLineField(activeAccountLineIndex, 'accountCode', acc.code);
                        updateLineField(activeAccountLineIndex, 'accountName', acc.name_ar);
                      }
                      setShowAccountTree(false);
                    }}
                    className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                      acc.allow_posting
                        ? 'border-[#bcc9c8]/40 hover:bg-[#006767]/5 hover:border-[#006767]'
                        : 'border-transparent bg-[#f2f4f6] opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-[#006767]">{acc.code}</span>
                      <span className="text-sm font-semibold text-[#191c1e]">{acc.name_ar}</span>
                    </div>
                    {!acc.allow_posting && (
                      <span className="text-[10px] text-[#6d7979] bg-[#eceef0] px-2 py-0.5 rounded">رئيسي</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Audit Logs Modal ── */}
        {showAuditLogs && (
          <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAuditLogs(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between pb-4 border-b border-[#eceef0] mb-4">
                <h3 className="font-bold text-base text-[#191c1e] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006767]">history</span>
                  سجل التعديلات والعمليات (Audit Log)
                </h3>
                <button onClick={() => setShowAuditLogs(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f2f4f6] text-[#6d7979] font-bold text-lg">×</button>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto text-xs">
                <div className="p-3 bg-[#f2f4f6] rounded-lg space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-[#006767]">إنشاء قيد يومية</span>
                    <span className="text-[#6d7979] font-mono">2024-05-22 10:14</span>
                  </div>
                  <div className="text-[#3d4949]">تم إنشاء المسودة بواسطة أحمد العتيبي</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Attachments Modal ── */}
        {showAttachments && (
          <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAttachments(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between pb-4 border-b border-[#eceef0] mb-4">
                <h3 className="font-bold text-base text-[#191c1e] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006767]">attach_file</span>
                  إرفاق مستندات
                </h3>
                <button onClick={() => setShowAttachments(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f2f4f6] text-[#6d7979] font-bold text-lg">×</button>
              </div>
              <div className="py-6 text-center">
                <div className="border-2 border-dashed border-[#bcc9c8] rounded-xl p-8 bg-[#f2f4f6] hover:border-[#006767] transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-5xl text-[#6d7979] block mb-3">cloud_upload</span>
                  <p className="text-sm font-semibold text-[#191c1e]">اضغط هنا أو اسحب الملفات للإرفاق</p>
                  <p className="text-xs text-[#6d7979] mt-1">PDF, PNG, JPG (حتى 10MB)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Journal List Modal ── */}
        {showJournalList && (
          <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowJournalList(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between pb-3 border-b border-[#eceef0]">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#006767] text-2xl">list_alt</span>
                  <h3 className="font-bold text-lg text-[#191c1e]">سجل القيود اليومية</h3>
                  <span className="bg-[#006767]/10 text-[#006767] px-3 py-0.5 rounded-full text-xs font-bold font-mono">
                    {allJournalEntries.length} قيد
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { handleNewEntry(); setShowJournalList(false); }}
                    className="px-4 py-1.5 bg-[#006767] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-[#005252]"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    قيد جديد
                  </button>
                  <button onClick={() => setShowJournalList(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f2f4f6] text-[#6d7979] font-bold text-xl">×</button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 bg-[#f2f4f6] p-3 rounded-lg">
                <input
                  type="text" placeholder="بحث برقم القيد أو البيان أو المرجع..."
                  value={searchJournalListQuery} onChange={(e) => setSearchJournalListQuery(e.target.value)}
                  className="flex-1 bg-white border border-[#bcc9c8]/40 rounded-lg px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-[#006767]"
                />
                <select
                  value={journalListStatusFilter} onChange={(e) => setJournalListStatusFilter(e.target.value)}
                  className="bg-white border border-[#bcc9c8]/40 rounded-lg px-3 py-2 text-xs outline-none"
                >
                  <option value="">جميع الحالات</option>
                  <option value="Posted">مرحّل</option>
                  <option value="Approved">معتمد</option>
                  <option value="Draft">مسودة</option>
                  <option value="Void">ملغي</option>
                </select>
              </div>
              <div className="max-h-96 overflow-y-auto border border-[#eceef0] rounded-xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#f2f4f6] text-[#3d4949] border-b border-[#eceef0] font-semibold sticky top-0">
                    <tr>
                      <th className="p-3">رقم القيد</th>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">البيان</th>
                      <th className="p-3">النوع</th>
                      <th className="p-3">إجمالي القيد</th>
                      <th className="p-3 text-center">الحالة</th>
                      <th className="p-3 text-center">فتح</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eceef0]">
                    {allJournalEntries
                      .filter((e: any) => {
                        const q = searchJournalListQuery;
                        const matchQ = !q || e.entry_number?.includes(q) || e.description?.includes(q) || e.reference_no?.includes(q);
                        const matchS = !journalListStatusFilter || e.status === journalListStatusFilter;
                        return matchQ && matchS;
                      })
                      .map((entry: any) => (
                        <tr
                          key={entry.id}
                          className={`hover:bg-[#006767]/5 transition-colors cursor-pointer ${activeEntryId === entry.id ? 'bg-[#006767]/10 font-semibold' : ''}`}
                          onClick={() => { setActiveEntryId(entry.id); setShowJournalList(false); }}
                        >
                          <td className="p-3 font-mono font-bold text-[#006767]">{entry.entry_number}</td>
                          <td className="p-3 font-mono">{entry.entry_date?.split('T')[0]}</td>
                          <td className="p-3 max-w-xs truncate">{entry.description || '—'}</td>
                          <td className="p-3 text-[#6d7979]">{entry.reference_type || 'GeneralJournal'}</td>
                          <td className="p-3 font-mono font-bold">
                            {parseFloat(entry.total_debit || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              entry.status === 'Posted' ? 'bg-emerald-100 text-emerald-800'
                                : entry.status === 'Approved' ? 'bg-blue-100 text-blue-800'
                                : entry.status === 'Void' ? 'bg-red-100 text-red-700'
                                : 'bg-[#e0e3e5] text-[#3d4949]'
                            }`}>
                              {entry.status === 'Posted' ? 'مرحّل' : entry.status === 'Approved' ? 'معتمد' : entry.status === 'Void' ? 'ملغي' : 'مسودة'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={(evt) => { evt.stopPropagation(); setActiveEntryId(entry.id); setShowJournalList(false); }}
                              className="px-3 py-1 bg-[#006767] text-white rounded-lg text-[11px] font-bold hover:bg-[#005252] transition-colors"
                            >
                              فتح
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col h-screen overflow-hidden bg-surface font-sans text-on-surface fade-in">
      {/* ── Top Bar: Sticky full-width header (Exact Match screen.png) ─────── */}
      <header className="flex-none bg-white border-b border-[#bcc9c8]/30 px-6 py-3 flex items-center justify-between z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f2f4f6] transition-colors text-[#3d4949]"
            title="إغلاق"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-[#191c1e] tracking-tight">
                General Journal Entry | القيود اليومية العامة
              </h1>
              <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase ${
                status === 'Posted'
                  ? 'bg-[#d1fae5] text-[#065f46]'
                  : status === 'Approved'
                  ? 'bg-[#dbeafe] text-[#1e40af]'
                  : status === 'Void'
                  ? 'bg-[#fee2e2] text-[#991b1b]'
                  : 'bg-[#eceef0] text-[#3d4949]'
              }`}>
                {status.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#6d7979]">
              <span className="font-mono font-bold text-[#006767]">#{entryNumber}</span>
              <span>•</span>
              <span>آخر تعديل: منذ دقيقتين</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Main Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewEntry}
              className="px-3.5 py-2 bg-[#006767]/10 text-[#006767] hover:bg-[#006767]/20 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              قيد جديد
            </button>

            <button
              onClick={() => setShowJournalList(true)}
              className="px-3.5 py-2 bg-[#f2f4f6] hover:bg-[#e6e8ea] text-[#191c1e] rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all border border-[#bcc9c8]/30"
            >
              <span className="material-symbols-outlined text-[18px]">list_alt</span>
              سجل القيود ({allJournalEntries.length})
            </button>

            <div className="w-[1px] h-6 bg-[#bcc9c8]/40 mx-1"></div>

            <button
              disabled={saveMutation.isPending || statusActionMutation.isPending || status === 'Posted'}
              onClick={() => {
                if (activeEntryId && status !== 'Posted') {
                  statusActionMutation.mutate('Post');
                } else {
                  saveMutation.mutate('Posted');
                }
              }}
              className="px-5 py-2 bg-[#006767] text-white rounded-lg font-bold text-xs hover:bg-[#005252] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Approve & Post / اعتماد وترحيل
            </button>

            <button
              disabled={saveMutation.isPending || statusActionMutation.isPending}
              onClick={() => saveMutation.mutate('Draft')}
              className="px-5 py-2 border border-[#006767] text-[#006767] hover:bg-[#006767]/5 rounded-lg font-bold text-xs transition-all"
            >
              Review / مراجعة
            </button>
          </div>

          <div className="w-[1px] h-8 bg-[#bcc9c8]/40"></div>

          {/* Icon Bar Group Box (Matches screen.png) */}
          <div className="flex items-center bg-[#f2f4f6] rounded-lg p-1 gap-1 border border-[#bcc9c8]/30">
            <button
              onClick={() => setShowAttachments(true)}
              className="p-1.5 text-[#3d4949] hover:text-[#006767] transition-colors rounded hover:bg-white"
              title="مرفقات / Attachments"
            >
              <span className="material-symbols-outlined text-[18px]">attach_file</span>
            </button>
            <button
              onClick={() => window.print()}
              className="p-1.5 text-[#3d4949] hover:text-[#006767] transition-colors rounded hover:bg-white"
              title="طباعة / Print"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
            </button>
            <button
              onClick={addLine}
              className="p-1.5 text-[#3d4949] hover:text-[#006767] transition-colors rounded hover:bg-white"
              title="إضافة سطر / Add Row"
            >
              <span className="material-symbols-outlined text-[18px]">add_box</span>
            </button>
            <button
              onClick={() => saveMutation.mutate('Draft')}
              disabled={saveMutation.isPending}
              className="p-1.5 text-[#3d4949] hover:text-[#006767] transition-colors rounded hover:bg-white"
              title="حفظ مسودة / Save Draft"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
            </button>
          </div>
        </div>
      </header>

      {/* Alert Banners */}
      {errorMessage && (
        <div className="bg-error-container text-on-error-container px-6 py-2 flex items-center justify-between text-xs font-medium border-b border-error/20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="font-bold text-sm">×</button>
        </div>
      )}

      {successMessage && (
        <div className="bg-primary-container text-on-primary-container px-6 py-2 flex items-center justify-between text-xs font-medium border-b border-primary/20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="font-bold text-sm">×</button>
        </div>
      )}

      {/* ── Flex Body Container ──────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface">
          {/* Header Card: 4-column grid (Exact Match screen.png) */}
          <section className="bg-white rounded-xl p-6 shadow-sm border border-[#bcc9c8]/30">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#6d7979] block tracking-wide uppercase">BRANCH / الفرع</label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full bg-[#f2f4f6] border-none rounded-lg px-4 py-2.5 text-xs font-semibold text-[#191c1e] focus:ring-2 focus:ring-[#006767] outline-none"
                >
                  <option value="">اختر الفرع...</option>
                  {branches.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name_ar || b.code}
                    </option>
                  ))}
                  {branches.length === 0 && <option value="default">الفرع الرئيسي - الرياض</option>}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#6d7979] block tracking-wide uppercase">DOCUMENT TYPE / نوع المستند</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full bg-[#f2f4f6] border-none rounded-lg px-4 py-2.5 text-xs font-semibold text-[#191c1e] focus:ring-2 focus:ring-[#006767] outline-none"
                >
                  <option value="قيد عام / General">قيد عام / General</option>
                  <option value="قيد يومية عام">قيد يومية عام</option>
                  <option value="تسوية جردية">تسوية جردية</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#6d7979] block tracking-wide uppercase">REFERENCE NO / رقم المرجع</label>
                <input
                  className="w-full bg-[#f2f4f6] border-none rounded-lg px-4 py-2.5 text-xs font-mono font-semibold text-[#191c1e] focus:ring-2 focus:ring-[#006767] outline-none"
                  placeholder="REF-00921"
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#6d7979] block tracking-wide uppercase">ENTRY DATE / تاريخ القيد</label>
                <input
                  className="w-full bg-[#f2f4f6] border-none rounded-lg px-4 py-2.5 text-xs font-semibold text-[#191c1e] focus:ring-2 focus:ring-[#006767] outline-none"
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] font-bold text-[#6d7979] block tracking-wide uppercase">MAIN DESCRIPTION / الوصف الرئيسي</label>
                <input
                  className="w-full bg-[#f2f4f6] border-none rounded-lg px-4 py-2.5 text-xs font-semibold text-[#191c1e] focus:ring-2 focus:ring-[#006767] outline-none"
                  placeholder="تسوية المصاريف التشغيلية لشهر مايو..."
                  type="text"
                  value={mainDescription}
                  onChange={(e) => setMainDescription(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#6d7979] block tracking-wide uppercase">PERIOD / الفترة المالية</label>
                <div className="flex gap-2">
                  <input
                    className="w-1/3 bg-[#e6e8ea] border-none rounded-lg px-3 py-2.5 text-xs font-mono text-[#6d7979]"
                    readOnly
                    type="text"
                    value={fiscalYear}
                  />
                  <select
                    value={periodId}
                    onChange={(e) => setPeriodId(e.target.value)}
                    className="w-2/3 bg-[#f2f4f6] border-none rounded-lg px-4 py-2.5 text-xs font-semibold text-[#191c1e] focus:ring-2 focus:ring-[#006767] outline-none"
                  >
                    <option value="">MAY-2024</option>
                    {periods.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#6d7979] block tracking-wide uppercase">RATE / سعر الصرف</label>
                  <input
                    className="w-full bg-[#f2f4f6] border-none rounded-lg px-3 py-2.5 text-xs font-mono font-bold text-[#191c1e] focus:ring-2 focus:ring-[#006767] outline-none"
                    step="0.00001"
                    type="number"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#6d7979] block tracking-wide uppercase">CURRENCY / العملة</label>
                  <select
                    value={currencyId}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    className="w-full bg-[#f2f4f6] border-none rounded-lg px-3 py-2.5 text-xs font-semibold text-[#191c1e] focus:ring-2 focus:ring-[#006767] outline-none"
                  >
                    {currencies.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.code}
                      </option>
                    ))}
                    {currencies.length === 0 && (
                      <>
                        <option value="USD">United States Dollar</option>
                        <option value="SAR">Saudi Riyal (SAR)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Accounting Grid Section */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30">
              <h3 className="font-headline-sm text-on-surface text-base font-bold">تفاصيل القيد المحاسبي</h3>
              <div className="flex gap-2">
                <button
                  onClick={addLine}
                  className="px-4 py-2 bg-primary text-on-primary rounded-lg font-bold text-label-md flex items-center gap-2 hover:brightness-110 transition-all text-xs"
                >
                  <span className="material-symbols-outlined text-[20px]">add_circle</span>
                  إضافة سطر جديد
                </button>
                <button
                  onClick={() => setLines([DEFAULT_LINE()])}
                  className="px-4 py-2 text-error hover:bg-error/5 rounded-lg font-bold text-label-md flex items-center gap-1 transition-all text-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  حذف المحدد
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-right text-xs">
                <thead className="bg-[#f8f9fb] text-[#3d4949] border-b border-[#bcc9c8]/40 text-xs">
                  <tr>
                    <th className="p-3 text-center w-12 font-bold">#</th>
                    <th className="p-3 w-36 font-bold">الحساب / Account</th>
                    <th className="p-3 w-36 font-bold">مركز التكلفة / Cost Center</th>
                    <th className="p-3 w-32 font-bold">نوع الطرف</th>
                    <th className="p-3 w-44 font-bold">الطرف (عميل/مورد)</th>
                    <th className="p-3 w-32 font-bold">رقم المرجع</th>
                    <th className="p-3 w-56 font-bold">البيان / Description</th>
                    <th className="p-3 w-28 font-bold text-center">مدين (عملة) / Dr (FX)</th>
                    <th className="p-3 w-28 font-bold text-center">دائن (عملة) / Cr (FX)</th>
                    <th className="p-3 w-36 font-bold text-center bg-[#e6f4f4] text-[#006767]">مدين (Base) / Debit (Base)</th>
                    <th className="p-3 w-36 font-bold text-center bg-[#fef2f2] text-[#ba1a1a]">دائن (Base) / Credit (Base)</th>
                    <th className="p-3 w-16 text-center font-bold">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {lines.map((line, idx) => (
                    <tr key={line.id} className="group hover:bg-surface-container-low/30 transition-colors">
                      <td className="p-3 text-center text-body-md text-outline font-numeric-data font-mono">{idx + 1}</td>
                      <td className="p-2">
                        <div className="flex items-center bg-[#f2f4f6] rounded px-2">
                          <input
                            className="w-full bg-transparent border-none py-1.5 text-body-md outline-none font-numeric-data font-mono text-xs"
                            type="text"
                            value={line.accountCode}
                            onChange={(e) => updateLineField(idx, 'accountCode', e.target.value)}
                          />
                          <span
                            onClick={() => {
                              setActiveAccountLineIndex(idx);
                              setShowAccountTree(true);
                            }}
                            className="material-symbols-outlined text-outline text-[18px] cursor-pointer hover:text-primary"
                          >
                            search
                          </span>
                        </div>
                      </td>
                      <td className="p-2">
                        <input
                          className="w-full bg-transparent border-none text-body-md font-bold outline-none text-on-surface text-xs"
                          readOnly
                          value={line.accountName}
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={line.costCenterId}
                          onChange={(e) => updateLineField(idx, 'costCenterId', e.target.value)}
                          className="w-full bg-[#f2f4f6] border-none rounded px-2 py-1.5 text-body-md outline-none text-xs"
                        >
                          <option value="">اختر المركز...</option>
                          {costCenters.map((cc: any) => (
                            <option key={cc.id} value={cc.id}>
                              {cc.code} - {cc.name_ar}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Party Type column */}
                      <td className="p-2">
                        <select
                          value={line.partyType}
                          onChange={(e) => updateLineField(idx, 'partyType', e.target.value as any)}
                          className={`w-full border-none rounded px-2 py-1.5 text-body-md outline-none text-xs font-semibold ${
                            line.partyType === 'customer'
                              ? 'bg-blue-50 text-blue-700'
                              : line.partyType === 'supplier'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-[#f2f4f6] text-on-surface-variant'
                          }`}
                        >
                          <option value="none">—</option>
                          <option value="customer">عميل</option>
                          <option value="supplier">مورد</option>
                        </select>
                      </td>

                      {/* Party autocomplete column */}
                      <td className="p-2">
                        {line.partyType === 'none' ? (
                          <span className="text-xs text-outline px-2">—</span>
                        ) : (
                          <div className="relative">
                            <select
                              value={line.partyId}
                              onChange={(e) => updateLineField(idx, 'partyId', e.target.value)}
                              className={`w-full border-none rounded px-2 py-1.5 text-body-md outline-none text-xs ${
                                !line.partyId
                                  ? 'bg-error/10 ring-1 ring-error/40 text-error'
                                  : line.partyType === 'customer'
                                  ? 'bg-blue-50 text-blue-800'
                                  : 'bg-amber-50 text-amber-800'
                              }`}
                            >
                              <option value="">
                                {line.partyType === 'customer' ? 'اختر العميل...' : 'اختر المورد...'}
                              </option>
                              {line.partyType === 'customer'
                                ? customers
                                    .filter((c: any) => {
                                      const q = partySearchQueries[line.id] || '';
                                      if (!q) return true;
                                      return (c.name_ar || '').includes(q) || (c.code || '').includes(q);
                                    })
                                    .map((c: any) => (
                                      <option key={c.id} value={c.id}>
                                        {c.code} - {c.name_ar}
                                      </option>
                                    ))
                                : suppliers
                                    .filter((s: any) => {
                                      const q = partySearchQueries[line.id] || '';
                                      if (!q) return true;
                                      return (s.name_ar || '').includes(q) || (s.code || '').includes(q);
                                    })
                                    .map((s: any) => (
                                      <option key={s.id} value={s.id}>
                                        {s.code} - {s.name_ar}
                                      </option>
                                    ))}
                            </select>
                          </div>
                        )}
                      </td>

                      {/* Reference Number column */}
                      <td className="p-2">
                        <input
                          className="w-full bg-[#f2f4f6] border-none rounded px-2 py-1.5 text-body-md outline-none text-xs font-mono"
                          type="text"
                          placeholder="فاتورة/أمر شراء..."
                          value={line.referenceNumber}
                          onChange={(e) => updateLineField(idx, 'referenceNumber', e.target.value)}
                        />
                      </td>

                      <td className="p-2">
                        <input
                          className="w-full bg-[#f2f4f6] border-none rounded px-2 py-1.5 text-body-md outline-none text-xs"
                          type="text"
                          value={line.description}
                          onChange={(e) => updateLineField(idx, 'description', e.target.value)}
                        />
                      </td>

                      {isForeignCurrency && (
                        <>
                          <td className="foreign-col p-2 bg-primary/5">
                            <input
                              className="w-full bg-transparent border-none text-left font-numeric-data font-mono px-2 py-1.5 outline-none font-bold text-primary"
                              placeholder="0.00"
                              type="number"
                              value={line.debitForeign}
                              onChange={(e) => updateLineField(idx, 'debitForeign', e.target.value)}
                            />
                          </td>
                          <td className="foreign-col p-2 bg-primary/5">
                            <input
                              className="w-full bg-transparent border-none text-left font-numeric-data font-mono px-2 py-1.5 outline-none font-bold text-error"
                              placeholder="0.00"
                              type="number"
                              value={line.creditForeign}
                              onChange={(e) => updateLineField(idx, 'creditForeign', e.target.value)}
                            />
                          </td>
                        </>
                      )}

                      <td className="p-2 text-left font-numeric-data font-mono text-primary font-bold px-4 text-xs">
                        {isForeignCurrency ? (
                          line.debitLocal
                        ) : (
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={line.debitLocal}
                            onChange={(e) => updateLineField(idx, 'debitLocal', e.target.value)}
                            className="w-full bg-transparent border-none text-left outline-none font-mono font-bold text-primary"
                          />
                        )}
                      </td>
                      <td className="p-2 text-left font-numeric-data font-mono text-error font-bold px-4 text-xs">
                        {isForeignCurrency ? (
                          line.creditLocal
                        ) : (
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={line.creditLocal}
                            onChange={(e) => updateLineField(idx, 'creditLocal', e.target.value)}
                            className="w-full bg-transparent border-none text-left outline-none font-mono font-bold text-error"
                          />
                        )}
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => copyLine(idx)}
                            className="text-outline hover:text-primary transition-colors"
                            title="نسخ"
                          >
                            <span className="material-symbols-outlined text-[18px]">content_copy</span>
                          </button>
                          <button
                            onClick={() => removeLine(idx)}
                            className="text-outline hover:text-error transition-colors"
                            title="حذف"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Footer Panel: 4 Cards (Matches screen.png) */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-6">
            {/* Card 1: Total Debit */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-[#bcc9c8]/30 flex flex-col justify-between">
              <span className="text-xs text-[#6d7979] font-bold">Total Debit / إجمالي المدين</span>
              <span className="text-2xl font-bold font-mono text-[#006767] mt-2">
                {totals.totalDebitLocal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Card 2: Total Credit */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-[#bcc9c8]/30 flex flex-col justify-between">
              <span className="text-xs text-[#6d7979] font-bold">Total Credit / إجمالي الدائن</span>
              <span className="text-2xl font-bold font-mono text-[#ba1a1a] mt-2">
                {totals.totalCreditLocal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Card 3: Difference & Balance Status */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-[#bcc9c8]/30 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-[#6d7979] font-bold">Difference / الفارق</span>
                <span className="text-2xl font-bold font-mono text-[#191c1e] mt-1">
                  {Math.abs(totals.diffLocal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {totals.isBalanced ? (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0] rounded-full text-xs font-bold">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>متوازن / BALANCED</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#fee2e2] text-[#991b1b] border border-[#fca5a5] rounded-full text-xs font-bold">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>غير متوازن</span>
                </div>
              )}
            </div>

            {/* Card 4: Creator Info & Audit Log */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-[#bcc9c8]/30 flex flex-col justify-between text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#6d7979]">منشئ بواسطة:</span>
                  <span className="font-bold text-[#191c1e]">{user?.nameAr || 'أحمد عبد الله'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6d7979]">تاريخ الإنشاء:</span>
                  <span className="font-mono text-[#191c1e]">AM 10:20 24/05/2024</span>
                </div>
              </div>
              <div className="pt-2 border-t border-[#bcc9c8]/20 flex justify-end">
                <button
                  onClick={() => setShowAuditLogs(true)}
                  className="flex items-center gap-1 text-[#006767] font-bold hover:underline"
                >
                  <span className="material-symbols-outlined text-[16px]">history</span>
                  <span>Audit Log / سجل المراجعة</span>
                </button>
              </div>
            </div>
          </section>
        </main>

        {/* Right Sidebar: Fixed 320px (Exact Match screen.png) */}
        <aside className="w-[320px] bg-[#f8f9fb] border-r border-[#bcc9c8]/30 p-6 space-y-6 flex flex-col overflow-y-auto">
          {/* Card 1: Properties / الخصائص */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-[#bcc9c8]/30 space-y-4">
            <h4 className="text-xs font-bold text-[#191c1e] flex items-center justify-between border-b border-[#bcc9c8]/20 pb-2">
              <span>Properties / الخصائص</span>
              <span className="material-symbols-outlined text-[#006767]">tune</span>
            </h4>
            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[#3d4949] font-medium">Reviewable / قابل للمراجعة</span>
                <input
                  checked={isReviewable}
                  onChange={(e) => setIsReviewable(e.target.checked)}
                  className="w-4 h-4 accent-[#006767] rounded cursor-pointer"
                  type="checkbox"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[#3d4949] font-medium">Auto Reverse / عكس تلقائي</span>
                <input
                  checked={isAutoReverse}
                  onChange={(e) => setIsAutoReverse(e.target.checked)}
                  className="w-4 h-4 accent-[#006767] rounded cursor-pointer"
                  type="checkbox"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[#3d4949] font-medium">Recurring / قيد متكرر</span>
                <input
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 accent-[#006767] rounded cursor-pointer"
                  type="checkbox"
                />
              </label>
              <div className="pt-2 border-t border-[#bcc9c8]/20 flex justify-between items-center text-xs">
                <span className="text-[#6d7979]">فروق العملة</span>
                <span className="font-mono font-bold text-[#006767]">SAR 0.00</span>
              </div>
            </div>
          </div>

          {/* Card 2: Workflow / مسار العمل */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-[#bcc9c8]/30 flex-1 space-y-4">
            <h4 className="text-xs font-bold text-[#191c1e] border-b border-[#bcc9c8]/20 pb-2">
              Workflow / مسار العمل
            </h4>
            <div className="relative pr-6 space-y-8">
              <div className="absolute right-7 top-2 bottom-2 w-0.5 bg-[#bcc9c8]/40"></div>

              {/* Step 1 */}
              <div className="relative flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#006767] text-white flex items-center justify-center z-10 mt-0.5 shadow-sm">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </div>
                <div className="flex flex-col text-xs">
                  <span className="font-bold text-[#006767]">تم الإنشاء / Created</span>
                  <span className="text-[10px] text-[#6d7979] font-mono">10:20 - 24/05/2024</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-white border-2 border-[#006767] text-[#006767] flex items-center justify-center z-10 mt-0.5 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-[#006767]"></div>
                </div>
                <div className="flex flex-col text-xs">
                  <span className="font-bold text-[#006767]">قيد المراجعة / Pending</span>
                  <span className="text-[10px] text-[#6d7979]">بانتظار المدير المالي</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#e6e8ea] border-2 border-[#bcc9c8]/40 text-[#6d7979] flex items-center justify-center z-10 mt-0.5"></div>
                <div className="flex flex-col text-xs opacity-60">
                  <span className="font-bold text-[#3d4949]">الترحيل / Posted</span>
                  <span className="text-[10px] text-[#6d7979]">بانتظار الموافقة النهائية</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Keyboard Shortcuts / اختصارات لوحة المفاتيح */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-[#bcc9c8]/30 space-y-3">
            <h4 className="text-xs font-bold text-[#191c1e] border-b border-[#bcc9c8]/20 pb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#006767]">keyboard</span>
              <span>اختصارات لوحة المفاتيح</span>
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-[#3d4949]">
                <span>إضافة سطر جديد</span>
                <kbd className="bg-[#f2f4f6] border border-[#bcc9c8]/40 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                  Alt + N
                </kbd>
              </div>
              <div className="flex justify-between items-center text-[#3d4949]">
                <span>حفظ المسودة</span>
                <kbd className="bg-[#f2f4f6] border border-[#bcc9c8]/40 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                  Ctrl + S
                </kbd>
              </div>
              <div className="flex justify-between items-center text-[#3d4949]">
                <span>ترحيل القيد</span>
                <kbd className="bg-[#f2f4f6] border border-[#bcc9c8]/40 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                  Ctrl + Enter
                </kbd>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Account Picker Modal */}
      {showAccountTree && (
        <div className="modal-overlay">
          <div className="modal-box max-w-xl bg-white rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
              <h3 className="font-bold text-base text-on-surface">شجرة دليل الحسابات</h3>
              <button onClick={() => setShowAccountTree(false)} className="text-outline hover:text-on-surface font-bold text-lg">×</button>
            </div>
            <div className="py-3">
              <input
                type="text"
                placeholder="بحث برقم الحساب أو الاسم..."
                value={searchAccountQuery}
                onChange={(e) => setSearchAccountQuery(e.target.value)}
                className="w-full bg-[#f2f4f6] rounded-lg px-4 py-2 text-xs mb-3 border-none outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="max-h-80 overflow-y-auto space-y-1">
                {filteredAccountsForTree.map((acc: any) => (
                  <div
                    key={acc.id}
                    onClick={() => {
                      if (activeAccountLineIndex !== null) {
                        updateLineField(activeAccountLineIndex, 'glAccountId', acc.id);
                        updateLineField(activeAccountLineIndex, 'accountCode', acc.code);
                        updateLineField(activeAccountLineIndex, 'accountName', acc.name_ar);
                      }
                      setShowAccountTree(false);
                    }}
                    className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                      acc.allow_posting
                        ? 'border-outline-variant/40 hover:bg-primary/5 hover:border-primary'
                        : 'border-transparent bg-[#f2f4f6] opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-primary">{acc.code}</span>
                      <span className="text-xs font-semibold text-on-surface">{acc.name_ar}</span>
                    </div>
                    {!acc.allow_posting && (
                      <span className="text-[10px] text-outline bg-surface-container px-2 py-0.5 rounded">رئيسي</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Modal */}
      {showAuditLogs && (
        <div className="modal-overlay">
          <div className="modal-box max-w-xl bg-white rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
              <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history</span>
                سجل التعديلات والعمليات (Audit Log)
              </h3>
              <button onClick={() => setShowAuditLogs(false)} className="text-outline hover:text-on-surface font-bold text-lg">×</button>
            </div>
            <div className="py-4 space-y-3 max-h-80 overflow-y-auto text-xs">
              <div className="p-3 bg-[#f2f4f6] rounded-lg space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-primary">إنشاء قيد يومية</span>
                  <span className="text-outline font-mono">2024-05-22 10:14</span>
                </div>
                <div className="text-on-surface-variant">تم إنشاء المسودة بواسطة أحمد العتيبي</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attachments Modal */}
      {showAttachments && (
        <div className="modal-overlay">
          <div className="modal-box max-w-md bg-white rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
              <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">attach_file</span>
                إرفاق مستندات
              </h3>
              <button onClick={() => setShowAttachments(false)} className="text-outline hover:text-on-surface font-bold text-lg">×</button>
            </div>
            <div className="py-6 text-center space-y-4">
              <div className="border-2 border-dashed border-outline-variant rounded-xl p-6 bg-[#f2f4f6] hover:border-primary transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">cloud_upload</span>
                <p className="text-xs font-semibold text-on-surface">اضغط هنا أو اسحب الملفات للإرفاق</p>
                <p className="text-[10px] text-outline mt-1">PDF, PNG, JPG (حتى 10MB)</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Journal Entries List Modal */}
      {showJournalList && (
        <div className="modal-overlay">
          <div className="modal-box max-w-4xl bg-white rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-2xl">list_alt</span>
                <h3 className="font-bold text-lg text-on-surface">سجل القيود اليومية</h3>
                <span className="bg-primary/10 text-primary px-3 py-0.5 rounded-full text-xs font-bold font-mono">
                  {allJournalEntries.length} قيد
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    handleNewEntry();
                    setShowJournalList(false);
                  }}
                  className="px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-primary/90"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  قيد جديد
                </button>
                <button onClick={() => setShowJournalList(false)} className="text-outline hover:text-on-surface font-bold text-xl">×</button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#f2f4f6] p-3 rounded-lg">
              <input
                type="text"
                placeholder="بحث برقم القيد أو البيان أو المرجع..."
                value={searchJournalListQuery}
                onChange={(e) => setSearchJournalListQuery(e.target.value)}
                className="flex-1 bg-white border border-outline-variant/40 rounded-lg px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-primary"
              />
              <select
                value={journalListStatusFilter}
                onChange={(e) => setJournalListStatusFilter(e.target.value)}
                className="bg-white border border-outline-variant/40 rounded-lg px-3 py-2 text-xs outline-none"
              >
                <option value="">جميع الحالات</option>
                <option value="Posted">مرحّل</option>
                <option value="Approved">معتمد</option>
                <option value="Draft">مسودة</option>
                <option value="Void">ملغي</option>
              </select>
            </div>

            {/* Table */}
            <div className="max-h-96 overflow-y-auto border border-outline-variant/30 rounded-lg">
              <table className="w-full text-right text-xs">
                <thead className="bg-surface-container-low text-on-surface-variant border-b font-semibold">
                  <tr>
                    <th className="p-3">رقم القيد</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">البيان</th>
                    <th className="p-3">النوع</th>
                    <th className="p-3">إجمالي القيد</th>
                    <th className="p-3 text-center">الحالة</th>
                    <th className="p-3 text-center">اختيار</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {allJournalEntries
                    .filter((e: any) => {
                      const matchQ = !searchJournalListQuery ||
                        e.entry_number?.includes(searchJournalListQuery) ||
                        e.description?.includes(searchJournalListQuery) ||
                        e.reference_no?.includes(searchJournalListQuery);
                      const matchS = !journalListStatusFilter || e.status === journalListStatusFilter;
                      return matchQ && matchS;
                    })
                    .map((entry: any) => (
                      <tr
                        key={entry.id}
                        className={`hover:bg-primary/5 transition-colors cursor-pointer ${
                          activeEntryId === entry.id ? 'bg-primary/10 font-semibold' : ''
                        }`}
                        onClick={() => {
                          setActiveEntryId(entry.id);
                          setShowJournalList(false);
                        }}
                      >
                        <td className="p-3 font-mono font-bold text-primary">{entry.entry_number}</td>
                        <td className="p-3 font-mono">{entry.entry_date?.split('T')[0]}</td>
                        <td className="p-3 max-w-xs truncate">{entry.description || '—'}</td>
                        <td className="p-3 text-outline">{entry.reference_type || 'GeneralJournal'}</td>
                        <td className="p-3 font-mono font-bold">
                          {parseFloat(entry.total_debit || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              entry.status === 'Posted'
                                ? 'bg-green-100 text-green-800'
                                : entry.status === 'Approved'
                                ? 'bg-blue-100 text-blue-800'
                                : entry.status === 'Void'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {entry.status === 'Posted' ? 'مرحّل' : entry.status === 'Approved' ? 'معتمد' : entry.status === 'Void' ? 'ملغي' : 'مسودة'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={(evt) => {
                              evt.stopPropagation();
                              setActiveEntryId(entry.id);
                              setShowJournalList(false);
                            }}
                            className="px-3 py-1 bg-primary text-white rounded text-[11px] font-bold hover:brightness-110"
                          >
                            فتح
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
