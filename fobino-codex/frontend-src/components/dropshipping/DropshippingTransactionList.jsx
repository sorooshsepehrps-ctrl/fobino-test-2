
import React from 'react';
import EmptyState from './EmptyState';
import StatusBadge from './StatusBadge';

const formatAmount = (amount) =>
  `${Number(amount || 0).toLocaleString('fa-IR')} تومان`;

const DropshippingTransactionList = ({ items = [], loading = false }) => {
  if (loading) return null;

  if (!items.length) {
    return (
      <EmptyState
        icon="💳"
        title="تراکنش دراپ‌شیپینگ یافت نشد"
        description="هنوز تراکنشی برای این بخش ثبت نشده است یا نتیجه‌ای مطابق فیلترهای شما پیدا نشد."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const title = item.title || item.displayTitle || item.meta?.title || 'تراکنش دراپ‌شیپینگ';
        const subtitle = item.subtitle || item.displaySubtitle || item.meta?.subtitle || '---';
        const amount = item.amount ?? item.displayAmount ?? 0;
        const status = item.settlementStatus || item.paymentStatus || item.status;
        const createdAt = item.createdAt || item.date;
        const rfpCode = item.rfpCode || item.meta?.rfpCode || item.metadata?.rfpCode;

        return (
          <div
            key={item._id || `${title}-${createdAt}`}
            className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:p-5"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 md:text-base">{title}</h3>
                  {status ? <StatusBadge status={status} /> : null}
                </div>

                <p className="mt-2 text-xs leading-6 text-slate-500 md:text-sm">{subtitle}</p>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  {rfpCode ? (
                    <span className="rounded-xl bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                      {rfpCode}
                    </span>
                  ) : null}
                  <span>{createdAt ? new Date(createdAt).toLocaleString('fa-IR') : '---'}</span>
                </div>
              </div>

              <div className="shrink-0 text-left md:text-right">
                <div className="text-sm font-black text-slate-900 md:text-base">{formatAmount(amount)}</div>
                {item.feeAmount ? (
                  <div className="mt-2 text-xs text-slate-500">
                    کارمزد: {formatAmount(item.feeAmount)}
                  </div>
                ) : null}
                {item.netAmount ? (
                  <div className="mt-1 text-xs text-slate-500">
                    خالص: {formatAmount(item.netAmount)}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DropshippingTransactionList;
