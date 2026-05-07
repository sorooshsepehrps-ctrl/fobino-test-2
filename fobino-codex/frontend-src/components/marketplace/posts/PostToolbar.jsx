import { Filter, Search, Sparkles } from 'lucide-react';
import { buildPostsResultText, getPostTypeLabel } from '../../../utils/marketplace';

export default function PostToolbar({
  filters,
  total = 0,
  onSearchChange,
  onOpenFilters,
  categoryLabel = '',
}) {
  return (
    <div className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.28)] md:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            <Sparkles className="h-3.5 w-3.5" />
            {getPostTypeLabel(filters.type)}
          </div>

          <h1 className="text-xl font-black text-slate-950 md:text-2xl">
            {filters.type === 'buy' ? 'لیست آگهی‌های خرید' : 'لیست آگهی‌های فروش'}
          </h1>

          <p className="mt-2 text-sm leading-7 text-slate-500">
            {buildPostsResultText(total, filters.type)}
            {categoryLabel ? ` • ${categoryLabel}` : ''}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 sm:w-[320px]">
            <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filters.q || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="جستجو در آگهی‌ها..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pr-12 pl-4 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <button
            type="button"
            onClick={onOpenFilters}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <Filter className="h-4 w-4" />
            فیلتر
          </button>
        </div>
      </div>
    </div>
  );
}