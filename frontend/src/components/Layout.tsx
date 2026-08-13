import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setMobileOpen((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    setMobileOpen(false);
  };

  return (
    <div style={{ direction: 'rtl', minHeight: '100vh', background: 'var(--color-background)' }}>
      {/* Backdrop overlay for mobile sidebar */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={closeMobileSidebar}
      />
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={closeMobileSidebar} />
      <Header onToggleMobileSidebar={toggleMobileSidebar} />
      <main
        className="app-main"
        style={{
          marginRight: '280px',
          marginTop: '64px',
          minHeight: 'calc(100vh - 64px)',
          padding: '1.5rem',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}

