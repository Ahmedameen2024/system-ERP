import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  return (
    <div style={{ direction: 'rtl', minHeight: '100vh', background: 'var(--color-background)' }}>
      <Sidebar />
      <Header />
      <main
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
