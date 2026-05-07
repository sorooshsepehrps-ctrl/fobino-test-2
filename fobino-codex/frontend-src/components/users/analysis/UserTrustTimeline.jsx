import { ShieldCheck, Clock3, BadgeCheck, Star } from 'lucide-react';

function TimelineItem({ active, title, description, icon: Icon }) {
  return (
    <div className="relative flex gap-4">
      <div className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
        <Icon size={20} />
      </div>
      <div className="pb-7">
        <h3 className="font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-7 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export default function UserTrustTimeline({ analysis }) {
  const facts = analysis?.facts || {};
  const breakdown = analysis?.breakdown || [];
  const byKey = Object.fromEntries(breakdown.map((item) => [item.key, item]));

  const items = [
    {
      icon: ShieldCheck,
      active: Boolean(byKey.identity_verification?.passed),
      title: 'احراز هویت',
      description: byKey.identity_verification?.passed ? 'هویت کاربر تایید شده و قابل اتکا است.' : 'احراز هویت هنوز کامل نشده است.',
    },
    {
      icon: BadgeCheck,
      active: Boolean(facts.hasActiveSubscription),
      title: 'اشتراک فعال',
      description: facts.hasActiveSubscription ? `اشتراک ${facts.subscriptionPlan || 'فعال'} برای کاربر ثبت شده است.` : 'اشتراک فعالی برای کاربر ثبت نشده است.',
    },
    {
      icon: Clock3,
      active: Boolean(byKey.response_speed?.passed),
      title: 'سرعت پاسخگویی',
      description: facts.averageResponseTimeMinutes == null ? 'داده کافی برای سرعت پاسخگویی وجود ندارد.' : `میانگین پاسخگویی ${facts.averageResponseTimeMinutes} دقیقه است.`,
    },
    {
      icon: Star,
      active: Number(facts.completedDealsCount || 0) > 0,
      title: 'معامله موفق',
      description: `${facts.completedDealsCount || 0} معامله موفق در شاخص اعتماد ثبت شده است.`,
    },
  ];

  return (
    <section className="rounded-[32px] bg-white p-5 shadow-sm" dir="rtl">
      <div className="mb-5">
        <p className="text-sm font-bold text-emerald-600">مسیر اعتماد</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">نمای سریع وضعیت کاربر</h2>
      </div>
      <div className="relative">
        <div className="absolute right-5 top-2 h-[calc(100%-24px)] w-px bg-slate-100" />
        {items.map((item) => <TimelineItem key={item.title} {...item} />)}
      </div>
    </section>
  );
}
