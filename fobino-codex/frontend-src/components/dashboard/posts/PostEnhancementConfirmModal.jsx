import { ArrowUp, Loader2, Sparkles, Wallet, X } from 'lucide-react';

export default function PostEnhancementConfirmModal({
  open,
  type = 'special',
  post,
  amount = 0,
  onClose,
  onConfirm,
  isSubmitting = false,
}) {
  if (!open || !post) return null;

  const isSpecial = type === 'special';
  const title = isSpecial ? 'فعال‌سازی آگهی ویژه' : 'فعال‌سازی نردبان';
  const icon = isSpecial ? (
    <Sparkles className="h-5 w-5" />
  ) : (
    <ArrowUp className="h-5 w-5" />
  );

  const accentClass = isSpecial
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-red-50 text-red-600 border-red-200';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.45)]">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${accentClass}`}>
            {icon}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="بستن"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <h3 className="text-lg font-black text-slate-950">{title}</h3>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          برای آگهی <span className="font-black text-slate-800">{post?.title || 'بدون عنوان'}</span> این
          مبلغ از کیف پول شما کسر خواهد شد.
        </p>

        <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm">
              <Wallet className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400">مبلغ قابل کسر از کیف پول</p>
              <p className="mt-1 text-lg font-black text-slate-950">
                {Number(amount || 0).toLocaleString('fa-IR')} ریال
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[24px] border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-black text-blue-900">نکته</p>
          <p className="mt-2 text-sm leading-7 text-blue-800">
            بعد از تایید، عملیات پرداخت از کیف پول انجام می‌شود و در صورت موفقیت، وضعیت آگهی بلافاصله
            به‌روزرسانی خواهد شد.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-blue-700 to-blue-900 px-5 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-18px_rgba(30,64,175,0.78)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
            تایید و پرداخت
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}