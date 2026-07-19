import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const { isAuthenticated, login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      window.location.pathname = '/';
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-panel">
        <section className="login-panel-left">
          <span className="login-hero-tag">
            <span className="material-symbols-outlined">rocket_launch</span>
            تسجيل دخول آمن وسريع
          </span>

          <h1 className="login-hero-title">مرحباً بك في نظام إدارة الموارد المؤسسية</h1>
          <p className="login-hero-text">
            منصة متكاملة للمحاسبة، المخزون، المبيعات، المشتريات، الموارد البشرية، والرواتب. سجّل دخـولك للحصول على رؤية فورية وتحكم كامل في عملياتك.
          </p>

          <div className="login-badges">
            {['المحاسبة المالية', 'إدارة المخزون', 'تقارير دقيقة', 'ZATCA متوافق', 'واجهة حديثة', 'دعم كامل'].map((item) => (
              <span key={item} className="login-badge">
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="login-card">
          <div>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#006767' }}>
              account_balance
            </span>
            <h2>تسجيل الدخول</h2>
            <p>أدخل بيانات حسابك للوصول إلى لوحة التحكم.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="username">اسم المستخدم</label>
              <div className="login-input-wrapper">
                <span className="material-symbols-outlined">person</span>
                <input
                  id="username"
                  className="login-input"
                  type="text"
                  placeholder="اسم المستخدم"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">كلمة المرور</label>
              <div className="login-input-wrapper">
                <span className="material-symbols-outlined">lock</span>
                <input
                  id="password"
                  className="login-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  <span className="material-symbols-outlined">
                    {showPass ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error">
                <span className="material-symbols-outlined">error</span>
                {error}
              </div>
            )}

            <div className="login-action">
              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2.5 }} />
                    جاري تسجيل الدخول...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">login</span>
                    تسجيل الدخول
                  </>
                )}
              </button>
            </div>

            <div className="login-note">
              <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>بيانات الدخول الافتراضية</div>
              <div>
                المستخدم: <span style={{ fontWeight: 600, fontFamily: 'monospace', color: '#006767' }}>admin</span>
              </div>
              <div>
                كلمة المرور: <span style={{ fontWeight: 600, fontFamily: 'monospace', color: '#006767' }}>Admin@1234</span>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
