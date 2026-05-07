import { useEffect, useMemo, useState } from 'react';
import { FolderTree, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import CategorySidebar from '../../components/marketplace/categories/CategorySidebar';
import CategoryMainGrid from '../../components/marketplace/categories/CategoryMainGrid';
import CategorySearchPanel from '../../components/marketplace/categories/CategorySearchPanel';
import postService from '../../services/postService';

const LEVEL3_INITIAL_LIMIT = 12;
const LEVEL3_LOAD_MORE_STEP = 12;

export default function CategoriesPage() {
  const [tree, setTree] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLevel1, setSelectedLevel1] = useState(null);
  const [selectedLevel2, setSelectedLevel2] = useState(null);
  const [mode, setMode] = useState('level2');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(LEVEL3_INITIAL_LIMIT);

  useEffect(() => {
    let mounted = true;

    const fetchTree = async () => {
      setIsLoading(true);
      try {
        const response = await postService.getCategoriesTree();
        const categories = response?.data?.categories || [];

        if (!mounted) return;

        setTree(categories);

        if (categories.length) {
          setSelectedLevel1(categories[0]);
          setMode('level2');
        }
      } catch (error) {
        console.error(error);
        toast.error('دریافت دسته‌بندی‌ها با خطا مواجه شد');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchTree();

    return () => {
      mounted = false;
    };
  }, []);

  const level2Items = useMemo(() => {
    if (!selectedLevel1?.children) return [];
    if (!search.trim()) return selectedLevel1.children;

    return selectedLevel1.children.filter((item) =>
      item.name?.toLowerCase().includes(search.trim().toLowerCase())
    );
  }, [selectedLevel1, search]);

  const level3Items = useMemo(() => {
    if (!selectedLevel2?.children) return [];
    if (!search.trim()) return selectedLevel2.children;

    return selectedLevel2.children.filter((item) =>
      item.name?.toLowerCase().includes(search.trim().toLowerCase())
    );
  }, [selectedLevel2, search]);

  const currentItems = mode === 'level3' ? level3Items : level2Items;

  const handleSelectLevel1 = (category) => {
    setSelectedLevel1(category);
    setSelectedLevel2(null);
    setMode('level2');
    setSearch('');
    setVisibleCount(LEVEL3_INITIAL_LIMIT);
  };

  const handleSelectLevel2 = (category) => {
    setSelectedLevel2(category);
    setMode('level3');
    setSearch('');
    setVisibleCount(LEVEL3_INITIAL_LIMIT);
  };

  const handleBackToLevel2 = () => {
    setMode('level2');
    setSelectedLevel2(null);
    setSearch('');
    setVisibleCount(LEVEL3_INITIAL_LIMIT);
  };

  const pageTitle =
    mode === 'level3'
      ? `جستجو در زیردسته‌های ${selectedLevel2?.name || ''}`
      : `جستجو در زیردسته‌های ${selectedLevel1?.name || ''}`;

  const hasMore = mode === 'level3' && currentItems.length > visibleCount;

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-6 xl:px-8">
      <section className="relative overflow-hidden rounded-[36px] border border-slate-200 bg-white p-5 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.28)] md:p-7 xl:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.10),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.06),transparent_22%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
              <Sparkles className="h-3.5 w-3.5" />
              ساختار سه‌مرحله‌ای دسته‌بندی‌ها
            </div>
            <h1 className="text-2xl font-black text-slate-950 md:text-4xl">
              دسته‌بندی‌های فوبینو
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
              از ستون کناری، دسته‌بندی سطح اول را انتخاب کن. سپس در بخش اصلی، شاخه‌های سطح دوم و
              بعد از آن دسته‌بندی‌های نهایی را ببین و مستقیم وارد لیست آگهی‌های خرید یا فروش شو.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs font-bold text-slate-400">ساختار</p>
              <p className="mt-2 text-sm font-black text-slate-900">سطح ۱ → سطح ۲ → سطح ۳</p>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs font-bold text-slate-400">هدایت نهایی</p>
              <p className="mt-2 text-sm font-black text-slate-900">آگهی خرید یا آگهی فروش</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[350px_minmax(0,1fr)]">
        <div className="xl:order-2">
          {isLoading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[32px] border border-slate-200 bg-white shadow-[0_25px_70px_-45px_rgba(15,23,42,0.25)]">
              <div className="text-center">
                <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-700">
                  <Loader2 className="h-7 w-7 animate-spin" />
                </div>
                <p className="text-sm font-bold text-slate-700">در حال بارگذاری دسته‌بندی‌ها...</p>
              </div>
            </div>
          ) : (
            <CategorySidebar
              categories={tree}
              activeCategoryId={selectedLevel1?._id}
              onSelect={handleSelectLevel1}
            />
          )}
        </div>

        <div className="xl:order-1">
          {isLoading ? (
            <div className="space-y-5">
              <div className="h-28 animate-pulse rounded-[28px] bg-white shadow-[0_20px_50px_-35px_rgba(15,23,42,0.25)]" />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-56 animate-pulse rounded-[28px] bg-white shadow-[0_20px_50px_-35px_rgba(15,23,42,0.25)]"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <CategorySearchPanel
                search={search}
                onSearchChange={setSearch}
                resultCount={currentItems.length}
                levelTitle={pageTitle}
              />

              <CategoryMainGrid
                mode={mode}
                selectedLevel1={selectedLevel1}
                selectedLevel2={selectedLevel2}
                items={currentItems}
                search={search}
                onSelectLevel2={handleSelectLevel2}
                onBackToLevel2={handleBackToLevel2}
                visibleCount={mode === 'level3' ? visibleCount : currentItems.length}
                onShowMore={() => setVisibleCount((prev) => prev + LEVEL3_LOAD_MORE_STEP)}
                hasMore={hasMore}
              />
            </div>
          )}
        </div>
      </div>

      <section className="mt-8 rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 p-6 text-white shadow-[0_35px_90px_-45px_rgba(15,23,42,0.55)] md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-white/10">
              <FolderTree className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-black md:text-2xl">مسیر سریع رسیدن به آگهی درست</h2>
              <p className="mt-2 max-w-2xl text-sm leading-8 text-blue-100">
                انتخاب هوشمند دسته‌بندی باعث می‌شود لیست آگهی‌ها دقیق‌تر، فیلترها کاربردی‌تر و تجربه
                کاربر در خرید و فروش حرفه‌ای‌تر شود.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              'انتخاب سطح اول',
              'انتخاب سطح دوم',
              'ورود به آگهی خرید/فروش',
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center text-sm font-bold text-white"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}