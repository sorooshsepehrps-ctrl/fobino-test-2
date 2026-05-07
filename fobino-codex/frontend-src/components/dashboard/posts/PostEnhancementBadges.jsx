import { ArrowUp, Sparkles } from 'lucide-react';

export default function PostEnhancementBadges({
  isSpecialActive = false,
  isNardebanActive = false,
}) {
  if (!isSpecialActive && !isNardebanActive) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isNardebanActive ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-gradient-to-r from-red-50 to-red-100 px-3 py-1 text-xs font-black text-red-600">
          <ArrowUp className="h-3.5 w-3.5" />
          نردبان
        </span>
      ) : null}

      {isSpecialActive ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-100 px-3 py-1 text-xs font-black text-amber-700">
          <Sparkles className="h-3.5 w-3.5" />
          ویژه
        </span>
      ) : null}
    </div>
  );
}