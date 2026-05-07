import { Link } from 'react-router-dom';
import {
  ArrowUp,
  Eye,
  MapPin,
  PencilLine,
  Power,
  Sparkles,
  Tag,
  TrendingUp,
} from 'lucide-react';
import {
  buildMyPostPrice,
  buildMyPostShortDescription,
  getPostLocation,
  getPostTypeBadgeClass,
  getPostTypeLabel,
  getPostViews,
} from '../../../utils/postDashboard';
import PostStatusBadge from './PostStatusBadge';
import PostEnhancementBadges from './PostEnhancementBadges';

export default function MyPostCard({
  post,
  onEdit,
  onToggleStatus,
  onActivateSpecial,
  onActivateNardeban,
}) {
  const nextStatus = post?.status === 'active' ? 'inactive' : 'active';
  const canToggleStatus = ['active', 'inactive'].includes(post?.status);

  return (
    <article
      className={`overflow-hidden rounded-[30px] border bg-white shadow-[0_20px_60px_-40px_rgba(15,23,42,0.24)] ${
        post?.isNardebanActive ? 'border-red-200' : post?.isSpecialActive ? 'border-amber-200' : 'border-slate-200'
      }`}
    >
      <div
        className={`h-1 w-full ${
          post?.isNardebanActive
            ? 'bg-gradient-to-r from-red-500 via-red-400 to-blue-600'
            : post?.isSpecialActive
            ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-blue-600'
            : 'bg-gradient-to-r from-blue-700 to-blue-500'
        }`}
      />

      <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${getPostTypeBadgeClass(post?.type)}`}>
              {getPostTypeLabel(post?.type)}
            </span>

            <PostStatusBadge status={post?.status} />
          </div>

          <PostEnhancementBadges
            isSpecialActive={post?.isSpecialActive}
            isNardebanActive={post?.isNardebanActive}
          />
        </div>

        <div className="mt-5">
          <h3 className="line-clamp-1 text-lg font-black text-slate-950 md:text-xl">
            {post?.title || 'بدون عنوان'}
          </h3>

          <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-500">
            {buildMyPostShortDescription(post)}
          </p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-400">
              <Tag className="h-4 w-4" />
              <span className="text-xs font-bold">قیمت</span>
            </div>
            <p className="text-sm font-black text-slate-900">{buildMyPostPrice(post)}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-400">
              <MapPin className="h-4 w-4" />
              <span className="text-xs font-bold">موقعیت</span>
            </div>
            <p className="text-sm font-black text-slate-900">{getPostLocation(post)}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-400">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-bold">بازدید</span>
            </div>
            <p className="text-sm font-black text-slate-900">
              {getPostViews(post).toLocaleString('fa-IR')}
            </p>
          </div>
        </div>

        {post?.rejectionReason ? (
          <div className="mt-5 rounded-[22px] border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-black text-red-700">دلیل رد شدن آگهی</p>
            <p className="mt-2 text-sm leading-7 text-red-600">{post.rejectionReason}</p>
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <button
            type="button"
            onClick={() => onEdit?.(post)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <PencilLine className="h-4 w-4" />
            ویرایش
          </button>

          <button
            type="button"
            onClick={() => canToggleStatus && onToggleStatus?.(post, nextStatus)}
            disabled={!canToggleStatus}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Power className="h-4 w-4" />
            {post?.status === 'active' ? 'غیرفعال کردن' : 'فعال کردن'}
          </button>

          <button
            type="button"
            onClick={() => onActivateSpecial?.(post)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 transition hover:bg-amber-100"
          >
            <Sparkles className="h-4 w-4" />
            ویژه
          </button>

          <button
            type="button"
            onClick={() => onActivateNardeban?.(post)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100"
          >
            <ArrowUp className="h-4 w-4" />
            نردبان
          </button>

          {post?.type === 'sell' && post?.slug ? (
            <Link
              to={`/post/${post.slug}`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-blue-700 to-blue-900 px-4 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-18px_rgba(30,64,175,0.75)]"
            >
              <Eye className="h-4 w-4" />
              مشاهده آگهی
            </Link>
          ) : (
            <div className="hidden xl:block" />
          )}
        </div>
      </div>
    </article>
  );
}