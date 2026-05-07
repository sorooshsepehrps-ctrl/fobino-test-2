import { CheckCircle2, CircleAlert, ArrowUpRight } from 'lucide-react';

const criterionTone = {
  profile_completion: 'emerald',
  identity_verification: 'blue',
  active_subscription: 'violet',
  response_speed: 'cyan',
  completed_deal: 'amber',
  producer_verification: 'rose',
};

const toneClass = {
  emerald: { icon: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500', ring: 'ring-emerald-100' },
  blue: { icon: 'bg-blue-50 text-blue-600', bar: 'bg-blue-500', ring: 'ring-blue-100' },
  violet: { icon: 'bg-violet-50 text-violet-600', bar: 'bg-violet-500', ring: 'ring-violet-100' },
  cyan: { icon: 'bg-cyan-50 text-cyan-600', bar: 'bg-cyan-500', ring: 'ring-cyan-100' },
  amber: { icon: 'bg-amber-50 text-amber-600', bar: 'bg-amber-500', ring: 'ring-amber-100' },
  rose: { icon: 'bg-rose-50 text-rose-600', bar: 'bg-rose-500', ring: 'ring-rose-100' },
};

export default function AnalysisCriterionCard({ item }) {
  const pct = Math.min(100, Math.max(0, Math.round(((item?.score || 0) / (item?.maxScore || 1)) * 100)));
  const tone = toneClass[criterionTone[item?.key] || 'emerald'];

  return (
    <article className={`group rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm ring-1 ring-transparent transition duration-300 hover:-translate-y-1 hover:shadow-xl ${tone.ring}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`rounded-2xl p-2 ${item?.passed ? tone.icon : 'bg-slate-100 text-slate-500'}`}>
              {item?.passed ? <CheckCircle2 size={22} /> : <CircleAlert size={22} />}
            </span>
            <h3 className="text-base font-black text-slate-950">{item?.title}</h3>
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-500">{item?.description}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-3 py-2 text-left">
          <p className="text-lg font-black text-slate-950">{item?.score || 0}</p>
          <p className="text-xs font-bold text-slate-400">از {item?.maxScore || 0}</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-500">
          <span>{pct}٪</span>
          <span>{item?.passed ? 'کامل شده' : 'نیازمند اقدام'}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full transition-all duration-700 ${item?.passed ? tone.bar : 'bg-slate-300'}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {!item?.passed && item?.actionHint ? (
        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-slate-50 p-3 text-sm leading-7 text-slate-600">
          <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
          <span>{item.actionHint}</span>
        </div>
      ) : null}
    </article>
  );
}
