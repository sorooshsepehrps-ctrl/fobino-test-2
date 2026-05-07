import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Boxes,
  BriefcaseBusiness,
  Car,
  ChevronLeft,
  Cpu,
  Factory,
  Gem,
  Hammer,
  Home,
  Package,
  Pill,
  Shirt,
  ShoppingBag,
  Sparkles,
  Wheat,
} from 'lucide-react';
import { clsx } from 'clsx';
import CategoryActionOverlay from './CategoryActionOverlay';

const level1Icons = [
  Wheat,
  Cpu,
  Shirt,
  Home,
  Car,
  Factory,
  BriefcaseBusiness,
  Hammer,
  Package,
  Pill,
  Gem,
  ShoppingBag,
];

function resolveIcon(category, fallbackLevel = 1) {
  if (category.level === 1) {
    const index = Math.abs(
      [...String(category._id || category.slug || category.name)].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    ) % level1Icons.length;
    return level1Icons[index];
  }

  if (category.level === 2) return Boxes;
  return Sparkles;
}

export default function CategoryCard({
  category,
  onClick,
  isActive = false,
  variant = 'default',
}) {
  const Icon = resolveIcon(category, category.level);

  if (variant === 'level3') {
    return (
      <div className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.28)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_28px_70px_-40px_rgba(30,64,175,0.28)] md:p-5">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-red-500 opacity-80" />
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-slate-100 text-blue-700">
          <Icon className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-black text-slate-950 md:text-lg">{category.name}</h3>
          <p className="text-sm leading-7 text-slate-500">
            ورود به لیست آگهی‌های خرید یا فروش این دسته‌بندی.
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-400">
          <span>سطح سوم</span>
          <span>{category.postsCount || 0} آگهی</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 md:hidden">
          <Link
            to={`/posts?type=buy&categoryLevel3=${category._id}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
          >
            آگهی خرید
          </Link>
          <Link
            to={`/posts?type=sell&categoryLevel3=${category._id}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
          >
            آگهی فروش
          </Link>
        </div>

        <CategoryActionOverlay category={category} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'group relative w-full overflow-hidden rounded-[28px] border p-4 text-right transition duration-300 md:p-5',
        'shadow-[0_20px_60px_-40px_rgba(15,23,42,0.25)]',
        isActive
          ? 'border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50'
          : 'border-slate-200 bg-white hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_28px_70px_-42px_rgba(30,64,175,0.24)]'
      )}
    >
      <div className="absolute left-0 top-0 h-full w-24 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.09),transparent_60%)]" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div
            className={clsx(
              'mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl',
              isActive
                ? 'bg-blue-600 text-white'
                : 'bg-gradient-to-br from-slate-100 to-slate-50 text-blue-700'
            )}
          >
            <Icon className="h-7 w-7" />
          </div>

          <h3 className="truncate text-base font-black text-slate-950 md:text-lg">{category.name}</h3>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            {category.level === 1
              ? 'ورود به زیردسته‌های اصلی این گروه'
              : 'نمایش زیردسته‌های تخصصی و نهایی'}
          </p>
        </div>

        <div
          className={clsx(
            'inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl transition',
            isActive
              ? 'bg-blue-100 text-blue-700'
              : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-700'
          )}
        >
          {category.level === 1 ? <ChevronLeft className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-between text-xs font-bold">
        <span className={isActive ? 'text-blue-700' : 'text-slate-400'}>
          {category.level === 1 ? 'سطح اول' : 'سطح دوم'}
        </span>
        <span className={isActive ? 'text-blue-700' : 'text-slate-400'}>
          {category.children?.length || 0} مورد
        </span>
      </div>
    </button>
  );
}