import { Outlet, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { clsx } from 'clsx';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import useAuthStore from '../../store/authStore';
import useUIStore from '../../store/uiStore';

export default function DashboardLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280 && !sidebarOpen) {
        toggleSidebar();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen, toggleSidebar]);

  if (!isAuthenticated && !isLoading) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-100">
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

      <Sidebar />
      <Navbar mode="dashboard" />

      <div className="relative">
        <main
          className={clsx(
            'min-h-screen px-4 pb-8 pt-24 transition-all duration-300 md:px-6',
            'xl:pr-[304px]'
          )}
        >
          <div className="mx-auto w-full max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}