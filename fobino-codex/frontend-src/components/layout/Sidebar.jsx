import { NavLink } from 'react-router-dom';
import {
  BadgeDollarSign,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MessageCircleMore,
  PlusSquare,
  ShieldCheck,
  Factory,
  Ticket,
  User,
  Wallet,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import useAuthStore from '../../store/authStore';
import useUIStore from '../../store/uiStore';
import FobinoLogo from './FobinoLogo';

const menuItems = [
  { path: '/dashboard', label: 'فوبینو من', icon: LayoutDashboard, end: true },
  { path: '/dashboard/profile', label: 'پروفایل', icon: User },
  { path: '/dashboard/wallet', label: 'کیف پول', icon: Wallet },
  { path: '/dashboard/subscription', label: 'اشتراک', icon: ShieldCheck },
  { path: '/dashboard/producer-verification', label: 'احراز تولیدکننده', icon: Factory },
  { path: '/dashboard/posts/new', label: 'آگهی جدید', icon: PlusSquare },
  { path: '/dashboard/my-posts', label: 'آگهی‌های من', icon: ClipboardList },
  { path: '/dashboard/messages', label: 'پیام‌ها', icon: MessageCircleMore },
  { path: '/dashboard/tickets', label: 'تیکت‌ها', icon: Ticket },
  { path: '/dashboard/verification', label: 'احراز هویت', icon: BadgeDollarSign },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();

  return (
    <>
      <div
        onClick={toggleSidebar}
        className={clsx(
          'fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition xl:hidden',
          sidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

      <aside
        className={clsx(
          'fixed right-0 top-0 z-50 h-screen w-[280px] border-l border-slate-200 bg-white shadow-[0_30px_90px_-40px_rgba(15,23,42,0.35)] transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'
        )}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-200 px-4">
          <FobinoLogo compact />
          <button
            onClick={toggleSidebar}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 xl:hidden"
            aria-label="بستن منو"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-200 p-4">
          <div className="flex items-center gap-3 rounded-3xl bg-slate-50 p-3">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user?.firstName || 'user'}
                className="h-14 w-14 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <User className="h-6 w-6" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-black text-slate-900">
                {user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'کاربر فوبینو'}
              </h3>
              <p className="mt-1 truncate text-xs text-slate-500" dir="ltr">
                {user?.phone || 'بدون شماره'}
              </p>
            </div>
          </div>
        </div>

        <nav className="h-[calc(100vh-238px)] overflow-y-auto p-3">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'mb-1 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute inset-x-0 bottom-0 border-t border-slate-200 bg-white p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            <span>خروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}