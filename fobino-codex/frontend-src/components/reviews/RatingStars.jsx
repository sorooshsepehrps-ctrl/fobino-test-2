import { Star } from 'lucide-react';

export default function RatingStars({ value = 0, size = 18, showValue = false }) {
  const rating = Math.max(0, Math.min(5, Number(value || 0)));
  return (
    <div className="inline-flex items-center gap-1" dir="ltr" aria-label={`${rating} از ۵`}>
      {Array.from({ length: 5 }).map((_, index) => {
        const active = index < Math.round(rating);
        return <Star key={index} width={size} height={size} className={active ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />;
      })}
      {showValue && <span className="ml-1 text-sm font-black text-slate-700">{rating.toFixed(1)}</span>}
    </div>
  );
}
