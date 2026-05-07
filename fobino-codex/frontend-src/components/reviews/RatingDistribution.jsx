export default function RatingDistribution({ distribution = {}, total = 0 }) {
  const safeTotal = Number(total || 0);
  const getCount = (star) => Number(distribution?.[star] ?? distribution?.[String(star)] ?? 0);

  return (
    <div className="space-y-2" dir="rtl">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = getCount(star);
        const percent = safeTotal ? Math.round((count / safeTotal) * 100) : 0;
        return (
          <div key={star} className="grid grid-cols-[48px_minmax(0,1fr)_42px] items-center gap-2 text-xs font-bold text-slate-500">
            <span>{star} ستاره</span>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${percent}%` }} />
            </div>
            <span className="text-left tabular-nums">{count}</span>
          </div>
        );
      })}
    </div>
  );
}
