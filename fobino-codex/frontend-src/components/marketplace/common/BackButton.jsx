import { ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';

export default function BackButton({ onClick, className = '', children = 'بازگشت' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition',
        'hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700',
        className
      )}
    >
      <ArrowRight className="h-4 w-4" />
      <span>{children}</span>
    </button>
  );
}