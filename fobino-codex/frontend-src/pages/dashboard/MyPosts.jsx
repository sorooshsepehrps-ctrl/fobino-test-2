import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import postService from '../../services/postService';
import MyPostsTabs from '../../components/dashboard/posts/MyPostsTabs';
import MyPostCard from '../../components/dashboard/posts/MyPostCard';
import MyPostsToolbar from '../../components/dashboard/posts/MyPostsToolbar';
import MyPostsEmptyState from '../../components/dashboard/posts/MyPostsEmptyState';
import EditPostModal from '../../components/dashboard/posts/EditPostModal';
import PostEnhancementConfirmModal from '../../components/dashboard/posts/PostEnhancementConfirmModal';
import PostEnhancementInsufficientWalletModal from '../../components/dashboard/posts/PostEnhancementInsufficientWalletModal';
import { filterMyPosts } from '../../utils/postDashboard';

const ENHANCEMENT_PRICES = {
  special: 50000,
  nardeban: 100000,
};

export default function MyPosts() {
  const [type, setType] = useState('sell');
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const [editingPost, setEditingPost] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdatingPost, setIsUpdatingPost] = useState(false);

  const [enhancementModal, setEnhancementModal] = useState({
    open: false,
    type: 'special',
    post: null,
  });
  const [insufficientWalletModal, setInsufficientWalletModal] = useState({
    open: false,
    type: 'special',
  });
  const [isSubmittingEnhancement, setIsSubmittingEnhancement] = useState(false);

  const fetchPosts = async (currentType) => {
    setIsLoading(true);
    try {
      const response = await postService.getMyPosts(currentType, {
        page: 1,
        limit: 100,
      });
    
      const payload = response?.data || {};
      console.log(payload)
      setPosts(payload || []);
  
      console.log(posts)
      setPagination(payload?.pagination || null);
    } catch (error) {
      console.error(error);
      toast.error('دریافت آگهی‌های من با خطا مواجه شد');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(type);
  }, [type]);

  const filteredPosts = useMemo(
    () => filterMyPosts(posts, { status, search }),
    [posts, status, search]
  );

  const statusSummary = useMemo(() => {
    return posts.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
  }, [posts]);

  const total = pagination?.total || posts.length || 0;
  const hasFilters = Boolean((search || '').trim() || status);

  const handleToggleStatus = async (post, nextStatus) => {
    try {
      await postService.updatePostStatus(post._id, nextStatus);

      setPosts((prev) =>
        prev.map((item) =>
          item._id === post._id ? { ...item, status: nextStatus } : item
        )
      );

      toast.success(nextStatus === 'active' ? 'آگهی فعال شد' : 'آگهی غیرفعال شد');
    } catch (error) {
      console.error(error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'تغییر وضعیت آگهی با خطا مواجه شد';
      toast.error(message);
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    if (isUpdatingPost) return;
    setIsEditModalOpen(false);
    setEditingPost(null);
  };

  const handleSubmitEdit = async (post, payload) => {
    try {
      setIsUpdatingPost(true);

      const response = await postService.updatePost(post._id, payload);
      const updatedPost = response?.data?.post || response?.post || null;

      if (updatedPost?._id) {
        setPosts((prev) =>
          prev.map((item) => (item._id === updatedPost._id ? updatedPost : item))
        );
      } else {
        await fetchPosts(type);
      }

      toast.success('آگهی با موفقیت به‌روزرسانی شد');
      setIsEditModalOpen(false);
      setEditingPost(null);
    } catch (error) {
      console.error(error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'ویرایش آگهی با خطا مواجه شد';
      toast.error(message);
    } finally {
      setIsUpdatingPost(false);
    }
  };

  const openEnhancementModal = (post, enhancementType) => {
    if (!post) return;

    if (post.status !== 'active') {
      toast.error('فقط آگهی فعال قابلیت ویژه یا نردبان شدن دارد');
      return;
    }

    if (enhancementType === 'special' && post.isSpecialActive) {
      toast('این آگهی در حال حاضر ویژه است');
      return;
    }

    if (enhancementType === 'nardeban' && post.isNardebanActive) {
      toast('این آگهی در حال حاضر نردبان فعال دارد');
      return;
    }

    setEnhancementModal({
      open: true,
      type: enhancementType,
      post,
    });
  };

  const closeEnhancementModal = () => {
    if (isSubmittingEnhancement) return;
    setEnhancementModal({
      open: false,
      type: 'special',
      post: null,
    });
  };

  const closeInsufficientWalletModal = () => {
    setInsufficientWalletModal({
      open: false,
      type: 'special',
    });
  };

  const handleConfirmEnhancement = async () => {
    const targetPost = enhancementModal.post;
    const enhancementType = enhancementModal.type;

    if (!targetPost?._id) return;

    try {
      setIsSubmittingEnhancement(true);

      let response;
      if (enhancementType === 'special') {
        response = await postService.activateSpecial(targetPost._id, { duration: 168 });
      } else {
        response = await postService.activateNardeban(targetPost._id, { duration: 24 });
      }

      const updatedPost = response?.data?.post || response?.post || null;

      if (updatedPost?._id) {
        setPosts((prev) =>
          prev.map((item) => (item._id === updatedPost._id ? updatedPost : item))
        );
      } else {
        await fetchPosts(type);
      }

      toast.success(
        enhancementType === 'special'
          ? 'آگهی با موفقیت ویژه شد'
          : 'آگهی با موفقیت نردبان شد'
      );

      closeEnhancementModal();
    } catch (error) {
      console.error(error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'انجام این عملیات با خطا مواجه شد';

      const normalizedMessage = String(message).toLowerCase();

      if (
        normalizedMessage.includes('موجودی') ||
        normalizedMessage.includes('wallet') ||
        normalizedMessage.includes('balance')
      ) {
        closeEnhancementModal();
        setInsufficientWalletModal({
          open: true,
          type: enhancementType,
        });
        return;
      }

      toast.error(message);
    } finally {
      setIsSubmittingEnhancement(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-6 xl:px-8">
      <section className="relative overflow-hidden rounded-[36px] border border-slate-200 bg-white p-5 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.28)] md:p-7 xl:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.10),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.06),transparent_22%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              مدیریت آگهی‌ها
            </div>
            <h1 className="text-2xl font-black text-slate-950 md:text-4xl">آگهی‌های من</h1>
            <p className="mt-3 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
              در این بخش آگهی‌های خرید و فروش خودت را مدیریت می‌کنی، وضعیت آن‌ها را می‌بینی و برای
              ویرایش، فعال‌سازی، نردبان و ویژه آماده هستی.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to={`/dashboard/posts/new?type=${type}`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-blue-700 to-blue-900 px-5 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-18px_rgba(30,64,175,0.75)]"
            >
              <Plus className="h-4 w-4" />
              ثبت آگهی جدید
            </Link>

            <button
              type="button"
              onClick={() => fetchPosts(type)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <RefreshCcw className="h-4 w-4" />
              نوسازی
            </button>
          </div>
        </div>
      </section>

      <div className="mt-6 space-y-5">
        <MyPostsTabs
          value={type}
          onChange={(nextType) => {
            setType(nextType);
            setSearch('');
            setStatus('');
          }}
        />

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.18)]">
            <p className="text-xs font-bold text-slate-400">مجموع</p>
            <p className="mt-2 text-xl font-black text-slate-950">
              {Number(total).toLocaleString('fa-IR')}
            </p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.18)]">
            <p className="text-xs font-bold text-slate-400">فعال</p>
            <p className="mt-2 text-xl font-black text-slate-950">
              {Number(statusSummary.active || 0).toLocaleString('fa-IR')}
            </p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.18)]">
            <p className="text-xs font-bold text-slate-400">پیش‌نویس</p>
            <p className="mt-2 text-xl font-black text-slate-950">
              {Number(statusSummary.draft || 0).toLocaleString('fa-IR')}
            </p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.18)]">
            <p className="text-xs font-bold text-slate-400">در انتظار بررسی</p>
            <p className="mt-2 text-xl font-black text-slate-950">
              {Number(statusSummary.pending || 0).toLocaleString('fa-IR')}
            </p>
          </div>
        </div>

        <MyPostsToolbar
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          total={filteredPosts.length}
        />

        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_60px_-40px_rgba(15,23,42,0.24)]"
              />
            ))}
          </div>
        ) : filteredPosts.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredPosts.map((post) => (
              <MyPostCard
                key={post._id}
                post={post}
                onEdit={handleEdit}
                onToggleStatus={handleToggleStatus}
                onActivateSpecial={(targetPost) => openEnhancementModal(targetPost, 'special')}
                onActivateNardeban={(targetPost) => openEnhancementModal(targetPost, 'nardeban')}
              />
            ))}
          </div>
        ) : (
          <MyPostsEmptyState type={type} hasFilters={hasFilters} />
        )}
      </div>

      <EditPostModal
        open={isEditModalOpen}
        post={editingPost}
        onClose={handleCloseEditModal}
        onSubmit={handleSubmitEdit}
        isSubmitting={isUpdatingPost}
      />

      <PostEnhancementConfirmModal
        open={enhancementModal.open}
        type={enhancementModal.type}
        post={enhancementModal.post}
        amount={ENHANCEMENT_PRICES[enhancementModal.type] || 0}
        onClose={closeEnhancementModal}
        onConfirm={handleConfirmEnhancement}
        isSubmitting={isSubmittingEnhancement}
      />

      <PostEnhancementInsufficientWalletModal
        open={insufficientWalletModal.open}
        type={insufficientWalletModal.type}
        amount={ENHANCEMENT_PRICES[insufficientWalletModal.type] || 0}
        onClose={closeInsufficientWalletModal}
      />
    </div>
  );
}