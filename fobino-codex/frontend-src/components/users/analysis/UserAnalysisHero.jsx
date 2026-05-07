import { Link } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Clock3, Shield, TrendingUp } from 'lucide-react';
import UserGradeBadge from './UserGradeBadge';
import UserScoreRadialChart from './UserScoreRadialChart';

function FactCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-3xl bg-white/75 p-4 shadow-sm ring-1 ring-white/70 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="rounded-2xl bg-emerald-50 p-2.5 text-emerald-700"><Icon size={20} /></span>
        <p className="text-xs font-black text-slate-500">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
      {hint ? <p className="mt-1 text-xs font-bold text-slate-400">{hint}</p> : null}
    </div>
  );
}

export default function UserAnalysisHero({ analysis, identifier }) {
  const gradeMeta = analysis?.gradeMeta || {};
  const facts = analysis?.facts || {};
  const user = analysis?.user || {};
  const displayName = user.businessName || user.fullName || 'کاربر فوبینو';

  return (
    <section className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 shadow-2xl" dir="rtl">
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="absolute -bottom-32 right-20 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="relative grid gap-8 p-6 md:p-8 lg:grid-cols-[1fr_280px] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <UserGradeBadge grade={analysis?.grade} label={gradeMeta.label} size="lg" />
            <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/80 ring-1 ring-white/15">تحلیل اعتمادپذیری</span>
          </div>
          <h1 className="mt-6 text-3xl font-black leading-tight text-white md:text-5xl">{displayName}</h1>
          <p className="mt-4 max-w-3xl text-base leading-9 text-slate-200">
            {gradeMeta.description || 'این امتیاز بر اساس تکمیل پروفایل، احراز هویت، اشتراک، سرعت پاسخگویی، معاملات موفق و وضعیت تولیدکنندگی محاسبه شده است.'}
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <FactCard icon={TrendingUp} label="معاملات موفق" value={facts.completedDealsCount ?? 0} hint="حداقل ۱ معامله برای امتیاز کامل" />
            <FactCard icon={Clock3} label="میانگین پاسخگویی" value={facts.averageResponseTimeMinutes == null ? '—' : `${facts.averageResponseTimeMinutes} دقیقه`} hint="هدف: کمتر از ۱۲۰ دقیقه" />
            <FactCard icon={BadgeCheck} label="اشتراک" value={facts.hasActiveSubscription ? facts.subscriptionPlan || 'فعال' : 'ندارد'} />
            <FactCard icon={Shield} label="تولیدکنندگی" value={facts.producerVerified ? 'تایید شده' : 'تکمیل نشده'} />
          </div>

          {identifier ? (
            <Link to={`/users/${identifier}`} className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:shadow-xl">
              بازگشت به پروفایل عمومی
              <ArrowLeft size={18} />
            </Link>
          ) : null}
        </div>

        <div className="flex justify-center lg:justify-end">
          <UserScoreRadialChart score={analysis?.totalScore || 0} max={analysis?.maxScore || 65} grade={analysis?.grade} />
        </div>
      </div>
    </section>
  );
}
