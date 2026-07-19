import { useState } from 'react';

interface Employee {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  nationalId: string;
  department: string;
  jobTitle: string;
  salary: number;
  contractType: string;
  phone: string;
  status: 'Active' | 'OnLeave' | 'Terminated';
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([
    { id: '1', code: 'EMP-001', nameAr: 'سعد القحطاني', nameEn: 'Saad Al-Qahtani', nationalId: '1023456789', department: 'الإدارة العامة', jobTitle: 'مدير تنفيذي', salary: 15000, contractType: 'دائم', phone: '0501111111', status: 'Active' },
    { id: '2', code: 'EMP-002', nameAr: 'فهد المطيري', nameEn: 'Fahad Al-Mutairi', nationalId: '1098765432', department: 'المبيعات التسويق', jobTitle: 'مدير مبيعات', salary: 8500, contractType: 'دائم', phone: '0552222222', status: 'Active' },
    { id: '3', code: 'EMP-003', nameAr: 'رانيا الحربي', nameEn: 'Rania Al-Harbi', nationalId: '2023456789', department: 'الحسابات والميزانية', jobTitle: 'محاسب أول', salary: 9000, contractType: 'دائم', phone: '0563333333', status: 'OnLeave' }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Employee | null>(null);
  const [form, setForm] = useState({
    nameAr: '',
    nameEn: '',
    nationalId: '',
    department: 'الحسابات والميزانية',
    jobTitle: '',
    salary: 0,
    contractType: 'دائم',
    phone: '',
    status: 'Active' as 'Active' | 'OnLeave' | 'Terminated'
  });

  const openAdd = () => {
    setEditItem(null);
    setForm({ nameAr: '', nameEn: '', nationalId: '', department: 'الحسابات والميزانية', jobTitle: '', salary: 0, contractType: 'دائم', phone: '', status: 'Active' });
    setShowModal(true);
  };

  const openEdit = (e: Employee) => {
    setEditItem(e);
    setForm({ nameAr: e.nameAr, nameEn: e.nameEn, nationalId: e.nationalId, department: e.department, jobTitle: e.jobTitle, salary: e.salary, contractType: e.contractType, phone: e.phone, status: e.status });
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editItem) {
      setEmployees(employees.map(emp => emp.id === editItem.id ? { ...emp, ...form } : emp));
    } else {
      const code = 'EMP-' + String(employees.length + 1).padStart(3, '0');
      setEmployees([...employees, { id: Date.now().toString(), ...form, code }]);
    }
    setShowModal(false);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>شؤون الموظفين (ملف الموظف)</h1>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          إضافة موظف جديد
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>رقم الموظف</th>
              <th>الاسم العربي</th>
              <th>رقم الهوية / الإقامة</th>
              <th>القسم الإداري</th>
              <th>المسمى الوظيفي</th>
              <th style={{ textAlign: 'left' }}>الراتب الأساسي</th>
              <th>نوع العقد</th>
              <th>الجوال</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id}>
                <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{emp.code}</span></td>
                <td style={{ fontWeight: 500 }}>{emp.nameAr}</td>
                <td className="numeric">{emp.nationalId}</td>
                <td>{emp.department}</td>
                <td>{emp.jobTitle}</td>
                <td className="numeric" style={{ textAlign: 'left', fontWeight: 700 }}>{emp.salary.toLocaleString('ar-SA')} ر.س</td>
                <td>{emp.contractType}</td>
                <td className="numeric">{emp.phone}</td>
                <td>
                  <span className={`chip ${
                    emp.status === 'Active' ? 'chip-success' :
                    emp.status === 'OnLeave' ? 'chip-warning' : 'chip-error'
                  }`}>
                    {emp.status === 'Active' ? 'على رأس العمل' :
                     emp.status === 'OnLeave' ? 'في إجازة رسمية' : 'مستقيل / ملغى'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(emp)} title="تعديل">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>
              {editItem ? 'تعديل ملف الموظف' : 'تسجيل موظف جديد'}
            </h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>الاسم الكامل (عربي) *</label>
                  <input className="input" value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} required />
                </div>
                <div>
                  <label>الاسم الكامل (إنجليزي) *</label>
                  <input className="input" value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} required />
                </div>
                <div>
                  <label>رقم الهوية الوطنية / الإقامة *</label>
                  <input className="input numeric" value={form.nationalId} onChange={e => setForm({ ...form, nationalId: e.target.value })} required />
                </div>
                <div>
                  <label>القسم الإداري *</label>
                  <select className="input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                    <option value="الإدارة العامة">الإدارة العامة</option>
                    <option value="الحسابات والميزانية">الحسابات والميزانية</option>
                    <option value="المبيعات التسويق">المبيعات التسويق</option>
                  </select>
                </div>
                <div>
                  <label>المسمى الوظيفي *</label>
                  <input className="input" value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} required />
                </div>
                <div>
                  <label>الراتب الأساسي بالريال *</label>
                  <input className="input numeric" type="number" value={form.salary} onChange={e => setForm({ ...form, salary: parseFloat(e.target.value) })} required />
                </div>
                <div>
                  <label>نوع عقد العمل</label>
                  <select className="input" value={form.contractType} onChange={e => setForm({ ...form, contractType: e.target.value })}>
                    <option value="دائم">دائم (Full Time)</option>
                    <option value="عقد محدد">عقد مؤقت</option>
                  </select>
                </div>
                <div>
                  <label>الجوال *</label>
                  <input className="input numeric" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
                </div>
                <div>
                  <label>الحالة الوظيفية</label>
                  <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
                    <option value="Active">على رأس العمل</option>
                    <option value="OnLeave">إجازة</option>
                    <option value="Terminated">ملغى العقد</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ الموظف</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
