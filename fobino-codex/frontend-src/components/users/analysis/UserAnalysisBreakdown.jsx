import AnalysisCriterionCard from './AnalysisCriterionCard';

export default function UserAnalysisBreakdown({ breakdown = [] }) {
  const earned = breakdown.reduce((sum, item) => sum + Number(item?.score || 0), 0);
  const max = breakdown.reduce((sum, item) => sum + Number(item?.maxScore || 0), 0) || 65;

  return (
    <section className="space-y-5" dir="rtl">
      <div className="flex flex-col gap-3 rounded-[28px] bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold text-emerald-600">شفافیت امتیازدهی</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">ریز امتیازهای اعتماد</h2>
          <p className="mt-2 text-sm leading-7 text-slate-500">هر کارت نشان می‌دهد کاربر از هر معیار چه مقدار امتیاز گرفته و برای بهتر شدن چه کاری لازم است.</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-5 py-3 text-center">
          <p className="text-xs font-black text-slate-400">امتیاز کسب‌شده</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{earned}/{max}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {breakdown.map((item) => <AnalysisCriterionCard key={item.key} item={item} />)}
      </div>
    </section>
  );
}
