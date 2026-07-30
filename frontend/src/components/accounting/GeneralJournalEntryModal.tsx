import React, { useState, useEffect, useMemo } from 'react';
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
}: GeneralJournalEntryModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Header State
  const [branchId, setBranchId] = useState<string>('');
  const [periodId, setPeriodId] = useState<string>('');
  const [fiscalYear, setFiscalYear] = useState<string>(new Date().getFullYear().toString());
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
  const [recurringFrequency, setRecurringFrequency] = useState<string>('Monthly');
  const [isCurrencyVariance, setIsCurrencyVariance] = useState<boolean>(false);

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
    const code = (acc.code || '').toString();
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

  return (
    <div className="fixed inset-0 z-50 flex flex-col h-screen overflow-hidden bg-surface font-sans text-on-surface fade-in">
      {/* ── Top Bar: Sticky full-width header (Exact Match with code.html) ─────── */}
      <header className="flex-none bg-surface-container-lowest border-b border-outline-variant px-6 py-3 flex items-center justify-between z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
            title="إغلاق"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="font-headline-md text-on-surface text-xl font-bold">القيود اليومية العامة</h1>
              <span className={`px-3 py-1 rounded-full text-label-md font-bold text-xs border ${
                status === 'Posted'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : status === 'Approved'
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : status === 'Void'
                  ? 'bg-red-100 text-red-800 border-red-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {status === 'Posted' ? 'مرحّل' : status === 'Approved' ? 'معتمد' : status === 'Void' ? 'ملغي' : 'مسودة'}
              </span>
            </div>
            <span className="text-label-md text-outline text-xs">Journal Entry: #{entryNumber}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Main Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewEntry}
              className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              قيد جديد
            </button>
            <button
              onClick={() => setShowJournalList(true)}
              className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">list_alt</span>
              سجل القيود ({allJournalEntries.length})
            </button>

            <div className="w-[1px] h-6 bg-outline-variant mx-1"></div>

            <button
              disabled={saveMutation.isPending || statusActionMutation.isPending || status === 'Posted'}
              onClick={() => {
                if (activeEntryId && status !== 'Posted') {
                  statusActionMutation.mutate('Post');
                } else {
                  saveMutation.mutate('Posted');
                }
              }}
              className="px-5 py-2 bg-primary text-on-primary rounded-lg font-bold text-label-md hover:brightness-110 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">publish</span>
              ترحيل
            </button>
            <button
              disabled={saveMutation.isPending || statusActionMutation.isPending || status === 'Posted' || status === 'Approved'}
              onClick={() => {
                if (activeEntryId) {
                  statusActionMutation.mutate('Approve');
                } else {
                  saveMutation.mutate('Approved');
                }
              }}
              className="px-5 py-2 border border-primary text-primary rounded-lg font-bold text-label-md hover:bg-primary/5 transition-all disabled:opacity-50"
            >
              اعتماد
            </button>
            <button
              disabled={saveMutation.isPending || statusActionMutation.isPending}
              onClick={() => saveMutation.mutate('Draft')}
              className="px-5 py-2 text-on-surface-variant hover:bg-surface-container rounded-lg font-bold text-label-md transition-all"
            >
              مراجعة
            </button>
          </div>

          <div className="w-[1px] h-8 bg-outline-variant"></div>

          {/* Icon Bar */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => saveMutation.mutate('Draft')}
              disabled={saveMutation.isPending}
              className="p-2 text-on-surface-variant hover:text-primary transition-colors"
              title="حفظ"
            >
              <span className="material-symbols-outlined">save</span>
            </button>
            <button
              onClick={addLine}
              className="p-2 text-on-surface-variant hover:text-primary transition-colors"
              title="إضافة سطر"
            >
              <span className="material-symbols-outlined">add_box</span>
            </button>
            <button
              onClick={() => window.print()}
              className="p-2 text-on-surface-variant hover:text-primary transition-colors"
              title="طباعة"
            >
              <span className="material-symbols-outlined">print</span>
            </button>
            <button
              onClick={() => setShowAttachments(true)}
              className="p-2 text-on-surface-variant hover:text-primary transition-colors"
              title="مرفقات"
            >
              <span className="material-symbols-outlined">attach_file</span>
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
          {/* Header Card: 4-column grid (Exact Match code.html) */}
          <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/30">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-5">
              <div className="space-y-1">
                <label className="text-label-md text-on-surface-variant block text-xs font-semibold">الفرع</label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full bg-[#f2f4f6] border-none rounded-lg px-4 py-2.5 text-body-md focus:ring-2 focus:ring-primary outline-none text-xs"
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
                <label className="text-label-md text-on-surface-variant block text-xs font-semibold">السنة المالية / الفترة</label>
                <div className="flex gap-2">
                  <input
                    className="w-1/3 bg-surface-container border-none rounded-lg px-4 py-2.5 text-body-md text-outline text-xs font-mono"
                    readOnly
                    type="text"
                    value={fiscalYear}
                  />
                  <select
                    value={periodId}
                    onChange={(e) => setPeriodId(e.target.value)}
                    className="w-2/3 bg-[#f2f4f6] border-none rounded-lg px-4 py-2.5 text-body-md focus:ring-2 focus:ring-primary outline-none text-xs"
                  >
                    <option value="">مايو (05)</option>
                    {periods.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-label-md text-on-surface-variant block text-xs font-semibold">نوع الوثيقة</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full bg-[#f2f4f6] border-none rounded-lg px-4 py-2.5 text-body-md focus:ring-2 focus:ring-primary outline-none text-xs"
                >
                  <option value="قيد يومية عام">قيد يومية عام</option>
                  <option value="تسوية جردية">تسوية جردية</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-label-md text-on-surface-variant block text-xs font-semibold">التاريخ</label>
                <input
                  className="w-full bg-[#f2f4f6] border-none rounded-lg px-4 py-2.5 text-body-md focus:ring-2 focus:ring-primary outline-none text-xs"
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-label-md text-on-surface-variant block text-xs font-semibold">المرجع (Reference)</label>
                <input
                  className="w-full bg-[#f2f4f6] border-none rounded-lg px-4 py-2.5 text-body-md focus:ring-2 focus:ring-primary outline-none text-xs"
                  placeholder="أدخل رقم المرجع..."
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-label-md text-on-surface-variant block text-xs font-semibold">البيان (الوصف)</label>
                <input
                  className="w-full bg-[#f2f4f6] border-none rounded-lg px-4 py-2.5 text-body-md focus:ring-2 focus:ring-primary outline-none text-xs"
                  placeholder="أدخل وصفاً عاماً للقيد..."
                  type="text"
                  value={mainDescription}
                  onChange={(e) => setMainDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-label-md text-on-surface-variant block text-xs font-semibold">العملة</label>
                  <select
                    value={currencyId}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    className="w-full bg-[#f2f4f6] border-none rounded-lg px-4 py-2.5 text-body-md focus:ring-2 focus:ring-primary outline-none font-semibold text-xs"
                  >
                    {currencies.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.code}
                      </option>
                    ))}
                    {currencies.length === 0 && (
                      <>
                        <option value="SAR">SAR</option>
                        <option value="USD">USD</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-label-md text-on-surface-variant block text-xs font-semibold">سعر الصرف</label>
                  <input
                    className="w-full bg-[#f2f4f6] border-none rounded-lg px-4 py-2.5 text-body-md focus:ring-2 focus:ring-primary outline-none font-numeric-data text-xs font-mono"
                    step="0.0001"
                    type="number"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                  />
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
                <thead className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant">
                  <tr>
                    <th className="p-3 text-label-md text-center w-12 font-semibold">#</th>
                    <th className="p-3 text-label-md w-36 font-semibold">كود الحساب</th>
                    <th className="p-3 text-label-md w-48 font-semibold">اسم الحساب</th>
                    <th className="p-3 text-label-md w-36 font-semibold">مركز التكلفة</th>
                    <th className="p-3 text-label-md w-32 font-semibold">نوع الطرف</th>
                    <th className="p-3 text-label-md w-48 font-semibold">الطرف (عميل/مورد)</th>
                    <th className="p-3 text-label-md w-32 font-semibold">رقم المرجع</th>
                    <th className="p-3 text-label-md w-56 font-semibold">البيان</th>
                    {isForeignCurrency && (
                      <>
                        <th className="foreign-col p-3 text-label-md w-28 bg-primary/5 font-semibold text-primary">مدين (عملة)</th>
                        <th className="foreign-col p-3 text-label-md w-28 bg-primary/5 font-semibold text-primary">دائن (عملة)</th>
                      </>
                    )}
                    <th className="p-3 text-label-md w-36 font-semibold">مدين (محلي)</th>
                    <th className="p-3 text-label-md w-36 font-semibold">دائن (محلي)</th>
                    <th className="p-3 text-label-md w-16 text-center font-semibold">اجراءات</th>
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

          {/* Footer Panel */}
          <section className="grid grid-cols-1 lg:grid-cols-4 gap-6 pb-6">
            <div className="lg:col-span-3 bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/30 flex justify-between items-center">
              <div className="flex gap-16">
                <div className="flex flex-col">
                  <span className="text-label-md text-on-surface-variant mb-1 text-xs">إجمالي المدين ({baseCurrency?.code || 'SAR'})</span>
                  <span className="text-[24px] font-bold font-numeric-data font-mono text-primary">
                    {totals.totalDebitLocal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-label-md text-on-surface-variant mb-1 text-xs">إجمالي الدائن ({baseCurrency?.code || 'SAR'})</span>
                  <span className="text-[24px] font-bold font-numeric-data font-mono text-error">
                    {totals.totalCreditLocal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-label-md text-on-surface-variant mb-1 text-xs">الفرق</span>
                  <span className="text-[24px] font-bold font-numeric-data font-mono text-outline">
                    {Math.abs(totals.diffLocal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-label-md text-on-surface-variant mb-2 text-xs">حالة التوازن</span>
                {totals.isBalanced ? (
                  <div className="flex items-center gap-2 px-6 py-2 bg-primary/10 text-primary rounded-full border border-primary/20">
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    <span className="font-bold text-body-md text-xs">متوازن</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-6 py-2 bg-error/10 text-error rounded-full border border-error/20">
                    <span className="material-symbols-outlined text-[20px]">error</span>
                    <span className="font-bold text-body-md text-xs">غير متوازن</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/30">
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-label-md text-on-surface-variant">المدخل</span>
                  <span className="text-body-md font-bold">{user?.nameAr || 'أحمد العتيبي'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-label-md text-on-surface-variant">تاريخ الإنشاء</span>
                  <span className="text-body-md font-numeric-data font-mono">2024-05-22 10:14</span>
                </div>
                <div className="pt-2 border-t border-outline-variant/30">
                  <div
                    onClick={() => setShowAuditLogs(true)}
                    className="flex items-center gap-2 text-primary cursor-pointer font-bold"
                  >
                    <span className="material-symbols-outlined text-[18px]">history</span>
                    <span className="text-label-md underline">عرض سجل التعديلات</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Right Sidebar: Fixed 320px (Exact Match code.html) */}
        <aside className="w-[320px] bg-[#f2f4f6] border-r border-outline-variant p-6 space-y-8 flex flex-col overflow-y-auto">
          {/* Checkbox Group */}
          <div>
            <h4 className="text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-4 text-xs">خصائص القيد</h4>
            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-3 p-2 hover:bg-white/50 rounded-lg cursor-pointer transition-colors">
                <input
                  checked={isReviewable}
                  onChange={(e) => setIsReviewable(e.target.checked)}
                  className="w-5 h-5 accent-primary rounded"
                  type="checkbox"
                />
                <span className="text-body-md">قابل للمراجعة</span>
              </label>
              <label className="flex items-center gap-3 p-2 hover:bg-white/50 rounded-lg cursor-pointer transition-colors">
                <input
                  checked={isAutoReverse}
                  onChange={(e) => setIsAutoReverse(e.target.checked)}
                  className="w-5 h-5 accent-primary rounded"
                  type="checkbox"
                />
                <span className="text-body-md">قيد عكسي تلقائي</span>
              </label>
              <label className="flex items-center gap-3 p-2 hover:bg-white/50 rounded-lg cursor-pointer transition-colors">
                <input
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-5 h-5 accent-primary rounded"
                  type="checkbox"
                />
                <span className="text-body-md">قيد دوري (متكرر)</span>
              </label>
              <label className="flex items-center gap-3 p-2 hover:bg-white/50 rounded-lg cursor-pointer transition-colors">
                <input
                  checked={isCurrencyVariance}
                  onChange={(e) => setIsCurrencyVariance(e.target.checked)}
                  className="w-5 h-5 accent-primary rounded"
                  type="checkbox"
                />
                <span className="text-body-md">فروق عملة</span>
              </label>
            </div>
          </div>

          {/* Workflow Tracker */}
          <div className="flex-1">
            <h4 className="text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-6 text-xs">مسار العمل (Workflow)</h4>
            <div className="relative pr-6 space-y-10">
              <div className="absolute right-8 top-2 bottom-2 w-0.5 bg-outline-variant"></div>

              <div className="relative flex items-start gap-4">
                <div className="w-4 h-4 rounded-full bg-primary ring-4 ring-primary/20 z-10 mt-1 shadow-sm"></div>
                <div className="flex flex-col">
                  <span className="text-body-md font-bold text-primary text-xs">تم الإنشاء</span>
                  <span className="text-label-md text-outline text-xs">المحاسب المالي</span>
                  <span className="text-[10px] text-outline font-numeric-data font-mono">2024-05-22 10:14</span>
                </div>
              </div>

              <div className="relative flex items-start gap-4">
                <div
                  className={`w-4 h-4 rounded-full z-10 mt-1 shadow-sm ${
                    status === 'Approved' || status === 'Posted' ? 'bg-primary ring-4 ring-primary/20' : 'bg-outline-variant'
                  }`}
                ></div>
                <div className="flex flex-col">
                  <span
                    className={`text-body-md font-bold text-xs ${
                      status === 'Approved' || status === 'Posted' ? 'text-primary' : 'text-on-surface-variant'
                    }`}
                  >
                    بانتظار المراجعة
                  </span>
                  <span className="text-label-md text-outline text-xs">مدير الحسابات</span>
                </div>
              </div>

              <div className="relative flex items-start gap-4">
                <div
                  className={`w-4 h-4 rounded-full z-10 mt-1 shadow-sm ${
                    status === 'Posted' ? 'bg-primary ring-4 ring-primary/20' : 'bg-outline-variant'
                  }`}
                ></div>
                <div className="flex flex-col">
                  <span
                    className={`text-body-md font-bold text-xs ${
                      status === 'Posted' ? 'text-primary' : 'text-on-surface-variant'
                    }`}
                  >
                    الاعتماد النهائي والترحيل
                  </span>
                  <span className="text-label-md text-outline text-xs">المدير المالي</span>
                </div>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts Card */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/30 space-y-4">
            <h4 className="text-label-md text-on-surface font-bold border-b border-outline-variant/30 pb-2 flex items-center gap-2 text-xs">
              <span className="material-symbols-outlined text-[18px]">keyboard</span>
              اختصارات لوحة المفاتيح
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center text-label-md">
                <span className="text-on-surface-variant">حفظ القيد</span>
                <kbd className="bg-[#f2f4f6] border border-outline-variant px-2 py-1 rounded font-numeric-data font-bold text-[10px] font-mono">
                  Ctrl + S
                </kbd>
              </div>
              <div className="flex justify-between items-center text-label-md">
                <span className="text-on-surface-variant">سطر جديد</span>
                <kbd className="bg-[#f2f4f6] border border-outline-variant px-2 py-1 rounded font-numeric-data font-bold text-[10px] font-mono">
                  Ctrl + N
                </kbd>
              </div>
              <div className="flex justify-between items-center text-label-md">
                <span className="text-on-surface-variant">توازن القيد</span>
                <kbd className="bg-[#f2f4f6] border border-outline-variant px-2 py-1 rounded font-numeric-data font-bold text-[10px] font-mono">
                  Ctrl + B
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
