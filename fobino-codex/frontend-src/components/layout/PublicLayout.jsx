import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './Navbar';
import MobileBottomNav from './MobileBottomNav';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: 'Vazirmatn, Tahoma, sans-serif',
            borderRadius: '16px',
            background: '#ffffff',
            color: '#0f172a',
            boxShadow: '0 12px 40px -20px rgba(15,23,42,0.35)',
          },
        }}
      />

      <Navbar mode="public" />

      <main className="min-h-screen pt-20 pb-24 xl:pb-8">
        <Outlet />
      </main>

      <MobileBottomNav />
    </div>
  );
}