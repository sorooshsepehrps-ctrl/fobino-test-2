
import React from 'react';
import { Link } from 'react-router-dom';

const EmptyState = ({
  title = 'موردی برای نمایش وجود ندارد',
  description = 'هنوز داده‌ای در این بخش ثبت نشده است.',
  actionLabel,
  actionTo,
  secondaryAction,
  icon = '📦',
}) => {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm md:p-12">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
        {icon}
      </div>

      <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-slate-500">{description}</p>

      {(actionLabel || secondaryAction) && (
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {actionLabel && actionTo ? (
            <Link
              to={actionTo}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {actionLabel}
            </Link>
          ) : null}

          {secondaryAction ? secondaryAction : null}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
