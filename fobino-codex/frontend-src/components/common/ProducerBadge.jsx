import { Factory, Star } from 'lucide-react';

export default function ProducerBadge({ active = false, level = 0, status, compact = false, className = '' }) {
  if (!active) return null;

  const normalizedLevel = Math.max(0, Math.min(3, Number(level) || 0));
  const title = normalizedLevel > 0
    ? `تولیدکننده احراز شده سطح ${normalizedLevel}`
    : 'اشتراک تولیدکننده فعال؛ احراز تولیدکننده هنوز تکمیل نشده است';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border shadow-sm ${
        normalizedLevel > 0
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-slate-200 bg-slate-50 text-slate-500'
      } ${compact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'} font-black ${className}`}
      title={title}
      aria-label={title}
    >
      <Factory className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      <span>{compact ? 'تولید' : normalizedLevel > 0 ? `تولیدکننده سطح ${normalizedLevel}` : 'تولیدکننده'}</span>
      <span className="mr-0.5 inline-flex items-center gap-0.5" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <Star
            key={index}
            className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} ${index < normalizedLevel ? 'fill-current' : 'fill-transparent opacity-50'}`}
          />
        ))}
      </span>
      {status === 'pending' && !compact ? <span className="text-[10px]">در بررسی</span> : null}
    </span>
  );
}
