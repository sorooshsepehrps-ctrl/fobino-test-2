import { Clock3, MessageSquare, Star, TrendingUp, Trophy } from 'lucide-react';

function StatCard({ icon: Icon, label, value, helper }) {
  return (
    <div className="group overflow-hidden rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-900/5" dir="rtl">
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700 ring-1 ring-emerald-100 transition group-hover:scale-105"><Icon className="h-6 w-6" /></div>
        <div className="text-left text-xs font-bold text-slate-400">فوبینو</div>
      </div>
      <p className="mt-4 text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-black text-slate-900">{value}</p>
      {helper && <p className="mt-2 text-xs leading-6 text-slate-500">{helper}</p>}
    </div>
  );
}

export default function PublicUserStats({ profile }) {
  const summary = profile?.reviewSummary || {};
  const analysis = profile?.analysisSummary || {};
  const completedDeals = profile?.completedDealsCount ?? profile?.user?.completedDealsCount ?? analysis?.completedDealsCount ?? 0;
  const response = profile?.responseTimeSummary || analysis?.responseTimeSummary;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard icon={Star} label="میانگین امتیاز" value={Number(summary.averageRating || 0).toFixed(1)} helper={`${summary.reviewsCount || 0} نظر ثبت‌شده`} />
      <StatCard icon={MessageSquare} label="تعداد نظرها" value={summary.reviewsCount || 0} helper="نظرات پس از معامله کامل" />
      <StatCard icon={TrendingUp} label="امتیاز اعتماد" value={`${analysis.totalScore || 0}/${analysis.maxScore || 65}`} helper="محاسبه‌شده با معیارهای شفاف" />
      <StatCard icon={Trophy} label="گرید کاربر" value={analysis.grade || 'D'} helper="سطح اعتبار عمومی" />
      <StatCard icon={Clock3} label="معاملات موفق" value={completedDeals} helper={response?.label || 'بر اساس معاملات تکمیل‌شده'} />
    </div>
  );
}
