import { Loader2 } from 'lucide-react';
import { Card } from '../ui';
import PlanCard from './PlanCard';

export default function PlanComparisonGrid({ plans, loading, currentPlan, onSelect }) {
  if (loading) {
    return (
      <Card variant="wallet" className="flex items-center justify-center gap-3 py-12 text-blue-900">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>در حال دریافت پلن‌های قابل خرید...</span>
      </Card>
    );
  }

  return (
    <section id="subscription-plans" className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-blue-800">مقایسه پلن‌های قابل خرید</p>
          <h2 className="text-2xl font-black text-slate-900">فقط دو اشتراک سالانه: VIP و تولیدکننده</h2>
        </div>
        <p className="max-w-md text-sm leading-7 text-slate-500">
          پلن‌ها از API اشتراک خوانده می‌شوند و فقط گزینه‌هایی نمایش داده می‌شوند که backend به عنوان قابل خرید معرفی کرده است.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={plan.id === currentPlan}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}
