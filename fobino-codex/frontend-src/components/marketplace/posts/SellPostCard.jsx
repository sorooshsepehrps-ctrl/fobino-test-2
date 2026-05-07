import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, PhoneCall } from 'lucide-react';
import PosterInfo from './PosterInfo';
import PostCardEnhancementBadges from './PostCardEnhancementBadges';
import {
  buildPosterMeta,
  formatPrice,
  getPostPrimaryImage,
  getPostShortDescription,
  getPostTypeTheme,
  getPostViews,
  isPostNardebanActive,
  isPostSpecialActive,
} from '../../../utils/marketplace';

export default function SellPostCard({ post, onContactClick }) {
  const theme = getPostTypeTheme('sell');
  const isSpecialActive = isPostSpecialActive(post);
  const isNardebanActive = isPostNardebanActive(post);
  const views = getPostViews(post);

  return (
    <article
      className={`group overflow-hidden rounded-[32px] border bg-white shadow-[0_20px_60px_-40px_rgba(15,23,42,0.30)] transition duration-300 hover:-translate-y-1 ${
        isNardebanActive
          ? 'border-red-200 hover:shadow-[0_28px_80px_-42px_rgba(239,68,68,0.26)]'
          : isSpecialActive
          ? 'border-amber-200 hover:shadow-[0_28px_80px_-42px_rgba(245,158,11,0.22)]'
          : 'border-slate-200 hover:border-blue-200 hover:shadow-[0_28px_80px_-42px_rgba(30,64,175,0.30)]'
      }`}
    >
      <Link to={`/post/${post.slug}`} className="block overflow-hidden">
        <div className="relative h-60 overflow-hidden bg-slate-100">
          <img
            src={getPostPrimaryImage(post)}
            alt={post.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />

          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
            <div className="flex flex-col items-start gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${theme.badge}`}>
                آگهی فروش
              </span>

              <PostCardEnhancementBadges
                isSpecialActive={isSpecialActive}
                isNardebanActive={isNardebanActive}
              />
            </div>

            <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/70 px-3 py-1 text-xs font-bold text-white backdrop-blur">
              <Eye className="h-3.5 w-3.5" />
              {views.toLocaleString('fa-IR')}
            </span>
          </div>

          {isNardebanActive ? (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-red-500 via-red-400 to-blue-600" />
          ) : isSpecialActive ? (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-blue-600" />
          ) : null}
        </div>
      </Link>

      <div className="space-y-5 p-5">
        <div>
          <Link to={`/post/${post.slug}`}>
            <h3 className="line-clamp-1 text-lg font-black text-slate-950 transition group-hover:text-blue-700 md:text-xl">
              {post.title}
            </h3>
          </Link>

          <p className="mt-3 line-clamp-2 text-sm leading-7 text-slate-500">
            {getPostShortDescription(post)}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold text-slate-400">قیمت</p>
          <p className="mt-2 text-lg font-black text-slate-950">
            {post.displayPrice || formatPrice(post.price || post.minPricePerUnit)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <PosterInfo user={post.user} meta={buildPosterMeta(post)} />

          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => onContactClick(post)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <PhoneCall className="h-4 w-4" />
              اطلاعات تماس
            </button>

            <Link
              to={`/post/${post.slug}`}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-l from-blue-700 to-blue-900 px-4 py-2.5 text-sm font-bold text-white shadow-[0_14px_30px_-18px_rgba(30,64,175,0.75)] transition"
            >
              مشاهده آگهی
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:hidden">
          <button
            type="button"
            onClick={() => onContactClick(post)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <PhoneCall className="h-4 w-4" />
            تماس
          </button>

          <Link
            to={`/post/${post.slug}`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-blue-700 to-blue-900 px-4 py-3 text-sm font-bold text-white"
          >
            مشاهده
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}