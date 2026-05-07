import { ShoppingBag, ShoppingCart } from 'lucide-react';
import { clsx } from 'clsx';

const tabs = [
  { value: 'sell', label: 'آگهی‌های فروش', icon: ShoppingBag },
  { value: 'buy', label: 'آگهی‌های خرید', icon: ShoppingCart },
];

export default function MyPostsTabs({ value = 'sell', onChange }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.value === value;

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange?.(tab.value)}
            className={clsx(
              'flex items-center justify-between rounded-[24px] border p-4 text-right transition',
              isActive
                ? tab.value === 'buy'
                  ? 'border-red-200 bg-red-50'
                  : 'border-blue-200 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={clsx(
                  'inline-flex h-11 w-11 items-center justify-center rounded-2xl',
                  isActive
                    ? tab.value === 'buy'
                      ? 'bg-red-600 text-white'
                      : 'bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-600'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-black text-slate-900">{tab.label}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}