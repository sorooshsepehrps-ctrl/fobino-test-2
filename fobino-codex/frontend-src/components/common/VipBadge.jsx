import { Crown } from 'lucide-react';

export default function VipBadge({ active = false, compact = false, className = '' }) {
  if (!active) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 text-blue-800 shadow-sm ${compact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'} font-black ${className}`}
      title="کاربر دارای اشتراک VIP فعال است"
    >
      <Crown className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      VIP
    </span>
  );
}
