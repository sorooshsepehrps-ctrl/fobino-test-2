
export default function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
      <div className="grid lg:grid-cols-[220px_1fr]">
        <div className="min-h-[220px] animate-pulse bg-slate-100" />
        <div className="space-y-4 p-5 lg:p-6">
          <div className="h-6 w-56 animate-pulse rounded-xl bg-slate-100" />
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded-xl bg-slate-100" />
            <div className="h-4 w-4/5 animate-pulse rounded-xl bg-slate-100" />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="h-9 w-32 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-9 w-28 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-9 w-36 animate-pulse rounded-2xl bg-slate-100" />
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
