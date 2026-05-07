import { Link } from 'react-router-dom';
import { CircleOff, Plus } from 'lucide-react';

export default function MyPostsEmptyState({ type = 'sell', hasFilters = false }) {
  return (
    <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-[0_20px_60px_-40px_rgba(15,23,42,0.20)]">
      <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
        <CircleOff className="h-8 w-8" />
      </div>

      <h3 className="text-xl font-black text-slate-900">
        {hasFilters ? 'نتیجه‌ای پیدا نشد' : 'هنوز آگهی‌ای ثبت نشده'}
      </h3>

      <p className="mx-auto mt-3 max-w-2xl text-sm leading-8 text-slate-500">
        {hasFilters
          ? 'با فیلترها یا عبارت جستجوی فعلی موردی پیدا نشد. فیلترها را تغییر بده یا جستجو را پاک کن.'
          : `برای شروع، اولین ${type === 'buy' ? 'آگهی خرید' : 'آگهی فروش'} خودت را ثبت کن.`}
      </p>

      <Link
        to={`/dashboard/posts/new?type=${type}`}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-blue-700 to-blue-900 px-5 py-3 text-sm font-bold text-white"
      >
        <Plus className="h-4 w-4" />
        ثبت آگهی جدید
      </Link>
    </div>
  );
}