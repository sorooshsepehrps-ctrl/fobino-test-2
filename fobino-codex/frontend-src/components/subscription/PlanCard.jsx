import { Building2, Crown, Info, Sparkles, Star } from 'lucide-react';
import { Button, Card } from '../ui';
import { toPersianNumber } from '../../utils/helpers';
import PlanFeatureList from './PlanFeatureList';
import { formatMinutesAsHours, getPlanCtaLabel } from './subscriptionUtils';

const planIcons = {
  vip: Sparkles,
  producer: Building2,
};

export default function PlanCard({ plan, isCurrentPlan, onSelect }) {
  const Icon = planIcons[plan.id] || Crown;
  const isProducer = plan.id === 'producer';

  return (
    <Card
      variant="wallet"
      padding="none"
      className={`relative overflow-hidden rounded-3xl ${isProducer ? 'ring-2 ring-red-500' : ''} ${isCurrentPlan ? 'opacity-75' : ''}`}
    >
      {isProducer && (
        <div className="bg-red-600 px-4 py-2 text-center text-sm font-bold text-white">
          پیشنهاد ویژه برای تولیدکنندگان
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white ${isProducer ? 'bg-gradient-to-br from-blue-900 to-red-600' : 'bg-gradient-to-br from-blue-900 to-indigo-700'}`}>
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
              <p className="mt-1 text-sm text-slate-500">اشتراک سالانه {plan.duration}</p>
            </div>
          </div>
          {isCurrentPlan && (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-900">فعال</span>
          )}
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">قیمت سالانه</p>
          <p className="mt-1 text-3xl font-black text-blue-950">{plan.priceDisplay}</p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3">
            <p className="text-xs text-blue-700">دسترسی تماس</p>
            <p className="mt-1 text-sm font-black text-blue-950">{toPersianNumber(plan.accessToBuyPosts || 85)} عدد</p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3">
            <p className="text-xs text-blue-700">مشاوره آنلاین</p>
            <p className="mt-1 text-sm font-black text-blue-950">{formatMinutesAsHours(plan.consultationOnlineIncludedMinutes)}</p>
          </div>
        </div>

        {isProducer && (
          <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-7 text-red-700">
            <div className="mb-2 flex items-center gap-1 text-red-800">
              {[0, 1, 2].map((index) => (
                <Star key={index} className="h-4 w-4" />
              ))}
              <span className="mr-2 font-bold">نشان ستاره‌ای تولیدکننده</span>
            </div>
            خرید پلن برای همه کاربران آزاد است؛ ستاره‌های تولیدکننده بعد از احراز سطح‌های ۱، ۲ و ۳ نمایش داده می‌شوند.
          </div>
        )}

        <div className="mt-6 border-t border-blue-50 pt-5">
          <PlanFeatureList features={plan.features} />
        </div>

        <div className="mt-6 flex items-start gap-2 rounded-2xl bg-blue-50 p-3 text-xs leading-6 text-blue-800">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>
            برای پرداخت با کیف پول، اگر موجودی کافی نباشد به صفحه شارژ هدایت می‌شوید و پس از شارژ می‌توانید با پارامترهای همان پلن برگردید.
          </span>
        </div>

        <Button
          variant={isProducer ? 'danger' : 'brand'}
          disabled={isCurrentPlan}
          onClick={() => onSelect(plan)}
          className={`mt-6 w-full ${isProducer ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-900 hover:bg-blue-950'}`}
        >
          {getPlanCtaLabel({ isCurrentPlan, planId: plan.id })}
        </Button>
      </div>
    </Card>
  );
}
