import { Outlet, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import FobinoLogo from './FobinoLogo';

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.22),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.10),transparent_24%)]" />

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: 'Vazirmatn, Tahoma, sans-serif',
            borderRadius: '16px',
          },
        }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-10 md:px-6">
        <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="hidden rounded-[36px] border border-white/10 bg-white/5 p-8 text-white shadow-[0_30px_100px_-45px_rgba(15,23,42,0.65)] backdrop-blur-xl lg:block">
            <FobinoLogo light />

            <div className="mt-10">
              <div className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100">
                هویت جدید فوبینو
              </div>
              <h2 className="text-3xl font-black leading-[1.5]">
                ورود به بازار هوشمند خرید و فروش
              </h2>
              <p className="mt-4 max-w-md text-sm leading-8 text-slate-200">
                ورود و احراز هویت برای مدیریت حساب، ساخت آگهی، دسترسی به بازار، کیف پول، چت و ابزارهای
                پیشرفته فوبینو.
              </p>
            </div>

            <div className="mt-10 grid gap-4">
              {[
                'ثبت آگهی خرید و فروش',
                'دریافت اطلاعات تماس مبتنی بر اشتراک',
                'شروع چت متصل به آگهی',
                'مدیریت آگهی‌های من و ارتقا',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-slate-100"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white p-6 shadow-[0_30px_100px_-50px_rgba(15,23,42,0.75)] md:p-8">
              <div className="mb-6 text-center lg:hidden">
                <FobinoLogo className="justify-center" />
              </div>

              <Outlet />

              <p className="mt-8 text-center text-xs text-slate-400">
                © ۱۴۰۵ فوبینو - تمامی حقوق محفوظ است
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
