import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const { isAuthenticated, login } = useAuthStore();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@1234');
  const [rememberMe, setRememberMe] = useState(true);
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

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="eq-landing-page" dir="rtl">
      {/* ── Top Header Navigation ─────────────────────────────────── */}
      <header className="eq-header">
        <div className="eq-header-container">
          <div className="eq-brand">
            <span className="eq-brand-title">Equilibrium Finance</span>
          </div>

          <nav className="eq-nav">
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="eq-nav-link active">
              الرئيسية
            </button>
            <button type="button" onClick={() => scrollToSection('modules-section')} className="eq-nav-link">
              الخدمات
            </button>
            <button type="button" onClick={() => scrollToSection('about-section')} className="eq-nav-link">
              عن النظام
            </button>
          </nav>

          <button type="button" onClick={() => scrollToSection('login-card-anchor')} className="eq-btn-header-login">
            تسجيل الدخول
          </button>
        </div>
      </header>

      {/* ── Main Hero & Login Split Section ────────────────────────── */}
      <main className="eq-hero-section">
        <div className="eq-hero-container">
          {/* Hero Left / Right in RTL: Text Side */}
          <div className="eq-hero-content">
            <h1 className="eq-hero-heading">
              مرحباً بكم في <span className="eq-highlight">إيكويليبريوم المالية</span>
            </h1>
            <p className="eq-hero-subtext">
              النظام المتكامل لإدارة الموارد المؤسسية (ERP) المصمم بذكاء لدعم النمو والابتكار المالي. نوفر لك الأدوات اللازمة للتحكم الكامل في عملياتك المالية والإدارية بدقة متناهية عبر الذكاء الاصطناعي.
            </p>

            <div className="eq-hero-actions">
              <button type="button" onClick={() => scrollToSection('modules-section')} className="eq-btn-primary">
                استكشف الخدمات <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_downward</span>
              </button>
              <button type="button" onClick={() => scrollToSection('about-section')} className="eq-btn-secondary">
                طلب عرض تجريبي
              </button>
            </div>
          </div>

          {/* Hero Login Card Side */}
          <div id="login-card-anchor" className="eq-login-card-wrapper">
            <div className="eq-login-card">
              <div className="eq-card-header">
                <div className="eq-avatar-icon">
                  <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#ffffff' }}>login</span>
                </div>
                <h2 className="eq-card-title">تسجيل الدخول للنظام</h2>
                <p className="eq-card-subtitle">أدخل بيانات الاعتماد الخاصة بك للوصول</p>
              </div>

              <form onSubmit={handleSubmit} className="eq-login-form">
                <div className="eq-form-group">
                  <label htmlFor="username">البريد الإلكتروني / اسم المستخدم</label>
                  <div className="eq-input-field">
                    <input
                      id="username"
                      type="text"
                      placeholder="أدخل البريد الإلكتروني"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      required
                    />
                    <span className="material-symbols-outlined eq-input-icon">person</span>
                  </div>
                </div>

                <div className="eq-form-group">
                  <label htmlFor="password">كلمة المرور</label>
                  <div className="eq-input-field">
                    <input
                      id="password"
                      type={showPass ? 'text' : 'password'}
                      placeholder="أدخل كلمة المرور"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="eq-pass-toggle"
                      onClick={() => setShowPass(!showPass)}
                      aria-label="إظهار/إخفاء كلمة المرور"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#94a3b8' }}>
                        {showPass ? 'visibility_off' : 'lock'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="eq-form-options">
                  <label className="eq-checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>تذكرني</span>
                  </label>
                  <a href="#forgot" onClick={(e) => e.preventDefault()} className="eq-forgot-link">
                    نسيت كلمة المرور؟
                  </a>
                </div>

                {error && (
                  <div className="eq-error-banner">
                    <span className="material-symbols-outlined">error</span>
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" className="eq-btn-submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                      جاري تسجيل الدخول...
                    </>
                  ) : (
                    'تسجيل الدخول'
                  )}
                </button>

                <div className="eq-demo-credentials">
                  <span className="eq-demo-title">بيانات الدخول الافتراضية:</span>
                  <div className="eq-demo-pills">
                    <span>مستخدم: <strong>admin</strong></span>
                    <span>كلمة المرور: <strong>Admin@1234</strong></span>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* ── System Modules Section ────────────────────────────────── */}
      <section id="modules-section" className="eq-modules-section">
        <div className="eq-section-header">
          <h2 className="eq-section-title">وحدات النظام المتكاملة</h2>
          <p className="eq-section-subtitle">
            مجموعة متكاملة من الأدوات الإدارية والمالية مصممة للعمل معاً بتناغم تام لدعم اتخاذ القرار المؤسسي.
          </p>
        </div>

        <div className="eq-modules-grid">
          {/* Module 1 */}
          <div className="eq-module-card">
            <div className="eq-module-icon">
              <span className="material-symbols-outlined">account_balance</span>
            </div>
            <h3 className="eq-module-title">الدورة المحاسبية</h3>
            <p className="eq-module-desc">
              إدارة شاملة لدفاتر الأستاذ، القيود اليومية، موازين المراجعة، والتقارير ختامية بدقة متناهية.
            </p>
            <button type="button" onClick={() => scrollToSection('login-card-anchor')} className="eq-module-link">
              اكتشف المزيد <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_left_alt</span>
            </button>
          </div>

          {/* Module 2 */}
          <div className="eq-module-card">
            <div className="eq-module-icon">
              <span className="material-symbols-outlined">inventory_2</span>
            </div>
            <h3 className="eq-module-title">إدارة المخزون</h3>
            <p className="eq-module-desc">
              تتبع دقيق للمخزون، المستودعات، عمليات الجرد، وإدارة سلاسل التوريد بكفاءة عالية.
            </p>
            <button type="button" onClick={() => scrollToSection('login-card-anchor')} className="eq-module-link">
              اكتشف المزيد <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_left_alt</span>
            </button>
          </div>

          {/* Module 3 */}
          <div className="eq-module-card">
            <div className="eq-module-icon">
              <span className="material-symbols-outlined">handshake</span>
            </div>
            <h3 className="eq-module-title">إدارة الموردين</h3>
            <p className="eq-module-desc">
              إدارة عقود الموردين، أوامر الشراء، والمشتريات المتأخرة بسهولة.
            </p>
            <button type="button" onClick={() => scrollToSection('login-card-anchor')} className="eq-module-link">
              اكتشف المزيد <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_left_alt</span>
            </button>
          </div>

          {/* Module 4 */}
          <div className="eq-module-card">
            <div className="eq-module-icon">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <h3 className="eq-module-title">المبيعات والعملاء</h3>
            <p className="eq-module-desc">
              منظومة كاملة لإدارة المبيعات، عروض الأسعار، فواتير العملاء، وتحليل بيانات السوق باستخدام الذكاء الاصطناعي.
            </p>
            <button type="button" onClick={() => scrollToSection('login-card-anchor')} className="eq-module-link">
              اكتشف المزيد <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_left_alt</span>
            </button>
          </div>

          {/* Module 5 */}
          <div className="eq-module-card">
            <div className="eq-module-icon">
              <span className="material-symbols-outlined">badge</span>
            </div>
            <h3 className="eq-module-title">الموارد البشرية</h3>
            <p className="eq-module-desc">
              إدارة شؤون الموظفين، الرواتب، الحضور والانصراف، والتقييم الدوري.
            </p>
            <button type="button" onClick={() => scrollToSection('login-card-anchor')} className="eq-module-link">
              اكتشف المزيد <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_left_alt</span>
            </button>
          </div>

          {/* Module 6 */}
          <div className="eq-module-card">
            <div className="eq-module-icon">
              <span className="material-symbols-outlined">settings</span>
            </div>
            <h3 className="eq-module-title">تهيئة النظام</h3>
            <p className="eq-module-desc">
              إعداد صلاحيات المستخدمين، الربط مع الأنظمة الخارجية، وتخصيص هوية المؤسسة.
            </p>
            <button type="button" onClick={() => scrollToSection('login-card-anchor')} className="eq-module-link">
              اكتشف المزيد <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_left_alt</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats Counter Section ─────────────────────────────────── */}
      <section id="about-section" className="eq-stats-section">
        <div className="eq-stats-container">
          <div className="eq-stat-item">
            <div className="eq-stat-number">+500</div>
            <div className="eq-stat-label">عميل مؤسسي</div>
          </div>
          <div className="eq-stat-item">
            <div className="eq-stat-number">99.9%</div>
            <div className="eq-stat-label">وقت التشغيل</div>
          </div>
          <div className="eq-stat-item">
            <div className="eq-stat-number">24/7</div>
            <div className="eq-stat-label">دعم فني</div>
          </div>
          <div className="eq-stat-item">
            <div className="eq-stat-number">+15</div>
            <div className="eq-stat-label">سنة خبرة</div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="eq-footer">
        <div className="eq-footer-top">
          <div className="eq-footer-brand">
            <div className="eq-footer-logo">Equilibrium Finance</div>
            <p className="eq-footer-desc">الحل الأمثل لإدارة الموارد المالية والبشرية بذكاء وكفاءة.</p>
          </div>

          <div className="eq-footer-links-group">
            <div className="eq-footer-col">
              <h4>الشركة</h4>
              <ul>
                <li><button type="button" onClick={() => scrollToSection('about-section')}>عن النظام</button></li>
                <li><button type="button" onClick={() => scrollToSection('about-section')}>اتصل بنا</button></li>
              </ul>
            </div>
            <div className="eq-footer-col">
              <h4>الدعم</h4>
              <ul>
                <li><button type="button" onClick={() => scrollToSection('about-section')}>مركز المساعدة</button></li>
                <li><button type="button" onClick={() => scrollToSection('about-section')}>دليل الاستخدام</button></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="eq-footer-bottom">
          <div className="eq-footer-copyright">
            .Equilibrium Finance, All rights reserved 2024 ©
          </div>
          <div className="eq-footer-legal">
            <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a>
            <a href="#help" onClick={(e) => e.preventDefault()}>Help Center</a>
            <a href="#contact" onClick={(e) => e.preventDefault()}>Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
