import { useState, useEffect } from 'react';
import api from '../../api/client';

interface Currency {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  symbol: string;
  is_default: boolean;
  status: 'Active' | 'Inactive';
  // Joined from exchange rates
  buyRate?: number;
  sellRate?: number;
  midRate?: number;
}

export default function CurrencyRates() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Currency | null>(null);
  const [form, setForm] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    symbol: '',
    decimalPlaces: 2,
    buyRate: 1,
    sellRate: 1,
    midRate: 1,
    status: 'Active' as 'Active' | 'Inactive',
    isDefault: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [curRes, exRes] = await Promise.all([
        api.get('/setup/currencies'),
        api.get('/setup/exchange-rates')
      ]);
      
      const curs: Currency[] = curRes.data.data;
      const rates = exRes.data.data; // array of exchange rates

      // Merge latest rate into currency
      const merged = curs.map(c => {
        const rate = rates.find((r: any) => r.currency_id === c.id);
        if (c.is_default) {
          return { ...c, buyRate: 1, sellRate: 1, midRate: 1 };
        }
        return {
          ...c,
          buyRate: rate ? Number(rate.buy_rate) : 1,
          sellRate: rate ? Number(rate.sell_rate) : 1,
          midRate: rate ? Number(rate.mid_rate) : 1,
        };
      });

      setCurrencies(merged);
    } catch (err) {
      console.error('Failed to fetch currencies', err);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({
      code: '',
      nameAr: '',
      nameEn: '',
      symbol: '',
      decimalPlaces: 2,
      buyRate: 1,
      sellRate: 1,
      midRate: 1,
      status: 'Active',
      isDefault: false
    });
    setShowModal(true);
  };

  const openEdit = (c: Currency) => {
    setEditItem(c);
    setForm({
      code: c.code || '',
      nameAr: c.name_ar || '',
      nameEn: c.name_en || '',
      symbol: c.symbol || '',
      decimalPlaces: 2,
      buyRate: c.buyRate || 1,
      sellRate: c.sellRate || 1,
      midRate: c.midRate || 1,
      status: c.status || 'Active',
      isDefault: c.is_default || false
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let curId = editItem?.id;
      if (editItem) {
        await api.put(`/setup/currencies/${editItem.id}`, form);
      } else {
        const res = await api.post('/setup/currencies', form);
        curId = res.data.data.id;
      }

      // Save exchange rate if not default
      if (!form.isDefault && curId) {
        await api.post('/setup/exchange-rates', {
          currencyId: curId,
          rateDate: new Date().toISOString().split('T')[0],
          buyRate: form.buyRate,
          sellRate: form.sellRate,
          midRate: form.midRate
        });
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save currency');
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>العملات وأسعار الصرف</h1>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          إضافة عملة جديدة
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>جاري التحميل...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>كود العملة</th>
                <th>الاسم العربي</th>
                <th>الرمز</th>
                <th style={{ textAlign: 'left' }}>سعر الشراء</th>
                <th style={{ textAlign: 'left' }}>سعر البيع</th>
                <th style={{ textAlign: 'left' }}>سعر الصرف (الوسطي)</th>
                <th>الافتراضية</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {currencies.map(c => (
                <tr key={c.id}>
                  <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{c.code}</span></td>
                  <td style={{ fontWeight: 500 }}>{c.name_ar}</td>
                  <td><span className="numeric">{c.symbol}</span></td>
                  <td className="numeric" style={{ textAlign: 'left' }}>{c.buyRate?.toFixed(4) || '1.0000'}</td>
                  <td className="numeric" style={{ textAlign: 'left' }}>{c.sellRate?.toFixed(4) || '1.0000'}</td>
                  <td className="numeric" style={{ textAlign: 'left', fontWeight: 700 }}>{c.midRate?.toFixed(4) || '1.0000'}</td>
                  <td>
                    {c.is_default && (
                      <span className="chip chip-primary">عملة الأساس</span>
                    )}
                  </td>
                  <td>
                    <span className={`chip ${c.status === 'Active' ? 'chip-success' : 'chip-neutral'}`}>
                      {c.status === 'Active' ? 'نشط' : 'متوقف'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)} title="تعديل">
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                    </button>
                  </td>
                </tr>
              ))}
              {currencies.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>لا توجد عملات</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>
              {editItem ? 'تعديل العملة' : 'إضافة عملة جديدة'}
            </h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>كود العملة (مثل SAR) *</label>
                  <input className="input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
                </div>
                <div>
                  <label>الرمز (مثل ر.س)</label>
                  <input className="input" value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} />
                </div>
                <div>
                  <label>الاسم العربي *</label>
                  <input className="input" value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} required />
                </div>
                <div>
                  <label>الاسم الإنجليزي *</label>
                  <input className="input" value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} required />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="isDef" 
                  checked={form.isDefault} 
                  onChange={e => setForm({ ...form, isDefault: e.target.checked })} 
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <label htmlFor="isDef" style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--color-primary)' }}>
                  تعيين كعملة الأساس للنظام
                </label>
              </div>

              {!form.isDefault && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: 'var(--color-surface-container)', padding: '1rem', borderRadius: '0.5rem' }}>
                  <div style={{ gridColumn: 'span 3' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>أسعار الصرف مقابل عملة الأساس</p>
                  </div>
                  <div>
                    <label>سعر الشراء *</label>
                    <input className="input numeric" type="number" step="0.0001" value={form.buyRate} onChange={e => setForm({ ...form, buyRate: parseFloat(e.target.value) })} required={!form.isDefault} />
                  </div>
                  <div>
                    <label>سعر البيع *</label>
                    <input className="input numeric" type="number" step="0.0001" value={form.sellRate} onChange={e => setForm({ ...form, sellRate: parseFloat(e.target.value) })} required={!form.isDefault} />
                  </div>
                  <div>
                    <label>السعر الوسطي *</label>
                    <input className="input numeric" type="number" step="0.0001" value={form.midRate} onChange={e => setForm({ ...form, midRate: parseFloat(e.target.value) })} required={!form.isDefault} />
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginTop: '0.5rem' }}>
                <div>
                  <label>حالة العملة</label>
                  <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'Active' | 'Inactive' })}>
                    <option value="Active">نشط</option>
                    <option value="Inactive">متوقف</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ البيانات</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
