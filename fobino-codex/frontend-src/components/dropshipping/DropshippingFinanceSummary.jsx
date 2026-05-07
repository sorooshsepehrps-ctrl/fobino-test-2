
import React from 'react';

const cardClass =
  'rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md';

const valueOf = (value) => `${Number(value || 0).toLocaleString('fa-IR')} تومان`;

const DropshippingFinanceSummary = ({ summary }) => {
  const cards = [
    {
      title: 'جمع مبالغ بلوکه‌شده',
      value: summary?.blockedAmount,
      hint: 'مبالغی که هنوز نهایی نشده‌اند',
    },
    {
      title: 'درآمد آزادشده',
      value: summary?.releasedAmount,
      hint: 'مبالغ آزادشده و نهایی',
    },
    {
      title: 'بازگشت وجه',
      value: summary?.refundedAmount,
      hint: 'مبالغ برگشت‌خورده',
    },
    {
      title: 'کارمزد فوبینو',
      value: summary?.feeAmount,
      hint: 'کارمزدهای ثبت‌شده',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.title} className={cardClass}>
          <p className="text-xs font-semibold text-slate-500">{card.title}</p>
          <h3 className="mt-3 text-xl font-black tracking-tight text-slate-900 md:text-2xl">
            {valueOf(card.value)}
          </h3>
          <p className="mt-2 text-xs leading-6 text-slate-500">{card.hint}</p>
        </div>
      ))}
    </div>
  );
};

export default DropshippingFinanceSummary;
