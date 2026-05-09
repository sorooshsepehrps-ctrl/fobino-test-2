import { toPersianNumber } from '../../utils/helpers';

export default function SubscriptionEntitlementMeter({
  label,
  used = 0,
  total = 0,
  helper,
  color = 'blue',
}) {
  const normalizedTotal = Math.max(0, Number(total) || 0);
  const normalizedUsed = Math.min(Math.max(0, Number(used) || 0), normalizedTotal);
  const percent = normalizedTotal ? Math.round((normalizedUsed / normalizedTotal) * 100) : 0;
  const remaining = Math.max(0, normalizedTotal - normalizedUsed);
  const colorClass = color === 'red' ? 'bg-red-600' : 'bg-blue-800';

  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">{label}</p>
          {helper && <p className="mt-1 text-xs leading-6 text-slate-500">{helper}</p>}
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-900">
          {toPersianNumber(remaining)} باقی‌مانده
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`${colorClass} h-full rounded-full`} style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-500">
        <span>مصرف‌شده: {toPersianNumber(normalizedUsed)}</span>
        <span>کل: {toPersianNumber(normalizedTotal)}</span>
      </div>
    </div>
  );
}
