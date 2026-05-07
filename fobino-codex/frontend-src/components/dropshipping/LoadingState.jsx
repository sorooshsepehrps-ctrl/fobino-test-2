

import React from 'react';

const LoadingState = ({
  title = 'در حال بارگذاری...',
  description = 'لطفاً کمی صبر کنید.',
  compact = false,
}) => {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${
        compact ? 'p-4' : 'p-6 md:p-8'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 shrink-0 animate-pulse rounded-2xl bg-slate-200" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
          <div className="pt-1">
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
            <p className="mt-1 text-xs leading-6 text-slate-500">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingState;
