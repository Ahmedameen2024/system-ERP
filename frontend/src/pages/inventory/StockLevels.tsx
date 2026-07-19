import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';

interface Balance {
  id: string;
  item_id: string;
  item_code: string;
  item_name: string;
  warehouse_id: string;
  warehouse_name: string;
  quantity_on_hand: string;
  average_cost: string;
  total_value: string;
  last_updated: string;
}

interface Warehouse { id: string; name_ar: string; }

export default function StockLevels() {
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data: balances = [], isLoading } = useQuery({
    queryKey: ['inventory-balances', warehouseFilter],
    queryFn: async () => {
      const params = warehouseFilter ? `?warehouseId=${warehouseFilter}` : '';
      const res = await api.get(`/inventory/balances${params}`);
      return res.data.data as Balance[];
    },
    initialData: [],
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => { const r = await api.get('/inventory/warehouses'); return r.data.data as Warehouse[]; },
    initialData: [],
  });

  const filtered = balances.filter(b =>
    b.item_code.toLowerCase().includes(search.toLowerCase()) ||
    b.item_name.includes(search)
  );

  const totalValue = filtered.reduce((s, b) => s + Number(b.total_value), 0);

  const getStockStatus = (qty: number) => {
    if (qty <= 0) return { label: 'نفذ المخزون', cls: 'chip-error' };
    if (qty < 10) return { label: 'مخزون منخفض', cls: 'chip-neutral' };
    return { label: 'متوفر', cls: 'chip-success' };
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>أرصدة المخزون الحالية</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ padding: '0.5rem 1rem', background: 'var(--color-primary-container)', borderRadius: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>إجمالي قيمة المخزون</div>
            <div className="numeric" style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline)', fontSize: 18 }}>search</span>
          <input
            className="input"
            placeholder="بحث بكود أو اسم الصنف..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingRight: '2.5rem', width: '100%' }}
          />
        </div>
        <select className="input" style={{ width: 220 }} value={warehouseFilter} onChange={e => setWarehouseFilter(e.target.value)}>
          <option value="">كل المستودعات</option>
          {warehouses.map(w => <option key={w.id} value={w.id}>{w.name_ar}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>كود الصنف</th>
                <th>اسم الصنف</th>
                <th>المستودع</th>
                <th style={{ textAlign: 'left' }}>الكمية المتوفرة</th>
                <th style={{ textAlign: 'left' }}>متوسط التكلفة</th>
                <th style={{ textAlign: 'left' }}>القيمة الإجمالية</th>
                <th>حالة المخزون</th>
                <th>آخر تحديث</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-on-surface-variant)' }}>
                    لا توجد أرصدة مخزون — قم بإنشاء حركات استلام أو رصيد افتتاحي أولاً
                  </td>
                </tr>
              ) : filtered.map(b => {
                const status = getStockStatus(Number(b.quantity_on_hand));
                return (
                  <tr key={b.id}>
                    <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{b.item_code}</span></td>
                    <td style={{ fontWeight: 500 }}>{b.item_name}</td>
                    <td><span className="chip chip-info">{b.warehouse_name}</span></td>
                    <td className="numeric" style={{ textAlign: 'left', fontWeight: 700 }}>{Number(b.quantity_on_hand).toLocaleString('en-US', { maximumFractionDigits: 4 })}</td>
                    <td className="numeric" style={{ textAlign: 'left' }}>{Number(b.average_cost).toLocaleString('en-US', { minimumFractionDigits: 4 })}</td>
                    <td className="numeric" style={{ textAlign: 'left', fontWeight: 700 }}>{Number(b.total_value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td><span className={`chip ${status.cls}`}>{status.label}</span></td>
                    <td className="numeric" style={{ fontSize: '0.75rem' }}>{new Date(b.last_updated).toLocaleDateString('ar-SA')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
