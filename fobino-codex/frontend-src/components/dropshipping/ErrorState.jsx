
import React from 'react';

const ErrorState = ({
  title = 'دریافت اطلاعات با مشکل روبه‌رو شد',
  description = 'لطفاً دوباره تلاش کنید.',
  onRetry,
  compact = false,
}) => {
  return (
    <div
      className={`rounded-2xl border border-rose-200 bg-rose-50 ${
        compact ? 'p-4' : 'p-6 md:p-8'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-lg">
          ⚠️
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-rose-900">{title}</h3>
          <p className="mt-2 text-xs leading-6 text-rose-700">{description}</p>

          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
            >
              تلاش مجدد
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ErrorState;
