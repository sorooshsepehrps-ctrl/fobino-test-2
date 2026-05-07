
import React from 'react';

const AnonymousCounterpartyBadge = ({
  counterparty,
  showRating = false,
  compact = false,
}) => {
  const roleLabel = counterparty?.label || (counterparty?.role === 'provider' ? 'تامین‌کننده' : 'دراپ‌شیپر');
  const average = counterparty?.rating?.averageStars || counterparty?.rating?.average || 0;
  const total = counterparty?.rating?.totalRatings || counterparty?.rating?.count || 0;

  return (
    <div
      className={`inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white ${
        compact ? 'px-3 py-2' : 'px-4 py-3'
      }`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-sm font-black text-slate-700">
        {counterparty?.role === 'provider' ? 'T' : 'D'}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-slate-500">طرف مقابل</p>
        <p className="truncate text-sm font-bold text-slate-900">{roleLabel}</p>
      </div>

      {showRating ? (
        <div className="mr-1 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <span className="font-black">★ {average ? Number(average).toFixed(1) : '0.0'}</span>
          <span className="mr-1 text-amber-600">({total})</span>
        </div>
      ) : null}
    </div>
  );
};

export default AnonymousCounterpartyBadge;
