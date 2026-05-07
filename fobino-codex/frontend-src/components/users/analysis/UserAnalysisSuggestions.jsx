import { Lightbulb, Sparkles } from 'lucide-react';

export default function UserAnalysisSuggestions({ suggestions = [] }) {
  if (!suggestions.length) {
    return (
      <section className="rounded-[32px] border border-emerald-100 bg-gradient-to-l from-emerald-50 to-white p-6" dir="rtl">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-emerald-600 p-3 text-white"><Sparkles size={22} /></span>
          <div>
            <h2 className="text-xl font-black text-emerald-950">وضعیت عالی است</h2>
            <p className="mt-1 leading-7 text-emerald-800">همه معیارهای فعلی تکمیل شده‌اند و پیشنهادی برای بهبود باقی نمانده است.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[32px] border border-emerald-100 bg-gradient-to-l from-emerald-50 via-white to-white p-6" dir="rtl">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-emerald-600 p-3 text-white"><Lightbulb size={22} /></span>
          <div>
            <p className="text-sm font-bold text-emerald-700">Next best actions</p>
            <h2 className="text-xl font-black text-slate-950">پیشنهادهای بهبود Grade</h2>
          </div>
        </div>
        <p className="max-w-xl text-sm leading-7 text-slate-500">این پیشنهادها بر اساس امتیازهای نگرفته ساخته شده‌اند و به کاربر کمک می‌کنند سریع‌تر به Grade بالاتر برسد.</p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {suggestions.map((suggestion, index) => (
          <div key={suggestion.key || index} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-slate-950">{suggestion.title}</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">{suggestion.description}</p>
              </div>
              {suggestion.potentialScore ? <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">+{suggestion.potentialScore}</span> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
