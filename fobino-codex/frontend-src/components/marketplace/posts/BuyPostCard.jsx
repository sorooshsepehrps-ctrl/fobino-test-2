import { MessageCircle, PhoneCall } from 'lucide-react';
import PosterInfo from './PosterInfo';
import PostCardEnhancementBadges from './PostCardEnhancementBadges';
import {
  buildPosterMeta,
  formatPrice,
  getPostShortDescription,
  getPostTypeTheme,
  isPostNardebanActive,
  isPostSpecialActive,
} from '../../../utils/marketplace';

export default function BuyPostCard({ post, onContactClick }) {
  const theme = getPostTypeTheme('buy');
  const isSpecialActive = isPostSpecialActive(post);
  const isNardebanActive = isPostNardebanActive(post);

  return (
    <article
      className={`overflow-hidden rounded-[32px] border bg-white shadow-[0_20px_60px_-40px_rgba(15,23,42,0.30)] transition duration-300 hover:-translate-y-1 ${
        isNardebanActive
          ? 'border-red-200 hover:shadow-[0_28px_80px_-42px_rgba(239,68,68,0.22)]'
          : isSpecialActive
          ? 'border-amber-200 hover:shadow-[0_28px_80px_-42px_rgba(245,158,11,0.20)]'
          : 'border-slate-200 hover:border-red-200 hover:shadow-[0_28px_80px_-42px_rgba(239,68,68,0.22)]'
      }`}
    >
      <div className="relative p-5">
        <div
          className={`absolute inset-x-0 top-0 h-1 ${
            isNardebanActive
              ? 'bg-gradient-to-r from-red-500 via-red-400 to-blue-600'
              : isSpecialActive
              ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-blue-600'
              : 'bg-gradient-to-r from-red-500 via-red-400 to-blue-600'
          }`}
        />

        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col items-start gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${theme.badge}`}>
              آگهی خرید
            </span>

            <PostCardEnhancementBadges
              isSpecialActive={isSpecialActive}
              isNardebanActive={isNardebanActive}
            />
          </div>

          {post.remainingQuota !== undefined ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
              سهمیه باقی‌مانده: {Number(post.remainingQuota || 0).toLocaleString('fa-IR')}
            </span>
          ) : null}
        </div>

        <div className="mt-5">
          <h3 className="line-clamp-1 text-lg font-black text-slate-950 md:text-xl">
            {post.title}
          </h3>
          <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-500">
            {getPostShortDescription(post)}
          </p>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold text-slate-400">بودجه / قیمت موردنظر</p>
          <p className="mt-2 text-lg font-black text-slate-950">
            {post.displayPrice || formatPrice(post.maxBudget)}
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <PosterInfo user={post.user} meta={buildPosterMeta(post)} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onContactClick(post)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <PhoneCall className="h-4 w-4" />
            اطلاعات تماس
          </button>

          <button
            type="button"
            onClick={() => onContactClick(post)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-red-500 to-red-600 px-4 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-18px_rgba(239,68,68,0.75)] transition"
          >
            <MessageCircle className="h-4 w-4" />
            تماس و چت
          </button>
        </div>
      </div>
    </article>
  );
}