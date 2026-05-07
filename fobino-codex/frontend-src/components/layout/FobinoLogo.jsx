import { Link } from 'react-router-dom';
import { Hexagon } from 'lucide-react';
import { clsx } from 'clsx';

export default function FobinoLogo({
  to = '/',
  compact = false,
  light = false,
  className = '',
}) {
  return (
    <Link
      to={to}
      className={clsx(
        'group inline-flex items-center gap-3 rounded-2xl transition-transform duration-200 hover:scale-[1.01]',
        className
      )}
      aria-label="فوبینو"
    >
      <span
        className={clsx(
          'relative flex items-center justify-center rounded-2xl shadow-lg ring-1',
          compact ? 'h-10 w-10' : 'h-11 w-11',
          light
            ? 'bg-white/10 text-white ring-white/20'
            : 'bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 text-white ring-blue-200'
        )}
      >
        <Hexagon className={compact ? 'h-5 w-5' : 'h-6 w-6'} />
        <span className="absolute inset-[7px] rounded-xl border border-white/20" />
      </span>

      {!compact && (
        <span className="flex flex-col leading-none">
          <span
            className={clsx(
              'text-lg font-black tracking-tight',
              light ? 'text-white' : 'text-slate-950'
            )}
          >
            فوبینو
          </span>
          <span
            className={clsx(
              'text-[11px] font-medium',
              light ? 'text-white/75' : 'text-slate-500'
            )}
          >
            بازار هوشمند خرید و فروش
          </span>
        </span>
      )}
    </Link>
  );
}