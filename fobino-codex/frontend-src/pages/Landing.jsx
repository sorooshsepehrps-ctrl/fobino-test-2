import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Boxes,
  Building2,
  ChevronLeft,
  LayoutGrid,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { Button } from '../components/ui';

const features = [
  {
    icon: LayoutGrid,
    title: 'دسته‌بندی سه‌سطحی',
    description: 'دسترسی سریع به دسته‌بندی‌ها و مسیر دقیق رسیدن به آگهی‌های خرید و فروش.',
  },
  {
    icon: ShieldCheck,
    title: 'جریان امن ارتباط',
    description: 'نمایش اطلاعات تماس و شروع چت بر اساس منطق اشتراک، کیف پول و دسترسی واقعی کاربر.',
  },
  {
    icon: Wallet,
    title: 'مدیریت آگهی و ارتقا',
    description: 'ویژه و نردبان کردن آگهی‌ها با تجربه کاربری روان و هماهنگ با کیف پول کاربر.',
  },
  {
    icon: MessageSquareText,
    title: 'چت متصل به آگهی',
    description: 'هر درخواست چت از مسیر آگهی، به همان آگهی متصل می‌شود تا گفتگوها ساختارمند بمانند.',
  },
];

const quickLinks = [
  { label: 'ورود', to: '/login' },
  { label: 'دسته‌بندی‌ها', to: '/categories' },
  { label: 'آگهی‌های فروش', to: '/posts?type=sell' },
  { label: 'آگهی‌های خرید', to: '/posts?type=buy' },
];

export default function Landing() {
  return (
    <div className="min-h-full bg-slate-50">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.08),transparent_25%)]" />

        <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-[1440px] items-center gap-10 px-4 py-10 md:px-6 lg:grid-cols-[1.1fr_0.9fr] xl:px-8">
          <div className="order-2 lg:order-1">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              <Sparkles className="h-4 w-4" />
              بازطراحی نهایی تجربه بازار فوبینو
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-[1.35] text-slate-950 md:text-5xl xl:text-6xl">
              بازار حرفه‌ای
              <span className="mx-2 text-blue-700">خرید و فروش</span>
              برای جریان واقعی معامله در فوبینو
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
              فوبینو بستری برای کشف دسته‌بندی‌ها، ساخت آگهی خرید و فروش، دسترسی هوشمند به اطلاعات تماس،
              مدیریت آگهی‌ها و شروع چت‌های متصل به هر فرصت معاملاتی است.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/categories">
                <Button
                  size="lg"
                  className="w-full rounded-2xl bg-gradient-to-l from-blue-700 to-blue-900 px-7 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.8)] hover:from-blue-800 hover:to-blue-950 sm:w-auto"
                >
                  شروع مرور دسته‌بندی‌ها
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>

              <Link to="/posts?type=sell">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full rounded-2xl border-slate-300 px-7 text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:w-auto"
                >
                  مشاهده آگهی‌های فروش
                </Button>
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:max-w-2xl">
              {quickLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <span>{item.label}</span>
                  <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
                </Link>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative mx-auto max-w-xl">
              <div className="rounded-[32px] border border-white/70 bg-white/90 p-4 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
                <div className="rounded-[28px] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 p-6 text-white md:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100">
                        نمای کلی محصول
                      </div>
                      <h2 className="text-2xl font-black">Fobino Marketplace</h2>
                      <p className="mt-3 text-sm leading-7 text-blue-100">
                        معماری جدید فرانت‌اند با تمرکز بر دسته‌بندی‌های سه‌مرحله‌ای، آگهی‌های خرید و فروش،
                        تجربه تماس و چت، و مدیریت کامل آگهی‌ها.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-3">
                      <Boxes className="h-7 w-7" />
                    </div>
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-3 flex items-center gap-2 text-blue-100">
                        <BadgeCheck className="h-4 w-4" />
                        <span className="text-sm font-semibold">جریان حرفه‌ای آگهی</span>
                      </div>
                      <p className="text-sm leading-7 text-blue-50/90">
                        مسیر شفاف از دسته‌بندی تا ثبت آگهی، مشاهده پست، تماس و شروع گفتگو.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-3 flex items-center gap-2 text-blue-100">
                        <Building2 className="h-4 w-4" />
                        <span className="text-sm font-semibold">هویت بصری یکپارچه</span>
                      </div>
                      <p className="text-sm leading-7 text-blue-50/90">
                        تم اصلی آبی تیره با accent محدود قرمز و ناوبری نرم، مدرن و نهایی.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 -left-3 hidden rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.3)] md:block">
                <p className="text-xs font-semibold text-slate-400">جریان‌های کلیدی</p>
                <p className="mt-1 text-sm font-black text-slate-900">
                  Categories • Posts • Contact • Chat • My Posts
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-6 xl:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.3)] transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_70px_-40px_rgba(30,64,175,0.28)]"
            >
              <div className="mb-4 inline-flex rounded-2xl bg-blue-50 p-3 text-blue-700">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}