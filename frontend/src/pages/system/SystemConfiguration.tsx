import { useState, useEffect } from 'react';
import api from '../../api/client';

export default function SystemConfiguration() {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [profile, setProfile] = useState({
    nameAr: '',
    nameEn: '',
    activity: '',
    taxNumber: '',
    crNumber: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    country: '',
    fiscalYearStart: '',
    fiscalYearEnd: '',
  });

  const [settings, setSettings] = useState({
    defaultLanguage: 'ar',
    dateFormat: 'DD/MM/YYYY',
    decimalPlaces: '2',
    preventNegativeStock: true,
    autoNumbering: true,
    vatRate: '15',
    gosiEmployeeRate: '9.75',
    gosiEmployerRate: '11.75',
    overtimeMultiplier: '1.5',
    lateGraceMinutes: '15',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch company profile
      const compRes = await api.get('/setup/company');
      if (compRes.data.data) {
        const c = compRes.data.data;
        setProfile({
          nameAr: c.name_ar || '',
          nameEn: c.name_en || '',
          activity: c.activity || '',
          taxNumber: c.tax_number || '',
          crNumber: c.cr_number || '',
          phone: c.phone || '',
          email: c.email || '',
          website: c.website || '',
          address: c.address || '',
          city: c.city || '',
          country: c.country || '',
          fiscalYearStart: c.fiscal_year_start ? c.fiscal_year_start.split('T')[0] : '',
          fiscalYearEnd: c.fiscal_year_end ? c.fiscal_year_end.split('T')[0] : '',
        });
      }

      // Fetch settings
      const setRes = await api.get('/setup/settings');
      if (setRes.data.data) {
        const s = setRes.data.data;
        setSettings({
          defaultLanguage: s.defaultLanguage || 'ar',
          dateFormat: s.dateFormat || 'DD/MM/YYYY',
          decimalPlaces: s.decimalPlaces || '2',
          preventNegativeStock: s.preventNegativeStock === 'true',
          autoNumbering: s.autoNumbering === 'true',
          vatRate: s.vatRate || '15',
          gosiEmployeeRate: s.gosiEmployeeRate || '9.75',
          gosiEmployerRate: s.gosiEmployerRate || '11.75',
          overtimeMultiplier: s.overtimeMultiplier || '1.5',
          lateGraceMinutes: s.lateGraceMinutes || '15',
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/setup/company', profile);
      alert('تم حفظ الملف التعريفي للشركة بنجاح');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save profile');
    }
  };

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Record<string, string> = {
        defaultLanguage: settings.defaultLanguage,
        dateFormat: settings.dateFormat,
        decimalPlaces: settings.decimalPlaces,
        preventNegativeStock: settings.preventNegativeStock.toString(),
        autoNumbering: settings.autoNumbering.toString(),
        vatRate: settings.vatRate,
        gosiEmployeeRate: settings.gosiEmployeeRate,
        gosiEmployerRate: settings.gosiEmployerRate,
        overtimeMultiplier: settings.overtimeMultiplier,
        lateGraceMinutes: settings.lateGraceMinutes,
      };
      await api.put('/setup/settings', payload);
      alert('تم حفظ إعدادات النظام بنجاح');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save settings');
    }
  };

  if (loading) return <div>جاري التحميل...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>
          تهيئة النظام
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
          الملف التعريفي للشركة والإعدادات العامة ومعايير تشغيل النظام
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-outline-variant)' }}>
        <button
          className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('profile')}
          style={{ borderRadius: '0.5rem 0.5rem 0 0' }}
        >
          ملف الشركة
        </button>
        <button
          className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('settings')}
          style={{ borderRadius: '0.5rem 0.5rem 0 0' }}
        >
          إعدادات النظام
        </button>
        <a
          href="/system/cash-banks"
          className="btn btn-ghost"
          style={{ borderRadius: '0.5rem 0.5rem 0 0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>account_balance</span>
          إدارة الصناديق والبنوك
        </a>
      </div>

      {activeTab === 'profile' ? (
        <form onSubmit={handleProfileSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '0.5rem', margin: 0 }}>
            بيانات المنشأة الأساسية
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div>
              <label>الاسم العربي للمنشأة *</label>
              <input className="input" value={profile.nameAr} onChange={e => setProfile({ ...profile, nameAr: e.target.value })} required />
            </div>
            <div>
              <label>الاسم الإنجليزي للمنشأة *</label>
              <input className="input" value={profile.nameEn} onChange={e => setProfile({ ...profile, nameEn: e.target.value })} required />
            </div>
            <div>
              <label>النشاط التجاري</label>
              <input className="input" value={profile.activity} onChange={e => setProfile({ ...profile, activity: e.target.value })} />
            </div>
            <div>
              <label>الرقم الضريبي (VAT) *</label>
              <input className="input numeric" value={profile.taxNumber} onChange={e => setProfile({ ...profile, taxNumber: e.target.value })} required />
            </div>
            <div>
              <label>رقم السجل التجاري (CR) *</label>
              <input className="input numeric" value={profile.crNumber} onChange={e => setProfile({ ...profile, crNumber: e.target.value })} required />
            </div>
            <div>
              <label>الهاتف</label>
              <input className="input numeric" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
            </div>
            <div>
              <label>البريد الإلكتروني</label>
              <input className="input" type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
            </div>
            <div>
              <label>الموقع الإلكتروني</label>
              <input className="input" value={profile.website} onChange={e => setProfile({ ...profile, website: e.target.value })} />
            </div>
            <div>
              <label>العنوان الوطني</label>
              <input className="input" value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} />
            </div>
            <div>
              <label>المدينة</label>
              <input className="input" value={profile.city} onChange={e => setProfile({ ...profile, city: e.target.value })} />
            </div>
            <div>
              <label>الدولة</label>
              <input className="input" value={profile.country} onChange={e => setProfile({ ...profile, country: e.target.value })} />
            </div>
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: 700, borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '0.5rem', margin: '1rem 0 0' }}>
            السنة المالية الحالية
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div>
              <label>تاريخ بداية السنة المالية *</label>
              <input className="input" type="date" value={profile.fiscalYearStart} onChange={e => setProfile({ ...profile, fiscalYearStart: e.target.value })} required />
            </div>
            <div>
              <label>تاريخ نهاية السنة المالية *</label>
              <input className="input" type="date" value={profile.fiscalYearEnd} onChange={e => setProfile({ ...profile, fiscalYearEnd: e.target.value })} required />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
              حفظ البيانات التعريفية
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSettingsSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '0.5rem', margin: 0 }}>
            معايير التشغيل وقوانين النظام
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div>
              <label>اللغة الافتراضية</label>
              <select className="input" value={settings.defaultLanguage} onChange={e => setSettings({ ...settings, defaultLanguage: e.target.value })}>
                <option value="ar">العربية (Default RTL)</option>
                <option value="en">English (LTR)</option>
              </select>
            </div>
            <div>
              <label>صيغة التاريخ</label>
              <select className="input" value={settings.dateFormat} onChange={e => setSettings({ ...settings, dateFormat: e.target.value })}>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div>
              <label>الخانة العشرية للمبالغ</label>
              <select className="input" value={settings.decimalPlaces} onChange={e => setSettings({ ...settings, decimalPlaces: e.target.value })}>
                <option value="2">خانتين عشريتين (2.00)</option>
                <option value="3">ثلاث خانات عشرية (3.000)</option>
                <option value="4">أربع خانات عشرية (4.0000)</option>
              </select>
            </div>
            <div>
              <label>نسبة ضريبة القيمة المضافة (VAT) %</label>
              <input className="input numeric" type="number" value={settings.vatRate} onChange={e => setSettings({ ...settings, vatRate: e.target.value })} />
            </div>
            <div>
              <label>نسبة ساند والتأمينات - موظف %</label>
              <input className="input numeric" type="number" step="0.01" value={settings.gosiEmployeeRate} onChange={e => setSettings({ ...settings, gosiEmployeeRate: e.target.value })} />
            </div>
            <div>
              <label>نسبة التأمينات - منشأة %</label>
              <input className="input numeric" type="number" step="0.01" value={settings.gosiEmployerRate} onChange={e => setSettings({ ...settings, gosiEmployerRate: e.target.value })} />
            </div>
            <div>
              <label>مضاعف ساعات العمل الإضافي</label>
              <input className="input numeric" type="number" step="0.1" value={settings.overtimeMultiplier} onChange={e => setSettings({ ...settings, overtimeMultiplier: e.target.value })} />
            </div>
            <div>
              <label>فترة السماح بالدقائق للتأخير</label>
              <input className="input numeric" type="number" value={settings.lateGraceMinutes} onChange={e => setSettings({ ...settings, lateGraceMinutes: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={settings.preventNegativeStock} onChange={e => setSettings({ ...settings, preventNegativeStock: e.target.checked })} />
              <span>منع البيع في حالة عدم وجود مخزون كافٍ (Prevent Negative Stock)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={settings.autoNumbering} onChange={e => setSettings({ ...settings, autoNumbering: e.target.checked })} />
              <span>الترقيم التلقائي للمستندات والقيود المحاسبية</span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
              حفظ الإعدادات العامة
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
