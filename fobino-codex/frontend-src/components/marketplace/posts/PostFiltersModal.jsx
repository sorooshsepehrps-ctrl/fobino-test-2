import { useEffect, useMemo, useState } from 'react';
import { Filter, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';

const sortOptions = [
  { value: 'newest', label: 'جدیدترین' },
  { value: 'oldest', label: 'قدیمی‌ترین' },
  { value: 'mostViewed', label: 'پربازدیدترین' },
  { value: 'priceAsc', label: 'کمترین قیمت' },
  { value: 'priceDesc', label: 'بیشترین قیمت' },
];

export default function PostFiltersModal({
  open,
  onClose,
  filters,
  onApply,
  onReset,
  categoryLabel = '',
}) {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const appliedCount = useMemo(() => {
    let count = 0;
    if (filters.q) count += 1;
    if (filters.sort && filters.sort !== 'newest') count += 1;
    if (filters.categoryLevel3) count += 1;
    return count;
  }, [filters]);

  if (!open) return null;

  const update = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm md:items-center md:p-4">
      <div className="w-full max-w-2xl rounded-t-[32px] border border-slate-200 bg-white shadow-[0_35px_90px_-40px_rgba(15,23,42,0.45)] md:rounded-[32px]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-950">فیلتر آگهی‌ها</h3>
              <p className="text-xs font-bold text-slate-400">
                {appliedCount ? `${appliedCount} فیلتر فعال` : 'بدون فیلتر فعال'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-5 py-5 md:px-6 md:py-6">
          <div>
            <label className="mb-2 block text-sm font-black text-slate-900">جستجو</label>
            <div className="relative">
              <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={localFilters.q || ''}
                onChange={(e) => update('q', e.target.value)}
                placeholder="عنوان یا کلمات کلیدی آگهی..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pr-12 pl-4 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-black text-slate-900">مرتب‌سازی</label>
              <select
                value={localFilters.sort || 'newest'}
                onChange={(e) => update('sort', e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-900">وضعیت دسته‌بندی</label>
              <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700">
                {categoryLabel || 'همه دسته‌بندی‌ها'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 md:flex-row md:justify-between md:px-6">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <RotateCcw className="h-4 w-4" />
            پاک کردن فیلترها
          </button>

          <button
            type="button"
            onClick={() => {
              onApply(localFilters);
              onClose();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-blue-700 to-blue-900 px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-18px_rgba(30,64,175,0.75)]"
          >
            <Filter className="h-4 w-4" />
            اعمال فیلترها
          </button>
        </div>
      </div>
    </div>
  );
}