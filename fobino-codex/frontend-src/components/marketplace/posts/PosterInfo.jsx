import { MapPin, ShieldCheck } from 'lucide-react';
import { getUserAvatar, getUserDisplayName } from '../../../utils/marketplace';

export default function PosterInfo({ user, meta = '', compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={getUserAvatar(user)}
        alt={getUserDisplayName(user)}
        className={compact ? 'h-10 w-10 rounded-2xl object-cover' : 'h-12 w-12 rounded-2xl object-cover'}
      />

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-black text-slate-900">
            {getUserDisplayName(user)}
          </p>
          {user?.isVerified || user?.verified || user?.verifications?.identity ? (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-blue-700">
              <ShieldCheck className="h-3.5 w-3.5" />
            </span>
          ) : null}
        </div>

        {meta ? (
          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{meta}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}