function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export default function UserScoreRadialChart({ score = 0, max = 65, grade = 'D' }) {
  const safeMax = max || 65;
  const pct = clamp(Math.round((Number(score || 0) / safeMax) * 100));
  const ringColor = grade === 'A+' || grade === 'A' ? '#059669' : grade === 'B' ? '#2563eb' : grade === 'C' ? '#d97706' : '#e11d48';

  return (
    <div className="relative flex h-60 w-60 shrink-0 items-center justify-center rounded-full bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.12)]" aria-label={`امتیاز ${score} از ${safeMax}`}>
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: `conic-gradient(${ringColor} ${pct}%, #eef2f7 0)` }}
      />
      <div className="absolute inset-3 rounded-full bg-white" />
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center rounded-full bg-gradient-to-b from-white to-slate-50 text-center">
        <span className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">Trust Score</span>
        <span className="mt-3 text-6xl font-black text-slate-950">{score}</span>
        <span className="mt-1 text-sm font-bold text-slate-500">از {safeMax} امتیاز</span>
        <span className="mt-4 rounded-full bg-slate-100 px-4 py-1.5 text-xs font-black text-slate-600">{pct}٪ تکمیل</span>
      </div>
    </div>
  );
}
