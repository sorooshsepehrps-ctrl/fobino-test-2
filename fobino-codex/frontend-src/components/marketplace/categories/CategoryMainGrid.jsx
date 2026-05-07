import { ChevronLeft, FolderOpen, Layers3, Sparkles } from 'lucide-react';
import CategoryCard from './CategoryCard';
import BackButton from '../common/BackButton';

function EmptySection({ title, description }) {
  return (
    <div className="rounded-[30px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-[0_20px_50px_-40px_rgba(15,23,42,0.22)]">
      <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
        <FolderOpen className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-black text-slate-900">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-8 text-slate-500">{description}</p>
    </div>
  );
}

export default function CategoryMainGrid({
  mode,
  selectedLevel1,
  selectedLevel2,
  items = [],
  search = '',
  onSelectLevel2,
  onBackToLevel2,
  visibleCount,
  onShowMore,
  hasMore,
}) {
  const isLevel3Mode = mode === 'level3';

  if (!selectedLevel1) {
    return (
      <EmptySection
        title="یک دسته‌بندی اصلی انتخاب کن"
        description="برای شروع، از ستون سمت راست یکی از دسته‌بندی‌های اصلی را انتخاب کن تا زیردسته‌های مرتبط نمایش داده شوند."
      />
    );
  }

  if (!items.length) {
    return (
      <EmptySection
        title="موردی پیدا نشد"
        description={
          search
            ? 'نتیجه‌ای مطابق جستجوی تو در این بخش پیدا نشد. جستجو را تغییر بده یا به مرحله قبل برگرد.'
            : 'هنوز زیردسته‌ای برای این بخش ثبت نشده است.'
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      {isLevel3Mode ? (
        <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.25)] md:flex-row md:items-center md:justify-between md:p-5">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Layers3 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-950">
                زیردسته‌های نهایی {selectedLevel2?.name}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                حالا نوع آگهی را انتخاب کن تا به لیست آگهی‌ها هدایت شوی.
              </p>
            </div>
          </div>

          <BackButton onClick={onBackToLevel2} />
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.25)] md:p-5">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-950">زیردسته‌های {selectedLevel1.name}</h3>
              <p className="mt-1 text-sm text-slate-500">
                یک دسته‌بندی سطح دوم را انتخاب کن تا شاخه‌های نهایی نمایش داده شوند.
              </p>
            </div>
          </div>

          <div className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 md:inline-flex">
            {items.length} مورد
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.slice(0, visibleCount).map((item) => (
          <CategoryCard
            key={item._id}
            category={item}
            variant={isLevel3Mode ? 'level3' : 'default'}
            onClick={!isLevel3Mode ? () => onSelectLevel2(item) : undefined}
          />
        ))}
      </div>

      {hasMore ? (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onShowMore}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <span>نمایش بیشتر</span>
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}