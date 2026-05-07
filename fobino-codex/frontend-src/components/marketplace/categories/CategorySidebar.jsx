import { LayoutGrid, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import CategoryCard from './CategoryCard';

export default function CategorySidebar({
  categories = [],
  activeCategoryId,
  onSelect,
}) {
  return (
    <aside className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_25px_70px_-45px_rgba(15,23,42,0.28)] md:p-5">
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            <Sparkles className="h-3.5 w-3.5" />
            دسته‌بندی‌های اصلی
          </div>
          <h2 className="text-lg font-black text-slate-950">سطح اول</h2>
          <p className="mt-1 text-sm text-slate-500">از این بخش گروه اصلی موردنظرت را انتخاب کن.</p>
        </div>

        <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-blue-700 md:inline-flex">
          <LayoutGrid className="h-6 w-6" />
        </div>
      </div>

      <div className="space-y-3">
        {categories.map((category) => (
          <CategoryCard
            key={category._id}
            category={category}
            onClick={() => onSelect(category)}
            isActive={activeCategoryId === category._id}
          />
        ))}
      </div>

      <div className="mt-5 rounded-3xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-sm font-bold text-slate-800">راهنما</p>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          با انتخاب هر دسته‌بندی اصلی، زیرشاخه‌های سطح دوم در بخش اصلی صفحه نمایش داده می‌شوند.
        </p>
      </div>
    </aside>
  );
}