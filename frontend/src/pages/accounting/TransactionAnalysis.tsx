import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import GeneralJournalEntryModal from '../../components/accounting/GeneralJournalEntryModal';

interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  reference_type: string;
  status: string;
  total_debit: string;
  total_credit: string;
}

export default function TransactionAnalysis() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const { data: entries = [], isLoading, refetch } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: async () => {
      const res = await api.get('/accounting/journal-entries');
      return res.data.data as JournalEntry[];
    },
  });

  const filtered = entries.filter((e) => {
    const matchSearch =
      e.entry_number.includes(search) || (e.description && e.description.includes(search));
    const matchStatus = statusFilter ? e.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  // Calculate KPIs
  const totalCount = entries.length;
  const postedCount = entries.filter((e) => e.status === 'Posted').length;
  const draftCount = entries.filter((e) => e.status === 'Draft' || !e.status).length;
  const totalVolume = entries.reduce((s, e) => s + (parseFloat(e.total_debit) || 0), 0);

  const handleOpenNewModal = () => {
    setSelectedEntryId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (id: string) => {
    setSelectedEntryId(id);
    setIsModalOpen(true);
  };

  return (
    <div className="fade-in space-y-6 text-[#191c1e] font-sans">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="text-right">
          <h1 className="text-2xl font-bold text-[#191c1e] tracking-tight">
            تحليل المعاملات المالية (القيود اليومية)
          </h1>
          <p className="text-xs text-[#6d7979] mt-1">
            إدارة، استعراض، وإنشاء القيود اليومية العامة وترحيلها إلى الأستاذ العام.
          </p>
        </div>
        <button
          onClick={handleOpenNewModal}
          className="px-5 py-2.5 bg-[#006767] hover:bg-[#005252] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>قيد جديد</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="kpi-card bg-white p-5 rounded-xl border border-[#bcc9c8]/40 shadow-sm flex flex-col justify-between">
          <span className="kpi-label text-xs text-[#6d7979] font-semibold">إجمالي عدد القيود</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="kpi-value text-2xl font-bold font-mono text-[#191c1e]">{totalCount}</span>
            <span className="material-symbols-outlined text-[#006767]">receipt_long</span>
          </div>
        </div>

        <div className="kpi-card bg-white p-5 rounded-xl border border-[#bcc9c8]/40 shadow-sm flex flex-col justify-between">
          <span className="kpi-label text-xs text-[#6d7979] font-semibold">القيود المرحلة</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="kpi-value text-2xl font-bold font-mono text-[#006767]">{postedCount}</span>
            <span className="material-symbols-outlined text-[#006767]">check_circle</span>
          </div>
        </div>

        <div className="kpi-card bg-white p-5 rounded-xl border border-[#bcc9c8]/40 shadow-sm flex flex-col justify-between">
          <span className="kpi-label text-xs text-[#6d7979] font-semibold">المسودات والمعلقة</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="kpi-value text-2xl font-bold font-mono text-[#4c56af]">{draftCount}</span>
            <span className="material-symbols-outlined text-[#4c56af]">pending_actions</span>
          </div>
        </div>

        <div className="kpi-card bg-white p-5 rounded-xl border border-[#bcc9c8]/40 shadow-sm flex flex-col justify-between">
          <span className="kpi-label text-xs text-[#6d7979] font-semibold">حجم التعاملات (SAR)</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="kpi-value text-2xl font-bold font-mono text-[#191c1e]">
              {totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className="material-symbols-outlined text-[#006767]">account_balance_wallet</span>
          </div>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-[#bcc9c8]/40 shadow-sm">
        <div className="relative flex-1 min-w-[280px]">
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#6d7979] text-lg">
            search
          </span>
          <input
            className="w-full bg-[#f2f4f6] border border-[#bcc9c8]/40 rounded-lg pr-10 pl-4 py-2 text-xs text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006767]"
            placeholder="بحث برقم القيد، المرجع، أو البيان..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="bg-[#f2f4f6] border border-[#bcc9c8]/40 rounded-lg px-4 py-2 text-xs text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006767]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">جميع الحالات</option>
          <option value="Draft">مسودة</option>
          <option value="Approved">معتمد</option>
          <option value="Posted">مرحّل</option>
          <option value="Void">ملغي</option>
        </select>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#bcc9c8]/40 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="spinner" />
          </div>
        ) : (
          <table className="w-full border-collapse text-right text-xs">
            <thead className="bg-[#f2f4f6] text-[#3d4949] border-b border-[#bcc9c8]/60 font-bold">
              <tr>
                <th className="p-3">رقم القيد</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3">البيان</th>
                <th className="p-3">نوع المصدر</th>
                <th className="p-3 text-left">إجمالي المدين (SAR)</th>
                <th className="p-3 text-left">إجمالي الدائن (SAR)</th>
                <th className="p-3 text-center">الحالة</th>
                <th className="p-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-[#6d7979]">
                    لا توجد قيود يومية مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr
                    key={e.id}
                    className="hover:bg-[#f2f4f6]/60 border-b border-[#bcc9c8]/20 transition-colors"
                  >
                    <td className="p-3">
                      <span
                        onClick={() => handleOpenEditModal(e.id)}
                        className="font-mono font-bold text-[#006767] hover:underline cursor-pointer"
                      >
                        {e.entry_number}
                      </span>
                    </td>
                    <td className="p-3 font-mono">{e.entry_date.split('T')[0]}</td>
                    <td className="p-3 text-[#191c1e] max-w-xs truncate">{e.description || '—'}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#dbeafe] text-[#1e40af]">
                        {e.reference_type || 'قيد يومية عام'}
                      </span>
                    </td>
                    <td className="p-3 text-left font-mono font-bold text-[#006767]">
                      {Number(e.total_debit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-left font-mono font-bold text-[#ba1a1a]">
                      {Number(e.total_credit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-bold ${e.status === 'Posted'
                          ? 'bg-[#d1fae5] text-[#065f46]'
                          : e.status === 'Approved'
                            ? 'bg-[#dbeafe] text-[#1e40af]'
                            : e.status === 'Void'
                              ? 'bg-[#fee2e2] text-[#991b1b]'
                              : 'bg-[#eceef0] text-[#3d4949]'
                          }`}
                      >
                        {e.status === 'Posted'
                          ? 'مرحّل'
                          : e.status === 'Approved'
                            ? 'معتمد'
                            : e.status === 'Void'
                              ? 'ملغي'
                              : 'مسودة'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(e.id)}
                          className="p-1.5 text-[#3d4949] hover:text-[#006767] transition-colors rounded-lg hover:bg-[#eceef0]"
                          title="عرض القيد"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(e.id)}
                          className="p-1.5 text-[#3d4949] hover:text-[#006767] transition-colors rounded-lg hover:bg-[#eceef0]"
                          title="طباعة"
                        >
                          <span className="material-symbols-outlined text-[18px]">print</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* General Journal Entry Modal */}
      <GeneralJournalEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        entryId={selectedEntryId}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
