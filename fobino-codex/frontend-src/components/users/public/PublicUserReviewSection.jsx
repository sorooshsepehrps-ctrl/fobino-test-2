import { useMemo, useState } from 'react';
import { Filter, Loader2, MessageSquareText, Star } from 'lucide-react';
import userReviewService from '../../../services/userReviewService';
import RatingDistribution from '../../reviews/RatingDistribution';
import ReviewCard from './ReviewCard';

const unwrapList = (response) => {
  const data = response?.data?.data || response?.data || response;
  return data?.reviews || data?.items || data || [];
};

export default function PublicUserReviewSection({ profile, onReviewsChange }) {
  const [rating, setRating] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const reviews = profile?.recentReviews || [];
  const summary = profile?.reviewSummary || {};
  const hasReviews = reviews.length > 0;

  const averageLabel = useMemo(() => Number(summary.averageRating || 0).toFixed(1), [summary.averageRating]);

  async function filter(nextRating) {
    setRating(nextRating);
    if (!profile?.user?.id && !profile?.user?._id) return;
    setLoading(true);
    setError('');
    try {
      const res = await userReviewService.getUserReviews(profile.user.id || profile.user._id, { rating: nextRating || undefined, page: 1, limit: 10 });
      onReviewsChange?.(unwrapList(res));
    } catch (err) {
      setError(err?.response?.data?.message || 'دریافت نظرها انجام نشد. دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-100" dir="rtl">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><MessageSquareText className="h-6 w-6" /></div>
          <div>
            <h2 className="text-xl font-black text-slate-900">نظرهای کاربران</h2>
            <p className="mt-1 text-sm text-slate-500">میانگین {averageLabel} از {summary.reviewsCount || 0} نظر معتبر پس از معامله</p>
          </div>
        </div>
        <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
          <Filter className="h-4 w-4" />
          <select value={rating} onChange={(event) => filter(event.target.value)} className="bg-transparent outline-none">
            <option value="">همه امتیازها</option>
            {[5, 4, 3, 2, 1].map((item) => <option key={item} value={item}>{item} ستاره</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100">
          <div className="mb-4 text-center">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl font-black text-slate-900 shadow-sm ring-1 ring-slate-100">{averageLabel}</div>
            <div className="mt-3 flex justify-center text-amber-400"><Star className="h-5 w-5 fill-current" /></div>
          </div>
          <RatingDistribution distribution={summary.distribution} total={summary.reviewsCount} />
        </div>

        <div className="min-h-[260px] space-y-3">
          {loading && <div className="flex h-48 items-center justify-center rounded-3xl bg-slate-50 text-slate-500"><Loader2 className="ml-2 h-5 w-5 animate-spin" />در حال دریافت نظرها...</div>}
          {!loading && error && <div className="rounded-3xl bg-red-50 p-5 text-sm font-bold text-red-700 ring-1 ring-red-100">{error}</div>}
          {!loading && !error && hasReviews && reviews.map((review) => <ReviewCard key={review.id || review._id} review={review} />)}
          {!loading && !error && !hasReviews && (
            <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-3xl bg-slate-50 p-8 text-center ring-1 ring-slate-100">
              <div className="rounded-3xl bg-white p-4 text-slate-400 shadow-sm"><MessageSquareText className="h-9 w-9" /></div>
              <h3 className="mt-4 text-lg font-black text-slate-800">هنوز نظری ثبت نشده است</h3>
              <p className="mt-2 max-w-md text-sm leading-7 text-slate-500">نظرها فقط بعد از تکمیل معامله قابل ثبت هستند تا اعتبار صفحه عمومی واقعی و قابل اعتماد بماند.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
