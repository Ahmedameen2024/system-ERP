import { useState } from 'react';

interface AllowanceType {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  method: 'Fixed' | 'Percentage';
  isTaxable: boolean;
  status: 'Active' | 'Inactive';
}

interface DeductionType {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  method: 'Fixed' | 'Percentage' | 'DailyRate';
  status: 'Active' | 'Inactive';
}

export default function AllowancesDeductions() {
  const [activeSubTab, setActiveSubTab] = useState<'allowances' | 'deductions'>('allowances');

  const [allowances, setAllowances] = useState<AllowanceType[]>([
    { id: '1', code: 'HOU', nameAr: 'بدل سكن', nameEn: 'Housing Allowance', method: 'Percentage', isTaxable: false, status: 'Active' },
    { id: '2', code: 'TRA', nameAr: 'بدل نقل', nameEn: 'Transport Allowance', method: 'Fixed', isTaxable: false, status: 'Active' },
    { id: '3', code: 'MOB', nameAr: 'بدل اتصال', nameEn: 'Mobile Allowance', method: 'Fixed', isTaxable: true, status: 'Active' }
  ]);

  const [deductions, setDeductions] = useState<DeductionType[]>([
    { id: '1', code: 'GOSI', nameAr: 'تأمينات اجتماعية - موظف', nameEn: 'GOSI Employee Share', method: 'Percentage', status: 'Active' },
    { id: '2', code: 'ABS', nameAr: 'حسم غياب', nameEn: 'Absence Deduction', method: 'DailyRate', status: 'Active' }
  ]);

  const [showAllowModal, setShowAllowModal] = useState(false);
  const [allowForm, setAllowForm] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    method: 'Fixed' as 'Fixed' | 'Percentage',
    isTaxable: false,
    status: 'Active' as 'Active' | 'Inactive'
  });

  const [showDeductModal, setShowDeductModal] = useState(false);
  const [deductForm, setDeductForm] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    method: 'Fixed' as 'Fixed' | 'Percentage' | 'DailyRate',
    status: 'Active' as 'Active' | 'Inactive'
  });

  const handleAllowSave = (e: React.FormEvent) => {
    e.preventDefault();
    setAllowances([...allowances, { id: Date.now().toString(), ...allowForm }]);
    setShowAllowModal(false);
  };

  const handleDeductSave = (e: React.FormEvent) => {
    e.preventDefault();
    setDeductions([...deductions, { id: Date.now().toString(), ...deductForm }]);
    setShowDeductModal(false);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-outline-variant)' }}>
        <button className={`btn ${activeSubTab === 'allowances' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveSubTab('allowances')} style={{ borderRadius: '0.5rem 0.5rem 0 0' }}>
          دليل البدلات والتعويضات
        </button>
        <button className={`btn ${activeSubTab === 'deductions' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveSubTab('deductions')} style={{ borderRadius: '0.5rem 0.5rem 0 0' }}>
          دليل الاستقطاعات والجزاءات
        </button>
      </div>

      {activeSubTab === 'allowances' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>البدلات المعرّفة</h2>
            <button className="btn btn-primary btn-sm" onClick={() => {
              setAllowForm({ code: '', nameAr: '', nameEn: '', method: 'Fixed', isTaxable: false, status: 'Active' });
              setShowAllowModal(true);
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
              إضافة بدل جديد
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>كود البدل</th>
                  <th>الاسم العربي</th>
                  <th>الاسم الإنجليزي</th>
                  <th>طريقة الاحتساب</th>
                  <th>خاضع للضريبة</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {allowances.map(a => (
                  <tr key={a.id}>
                    <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{a.code}</span></td>
                    <td style={{ fontWeight: 500 }}>{a.nameAr}</td>
                    <td>{a.nameEn}</td>
                    <td>{a.method === 'Percentage' ? 'نسبة مئوية من الأساسي' : 'مبلغ مقطوع ثابت'}</td>
                    <td>{a.isTaxable ? <span className="chip chip-warning">خاضع</span> : <span className="chip chip-neutral">غير خاضع</span>}</td>
                    <td>
                      <span className={`chip ${a.status === 'Active' ? 'chip-success' : 'chip-neutral'}`}>
                        {a.status === 'Active' ? 'نشط' : 'متوقف'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showAllowModal && (
            <div className="modal-overlay" onClick={() => setShowAllowModal(false)}>
              <div className="modal-box" onClick={e => e.stopPropagation()}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>إضافة بدل جديد</h2>
                <form onSubmit={handleAllowSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label>كود البدل *</label>
                      <input className="input" value={allowForm.code} onChange={e => setAllowForm({ ...allowForm, code: e.target.value })} required />
                    </div>
                    <div>
                      <label>الاسم العربي *</label>
                      <input className="input" value={allowForm.nameAr} onChange={e => setAllowForm({ ...allowForm, nameAr: e.target.value })} required />
                    </div>
                    <div>
                      <label>الاسم الإنجليزي *</label>
                      <input className="input" value={allowForm.nameEn} onChange={e => setAllowForm({ ...allowForm, nameEn: e.target.value })} required />
                    </div>
                    <div>
                      <label>طريقة الاحتساب *</label>
                      <select className="input" value={allowForm.method} onChange={e => setAllowForm({ ...allowForm, method: e.target.value as any })}>
                        <option value="Fixed">مبلغ مقطوع ثابت</option>
                        <option value="Percentage">نسبة مئوية</option>
                      </select>
                    </div>
                    <div>
                      <label>الحالة</label>
                      <select className="input" value={allowForm.status} onChange={e => setAllowForm({ ...allowForm, status: e.target.value as any })}>
                        <option value="Active">نشط</option>
                        <option value="Inactive">متوقف</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={allowForm.isTaxable} onChange={e => setAllowForm({ ...allowForm, isTaxable: e.target.checked })} />
                      <span>خاضع لضريبة الدخل / ضريبة العمل المباشرة</span>
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowAllowModal(false)}>إلغاء</button>
                    <button type="submit" className="btn btn-primary">حفظ البدل</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>الاستقطاعات والجزاءات المعرّفة</h2>
            <button className="btn btn-primary btn-sm" onClick={() => {
              setDeductForm({ code: '', nameAr: '', nameEn: '', method: 'Fixed', status: 'Active' });
              setShowDeductModal(true);
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
              إضافة استقطاع جديد
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>كود البند</th>
                  <th>الاسم العربي</th>
                  <th>الاسم الإنجليزي</th>
                  <th>طريقة الاحتساب</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {deductions.map(d => (
                  <tr key={d.id}>
                    <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{d.code}</span></td>
                    <td style={{ fontWeight: 500 }}>{d.nameAr}</td>
                    <td>{d.nameEn}</td>
                    <td>{
                      d.method === 'Percentage' ? 'نسبة مئوية من الراتب' :
                      d.method === 'DailyRate' ? 'حسم معدل الأجر اليومي' : 'مبلغ مقطوع ثابت'
                    }</td>
                    <td>
                      <span className={`chip ${d.status === 'Active' ? 'chip-success' : 'chip-neutral'}`}>
                        {d.status === 'Active' ? 'نشط' : 'متوقف'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showDeductModal && (
            <div className="modal-overlay" onClick={() => setShowDeductModal(false)}>
              <div className="modal-box" onClick={e => e.stopPropagation()}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>إضافة استقطاع جديد</h2>
                <form onSubmit={handleDeductSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label>كود البند *</label>
                      <input className="input" value={deductForm.code} onChange={e => setDeductForm({ ...deductForm, code: e.target.value })} required />
                    </div>
                    <div>
                      <label>الاسم العربي *</label>
                      <input className="input" value={deductForm.nameAr} onChange={e => setDeductForm({ ...deductForm, nameAr: e.target.value })} required />
                    </div>
                    <div>
                      <label>الاسم الإنجليزي *</label>
                      <input className="input" value={deductForm.nameEn} onChange={e => setDeductForm({ ...deductForm, nameEn: e.target.value })} required />
                    </div>
                    <div>
                      <label>طريقة الاحتساب *</label>
                      <select className="input" value={deductForm.method} onChange={e => setDeductForm({ ...deductForm, method: e.target.value as any })}>
                        <option value="Fixed">مبلغ مقطوع ثابت</option>
                        <option value="Percentage">نسبة مئوية</option>
                        <option value="DailyRate">حسم أجر أيام الغياب آلياً</option>
                      </select>
                    </div>
                    <div>
                      <label>الحالة</label>
                      <select className="input" value={deductForm.status} onChange={e => setDeductForm({ ...deductForm, status: e.target.value as any })}>
                        <option value="Active">نشط</option>
                        <option value="Inactive">متوقف</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowDeductModal(false)}>إلغاء</button>
                    <button type="submit" className="btn btn-primary">حفظ البند</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
