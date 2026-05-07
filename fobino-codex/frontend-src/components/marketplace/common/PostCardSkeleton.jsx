export default function PostCardSkeleton({ withImage = true }) {
  return (
    <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_60px_-40px_rgba(15,23,42,0.28)]">
      {withImage ? <div className="h-56 animate-pulse bg-slate-200" /> : null}

      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="h-8 w-24 animate-pulse rounded-full bg-slate-200" />
          <div className="h-5 w-20 animate-pulse rounded-full bg-slate-200" />
        </div>

        <div className="space-y-2">
          <div className="h-6 w-3/4 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-4 w-full animate-pulse rounded-xl bg-slate-200" />
          <div className="h-4 w-4/5 animate-pulse rounded-xl bg-slate-200" />
        </div>

        <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 animate-pulse rounded-2xl bg-slate-200" />
            <div className="space-y-2">
              <div className="h-4 w-28 animate-pulse rounded-lg bg-slate-200" />
              <div className="h-3 w-20 animate-pulse rounded-lg bg-slate-200" />
            </div>
          </div>
          <div className="h-10 w-28 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}