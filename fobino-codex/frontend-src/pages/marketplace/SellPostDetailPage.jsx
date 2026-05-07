import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  PhoneCall,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import postService from '../../services/postService';
import useContactAccessFlow from '../../hooks/useContactAccessFlow';
import usePostChatStarter from '../../hooks/usePostChatStarter';
import PostGallery from '../../components/marketplace/post-detail/PostGallery';
import PostMetaGrid from '../../components/marketplace/post-detail/PostMetaGrid';
import PostDescriptionCard from '../../components/marketplace/post-detail/PostDescriptionCard';
import PostFeaturesCard from '../../components/marketplace/post-detail/PostFeaturesCard';
import PostSellerCard from '../../components/marketplace/post-detail/PostSellerCard';
import ContactInfoModal from '../../components/marketplace/posts/ContactInfoModal';
import ContactAccessWarningModal from '../../components/marketplace/posts/ContactAccessWarningModal';
import WalletChargeModal from '../../components/marketplace/posts/WalletChargeModal';

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-20 animate-pulse rounded-[32px] bg-white shadow-[0_20px_50px_-35px_rgba(15,23,42,0.22)]" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="h-[520px] animate-pulse rounded-[32px] bg-white shadow-[0_20px_50px_-35px_rgba(15,23,42,0.22)]" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-[28px] bg-white shadow-[0_20px_50px_-35px_rgba(15,23,42,0.22)]"
              />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-[32px] bg-white shadow-[0_20px_50px_-35px_rgba(15,23,42,0.22)]" />
          <div className="h-56 animate-pulse rounded-[32px] bg-white shadow-[0_20px_50px_-35px_rgba(15,23,42,0.22)]" />
        </div>
        <div className="h-[420px] animate-pulse rounded-[32px] bg-white shadow-[0_20px_50px_-35px_rgba(15,23,42,0.22)]" />
      </div>
    </div>
  );
}

export default function SellPostDetailPage() {
  const { slug } = useParams();
  const contactFlow = useContactAccessFlow();
  const { isStartingChat, startChatFromPost } = usePostChatStarter();

  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchPost = async () => {
      setIsLoading(true);
      setNotFound(false);

      try {
        const response = await postService.getPostBySlug(slug);
        const postData = response?.data?.post || null;

        if (!mounted) return;

        setPost(postData);
      } catch (error) {
        console.error(error);
        if (!mounted) return;

        if (error?.response?.status === 404) {
          setNotFound(true);
        } else {
          toast.error('دریافت جزئیات آگهی با خطا مواجه شد');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    if (slug) {
      fetchPost();
    }

    return () => {
      mounted = false;
    };
  }, [slug]);

  const handleStartChat = async (targetPost) => {
    if (!targetPost) return;
    contactFlow.setShowContactModal(false);
    await startChatFromPost(targetPost);
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-6 xl:px-8">
        <DetailSkeleton />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-4 py-10 md:px-6 xl:px-8">
        <div className="rounded-[36px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-[0_20px_60px_-40px_rgba(15,23,42,0.24)]">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-600">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-950">آگهی پیدا نشد</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-8 text-slate-500">
            این آگهی وجود ندارد، غیرفعال شده یا فقط برای مالک آن قابل مشاهده است.
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/posts?type=sell"
              className="rounded-2xl bg-gradient-to-l from-blue-700 to-blue-900 px-5 py-3 text-sm font-bold text-white"
            >
              بازگشت به آگهی‌های فروش
            </Link>
            <Link
              to="/categories"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              مرور دسته‌بندی‌ها
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const categoryPath = [
    post?.categoryLevel1?.name,
    post?.categoryLevel2?.name,
    post?.categoryLevel3?.name,
  ]
    .filter(Boolean)
    .join(' / ');

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-6 xl:px-8">
      <section className="relative overflow-hidden rounded-[36px] border border-slate-200 bg-white p-5 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.28)] md:p-7 xl:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.10),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.06),transparent_22%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                <Sparkles className="h-3.5 w-3.5" />
                آگهی فروش
              </span>

              {post?.isSpecialActive ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  ویژه
                </span>
              ) : null}

              {post?.isNardebanActive ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  نردبان فعال
                </span>
              ) : null}
            </div>

            <h1 className="max-w-4xl text-2xl font-black leading-[1.5] text-slate-950 md:text-4xl">
              {post.title}
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
              {categoryPath || 'بدون دسته‌بندی'} {categoryPath ? '•' : ''} مشاهده جزئیات کامل آگهی،
              گالری تصاویر، اطلاعات فروشنده و مسیر ارتباط مستقیم
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => contactFlow.handleOpenContact(post)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-blue-700 to-blue-900 px-5 py-3 text-sm font-bold text-white shadow-[0_16px_34px_-20px_rgba(30,64,175,0.8)]"
            >
              <PhoneCall className="h-4 w-4" />
              اطلاعات تماس
            </button>

            <Link
              to="/posts?type=sell"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <ArrowRight className="h-4 w-4" />
              بازگشت به لیست
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <PostGallery post={post} />
          <PostMetaGrid post={post} />
          <PostDescriptionCard description={post?.description} />
          <PostFeaturesCard post={post} />
        </div>

        <div>
          <div className="sticky top-24">
            <PostSellerCard
              post={post}
              onContactClick={(targetPost) => contactFlow.handleOpenContact(targetPost)}
            />
          </div>
        </div>
      </div>

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