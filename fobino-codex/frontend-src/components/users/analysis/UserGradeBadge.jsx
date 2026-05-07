const gradeStyles = {
  'A+': {
    pill: 'from-emerald-600 to-teal-500 text-white ring-emerald-200 shadow-emerald-200/70',
    dot: 'bg-white/90',
  },
  A: {
    pill: 'from-emerald-100 to-green-50 text-emerald-800 ring-emerald-200 shadow-emerald-100',
    dot: 'bg-emerald-500',
  },
  B: {
    pill: 'from-blue-100 to-sky-50 text-blue-800 ring-blue-200 shadow-blue-100',
    dot: 'bg-blue-500',
  },
  C: {
    pill: 'from-amber-100 to-orange-50 text-amber-800 ring-amber-200 shadow-amber-100',
    dot: 'bg-amber-500',
  },
  D: {
    pill: 'from-rose-100 to-slate-50 text-rose-800 ring-rose-200 shadow-rose-100',
    dot: 'bg-rose-500',
  },
};

export default function UserGradeBadge({ grade = 'D', label, size = 'md', className = '' }) {
  const style = gradeStyles[grade] || gradeStyles.D;
  const sizeClass = size === 'lg' ? 'px-5 py-3 text-base' : 'px-4 py-2 text-sm';

  return (
    <span className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-l font-black ring-1 shadow-sm ${style.pill} ${sizeClass} ${className}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
      <span>Grade {grade}</span>
      {label ? <span className="text-xs font-bold opacity-80">{label}</span> : null}
    </span>
  );
}
