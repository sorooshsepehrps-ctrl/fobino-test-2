import { CheckCircle2, ListChecks } from 'lucide-react';

function normalizeFeatures(post) {
  const list = [];

  if (Array.isArray(post?.features)) {
    list.push(...post.features.filter(Boolean));
  }

  if (Array.isArray(post?.tags)) {
    list.push(...post.tags.filter(Boolean));
  }

  if (post?.brand) list.push(`برند: ${post.brand}`);
  if (post?.model) list.push(`مدل: ${post.model}`);
  if (post?.condition) list.push(`وضعیت: ${post.condition}`);
  if (post?.quantity) list.push(`تعداد: ${post.quantity}`);

  return [...new Set(list)];
}

export default function PostFeaturesCard({ post }) {
  const features = normalizeFeatures(post);

  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.28)] md:p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <ListChecks className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-950 md:text-xl">ویژگی‌ها و نکات مهم</h2>
          <p className="mt-1 text-sm text-slate-500">مشخصات کلیدی این آگهی</p>
        </div>
      </div>

      {features.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {features.map((feature, index) => (
            <div
              key={`${feature}-${index}`}
              className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-700" />
              <p className="text-sm font-semibold leading-7 text-slate-700">{feature}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[24px] bg-slate-50 p-5 text-sm leading-8 text-slate-500">
          ویژگی خاصی برای این آگهی ثبت نشده است.
        </div>
      )}
    </section>
  );
}