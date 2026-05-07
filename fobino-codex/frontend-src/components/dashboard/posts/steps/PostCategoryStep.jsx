import { useMemo } from 'react';
import { ArrowRight, Layers3 } from 'lucide-react';
import { clsx } from 'clsx';
import { getCategoryChildren } from '../../../../utils/postDashboard';

function CategoryColumn({
  title,
  items = [],
  selectedId,
  onSelect,
  emptyText,
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm">
          <Layers3 className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400">{title}</p>
          <p className="text-sm font-black text-slate-900">{items.length.toLocaleString('fa-IR')} مورد</p>
        </div>
      </div>

      {items.length ? (
        <div className="space-y-2">
          {items.map((item) => {
            const isActive = selectedId === item._id;

            return (
              <button
                key={item._id}
                type="button"
                onClick={() => onSelect?.(item)}
                className={clsx(
                  'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-right transition',
                  isActive
                    ? 'border-blue-200 bg-blue-50 text-blue-800'
                    : 'border-transparent bg-white text-slate-700 hover:border-slate-200'
                )}
              >
                <span className="truncate text-sm font-bold">{item.name}</span>
                <ArrowRight className="h-4 w-4 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm leading-7 text-slate-500">
          {emptyText}
        </div>
      )}
    </div>
  );
}

export default function PostCategoryStep({
  tree = [],
  form,
  onSelectLevel1,
  onSelectLevel2,
  onSelectLevel3,
}) {
  const level1List = tree;

  const selectedLevel1 = useMemo(
    () => tree.find((item) => item._id === form.categoryLevel1) || null,
    [tree, form.categoryLevel1]
  );

  const level2List = useMemo(
    () => getCategoryChildren(selectedLevel1),
    [selectedLevel1]
  );

  const selectedLevel2 = useMemo(
    () => level2List.find((item) => item._id === form.categoryLevel2) || null,
    [level2List, form.categoryLevel2]
  );

  const level3List = useMemo(
    () => getCategoryChildren(selectedLevel2),
    [selectedLevel2]
  );

  const selectedLevel3 = useMemo(
    () => level3List.find((item) => item._id === form.categoryLevel3) || null,
    [level3List, form.categoryLevel3]
  );

  return (
    <section className="space-y-5 rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.25)] md:p-6">
      <div>
        <h2 className="text-xl font-black text-slate-950">دسته‌بندی آگهی</h2>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          ابتدا سطح اول، بعد سطح دوم و در نهایت سطح سوم را انتخاب کن تا ساختار آگهی دقیق و قابل
          جستجو باشد.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <CategoryColumn
          title="سطح اول"
          items={level1List}
          selectedId={form.categoryLevel1}
          onSelect={onSelectLevel1}
          emptyText="هنوز دسته‌بندی‌ای ثبت نشده است."
        />

        <CategoryColumn
          title="سطح دوم"
          items={level2List}
          selectedId={form.categoryLevel2}
          onSelect={onSelectLevel2}
          emptyText="ابتدا یک دسته‌بندی سطح اول انتخاب کن."
        />

        <CategoryColumn
          title="سطح سوم"
          items={level3List}
          selectedId={form.categoryLevel3}
          onSelect={onSelectLevel3}
          emptyText="ابتدا یک دسته‌بندی سطح دوم انتخاب کن."
        />
      </div>

      <div className="rounded-[24px] border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-black text-blue-900">انتخاب فعلی</p>
        <p className="mt-2 text-sm leading-7 text-blue-800">
          {[selectedLevel1?.name, selectedLevel2?.name, selectedLevel3?.name].filter(Boolean).join(' / ') || 'هنوز کامل نشده'}
        </p>
      </div>
    </section>
  );
}