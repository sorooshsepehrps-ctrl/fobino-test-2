import { ShoppingBag, ShoppingCart } from 'lucide-react';
import { clsx } from 'clsx';
import { POST_TYPE_OPTIONS } from '../../../../utils/postDashboard';

const iconMap = {
  sell: ShoppingBag,
  buy: ShoppingCart,
};

export default function PostTypeStep({ value = 'sell', onChange }) {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.25)] md:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-black text-slate-950">نوع آگهی را انتخاب کن</h2>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          در مراحل بعدی فرم، با توجه به انتخاب خرید یا فروش، فیلدهای مخصوص همان نوع نمایش داده
          می‌شود.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {POST_TYPE_OPTIONS.map((item) => {
          const Icon = iconMap[item.value];
          const isActive = value === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange?.(item.value)}
              className={clsx(
                'group rounded-[28px] border p-5 text-right transition duration-300',
                isActive
                  ? item.value === 'buy'
                    ? 'border-red-200 bg-gradient-to-br from-red-50 via-white to-red-50'
                    : 'border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50'
                  : 'border-slate-200 bg-white hover:-translate-y-1 hover:shadow-[0_24px_70px_-40px_rgba(15,23,42,0.22)]'
              )}
            >
              <div
                className={clsx(
                  'mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl',
                  isActive
                    ? item.value === 'buy'
                      ? 'bg-red-600 text-white'
                      : 'bg-blue-700 text-white'
                    : item.value === 'buy'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-blue-50 text-blue-700'
                )}
              >
                <Icon className="h-7 w-7" />
              </div>

              <h3 className="text-lg font-black text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">{item.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}