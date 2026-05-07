import { Link, NavLink, useLocation } from 'react-router-dom';
import { Bell, LogIn, Menu, UserCircle2, X } from 'lucide-react';
import { useMemo } from 'react';
import { clsx } from 'clsx';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import FobinoLogo from './FobinoLogo';

const publicNavItems = [
  { label: 'خانه', to: '/' },
  { label: 'دسته‌بندی‌ها', to: '/categories' },
  { label: 'فروشندگان', to: '/posts?type=sell' },
  { label: 'خریداران', to: '/posts?type=buy' },
];

function PublicDesktopNav() {
  const location = useLocation();

  const isItemActive = useMemo(
    () => (item) => {
      if (item.to === '/') return location.pathname === '/';
      if (item.to.startsWith('/posts?type=sell')) {
        return location.pathname === '/posts' && new URLSearchParams(location.search).get('type') === 'sell';
      }
      if (item.to.startsWith('/posts?type=buy')) {
        return location.pathname === '/posts' && new URLSearchParams(location.search).get('type') === 'buy';
      }
      return location.pathname.startsWith(item.to);
    },
    [location.pathname, location.search]
  );

  return (
    <nav className="hidden items-center gap-2 xl:flex">
      {publicNavItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={clsx(
            'rounded-2xl px-4 py-2 text-sm font-semibold transition-all duration-200',
            isItemActive(item)
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function PublicActions() {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    return (
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
      >
        {user?.profileImage ? (
          <img
            src={user.profileImage}
            alt={user?.firstName || 'profile'}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-slate-100"
          />
        ) : (
          <UserCircle2 className="h-5 w-5" />
        )}
        <span className="hidden sm:inline">فوبینو من</span>
      </Link>
    );
  }

  return (
    <Link
      to="/login"
      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-l from-blue-700 to-blue-900 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_-16px_rgba(30,64,175,0.75)] transition hover:translate-y-[-1px]"
    >
      <LogIn className="h-4 w-4" />
      <span>ورود</span>
    </Link>
  );
}

function DashboardTopActions() {
  const { user } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleSidebar}
        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 xl:hidden"
        aria-label={sidebarOpen ? 'بستن منو' : 'باز کردن منو'}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <button
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
        aria-label="اعلان‌ها"
      >
        <Bell className="h-5 w-5" />
        <span className="absolute left-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500" />
      </button>

      <Link
        to="/dashboard/profile"
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
      >
        {user?.profileImage ? (
          <img
            src={user.profileImage}
            alt={user?.firstName || 'profile'}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-slate-100"
          />
        ) : (
          <UserCircle2 className="h-5 w-5" />
        )}
        <span className="hidden sm:inline">{user?.firstName || 'پروفایل'}</span>
      </Link>
    </div>
  );
}

export default function Navbar({ mode = 'dashboard' }) {
  const location = useLocation();

  if (mode === 'public') {
    return (
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between px-4 md:px-6 xl:px-8">
          <div className="flex items-center gap-6">
            <PublicActions />
            <PublicDesktopNav />
          </div>

          <FobinoLogo />
        </div>
      </header>
    );
  }

  return (
    <header
      className={clsx(
        'fixed left-0 top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl transition-all duration-300',
        'right-0 xl:right-[280px]'
      )}
    >
      <div className="flex h-20 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <DashboardTopActions />
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden text-left xl:block">
            <p className="text-xs font-semibold tracking-wide text-slate-400">
              {location.pathname.startsWith('/dashboard') ? 'داشبورد فوبینو' : 'فوبینو'}
            </p>
            <h2 className="text-sm font-black text-slate-900 md:text-base">
              مدیریت حساب و بازار هوشمند
            </h2>
          </div>
          <FobinoLogo compact />
        </div>
      </div>
    </header>
  );
}