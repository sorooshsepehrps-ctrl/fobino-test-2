import { CalendarDays, Quote, ShieldCheck, UserRound } from 'lucide-react';
import RatingStars from '../../reviews/RatingStars';

const formatDate = (value) => value ? new Date(value).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
const roleLabel = (role) => role === 'buyer' ? 'خریدار' : role === 'seller' ? 'فروشنده' : 'کاربر';

export default function ReviewCard({ review }) {
  const reviewer = review?.reviewer || {};
  return (
    <article className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-900/5" dir="rtl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <UserRound className="h-6 w-6" />
          </div>
          <div>
            <p className="font-black text-slate-900">{reviewer.fullName || reviewer.businessName || 'کاربر فوبینو'}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 font-bold text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" />{roleLabel(review?.reviewerRole)}</span>
              {review?.createdAt && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatDate(review.createdAt)}</span>}
            </div>
          </div>
        </div>
        <RatingStars value={review?.rating || 0} />
      </div>

      <div className="mt-4 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100">
        <Quote className="h-5 w-5 text-emerald-600" />
        <p className="mt-2 whitespace-pre-line leading-8 text-slate-700">{review?.text}</p>
      </div>
      {(review?.deal?.title || review?.shipment?.title) && <p className="mt-3 text-xs font-bold text-slate-400">مرتبط با: {review?.deal?.title || review?.shipment?.title}</p>}
    </article>
  );
}
