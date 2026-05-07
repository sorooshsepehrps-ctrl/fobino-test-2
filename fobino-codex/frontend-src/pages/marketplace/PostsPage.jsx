import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleOff, Plus, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import useMarketplaceFilters from '../../hooks/useMarketplaceFilters';
import useContactAccessFlow from '../../hooks/useContactAccessFlow';
import usePostChatStarter from '../../hooks/usePostChatStarter';
import postService from '../../services/postService';
import PostToolbar from '../../components/marketplace/posts/PostToolbar';
import PostFiltersModal from '../../components/marketplace/posts/PostFiltersModal';
import PostList from '../../components/marketplace/posts/PostList';
import PostCardSkeleton from '../../components/marketplace/common/PostCardSkeleton';
import ContactInfoModal from '../../components/marketplace/posts/ContactInfoModal';
import ContactAccessWarningModal from '../../components/marketplace/posts/ContactAccessWarningModal';
import WalletChargeModal from '../../components/marketplace/posts/WalletChargeModal';

export default function PostsPage() {
  const { filters, setFilter, setFilters, resetFilters } = useMarketplaceFilters();
  const contactFlow = useContactAccessFlow();
  const { isStartingChat, startChatFromPost } = usePostChatStarter();

  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [categoriesTree, setCategoriesTree] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchCategories = async () => {
      try {
        const response = await postService.getCategoriesTree();
        if (!mounted) return;
        setCategoriesTree(response?.data?.categories || []);
      } catch (error) {
        console.error(error);
      }
    };

    fetchCategories();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const response = await postService.getPosts({
          type: filters.type,
          q: filters.q || undefined,
          sort: filters.sort || 'newest',
          page: filters.page || 1,
          limit: filters.limit || 12,
          categoryLevel3: filters.categoryLevel3 || undefined,
          status: filters.status || 'active',
        });
        console.log(response)

        if (!mounted) return;

        const data = response?.data || {};
        console.log(data.posts)
        setPosts(data || []);
        console.log(posts)
        setPagination(data.pagination || null);
      } catch (error) {
        console.error(error);
        toast.error('دریافت آگهی‌ها با خطا مواجه شد');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchPosts();

    return () => {
      mounted = false;
    };
  }, [filters]);

  const categoryLabel = useMemo(() => {
    if (!filters.categoryLevel3 || !categoriesTree.length) return '';

    for (const level1 of categoriesTree) {
      for (const level2 of level1.children || []) {
        const found = (level2.children || []).find((item) => item._id === filters.categoryLevel3);
        if (found) return `${level1.name} / ${level2.name} / ${found.name}`;
      }
    }

    return '';
  }, [categoriesTree, filters.categoryLevel3]);

  const total = pagination?.total || posts.length || 0;
  const currentPage = Number(filters.page || 1);
  const totalPages = Number(pagination?.pages || 1);

  const handleStartChat = async (post) => {
    if (!post) return;
    contactFlow.setShowContactModal(false);
    await startChatFromPost(post);
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-6 xl:px-8">
      <section className="relative overflow-hidden rounded-[36px] border border-slate-200 bg-white p-5 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.28)] md:p-7 xl:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.10),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.06),transparent_22%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              مرور حرفه‌ای آگهی‌ها
            </div>
            <h2 className="text-2xl font-black text-slate-950 md:text-4xl">
              {filters.type === 'buy' ? 'بازار درخواست‌های خرید' : 'بازار آگهی‌های فروش'}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
              آگهی‌ها را با جستجو، دسته‌بندی و مرتب‌سازی دقیق مرور کن. برای فروش، جزئیات کامل آگهی
              در دسترس است و برای خرید، دسترسی سریع به تماس و چت فراهم شده است.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to={filters.type === 'buy' ? '/dashboard/posts/new?type=buy' : '/dashboard/posts/new?type=sell'}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-blue-700 to-blue-900 px-5 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-18px_rgba(30,64,175,0.75)]"
            >
              <Plus className="h-4 w-4" />
              ثبت آگهی جدید
            </Link>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <RefreshCcw className="h-4 w-4" />
              نوسازی
            </button>
          </div>
        </div>
      </section>

      <div className="mt-6 space-y-5">
        <PostToolbar
          filters={filters}
          total={total}
          categoryLabel={categoryLabel}
          onSearchChange={(value) => setFilter('q', value)}
          onOpenFilters={() => setIsFiltersOpen(true)}
        />

        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <PostCardSkeleton key={index} withImage={filters.type !== 'buy'} />
            ))}
          </div>
        ) : posts.length ? (
          <>
            <PostList
              posts={posts}
              type={filters.type}
              onContactClick={(post) => contactFlow.handleOpenContact(post)}
            />

            {totalPages > 1 ? (
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setFilter('page', currentPage - 1)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  صفحه قبل
                </button>

                <div className="rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700">
                  صفحه {currentPage.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
                </div>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setFilter('page', currentPage + 1)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  صفحه بعد
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-[0_20px_60px_-40px_rgba(15,23,42,0.24)]">
            <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
              <CircleOff className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900">آگهی‌ای پیدا نشد</h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-8 text-slate-500">
              با این فیلترها یا جستجو نتیجه‌ای پیدا نشد. فیلترها را تغییر بده یا دوباره جستجو کن.
            </p>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                پاک کردن فیلترها
              </button>

              <Link
                to="/categories"
                className="rounded-2xl bg-gradient-to-l from-blue-700 to-blue-900 px-5 py-3 text-sm font-bold text-white"
              >
                بازگشت به دسته‌بندی‌ها
              </Link>
            </div>
          </div>
        )}
      </div>

      <PostFiltersModal
        open={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        filters={filters}
        categoryLabel={categoryLabel}
        onApply={(next) => setFilters(next)}
        onReset={() => {
          resetFilters();
          setIsFiltersOpen(false);
        }}
      />

      <ContactInfoModal
        open={contactFlow.showContactModal}
        onClose={() => contactFlow.setShowContactModal(false)}
        data={contactFlow.contactData}
        post={contactFlow.selectedPost}
        onStartChat={handleStartChat}
        isStartingChat={isStartingChat}
      />

      <ContactAccessWarningModal
        open={contactFlow.showWarningModal}
        onClose={() => contactFlow.setShowWarningModal(false)}
        onConfirm={contactFlow.confirmAccess}
      />

      <WalletChargeModal
        open={contactFlow.showWalletModal}
        onClose={() => contactFlow.setShowWalletModal(false)}
      />
    </div>
  );
}