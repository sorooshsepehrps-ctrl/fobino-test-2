import { Search, SlidersHorizontal } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'همه وضعیت‌ها' },
  { value: 'active', label: 'فعال' },
  { value: 'inactive', label: 'غیرفعال' },
  { value: 'draft', label: 'پیش‌نویس' },
  { value: 'pending', label: 'در انتظار بررسی' },
  { value: 'rejected', label: 'رد شده' },
  { value: 'sold', label: 'فروخته شده' },
  { value: 'expired', label: 'منقضی شده' },
];

export default function MyPostsToolbar({
  search = '',
  onSearchChange,
  status = '',
  onStatusChange,
  total = 0,
}) {
  return (
    <div className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.24)] md:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            مدیریت و فیلتر آگهی‌ها
          </div>

          <h2 className="text-lg font-black text-slate-950 md:text-xl">
            {Number(total).toLocaleString('fa-IR')} آگهی
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            جستجو در عنوان آگهی و فیلتر بر اساس وضعیت
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 sm:w-[320px]">
            <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="جستجو در عنوان آگهی..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pr-12 pl-4 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <select
            value={status}
            onChange={(e) => onStatusChange?.(e.target.value)}
            className="h-12 min-w-[210px] rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
          >
            {STATUS_OPTIONS.map((item) => (
              <option key={item.value || 'all'} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}