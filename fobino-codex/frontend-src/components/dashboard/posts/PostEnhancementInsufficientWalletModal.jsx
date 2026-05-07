import { AlertTriangle, Wallet, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PostEnhancementInsufficientWalletModal({
  open,
  type = 'special',
  amount = 0,
  onClose,
}) {
  if (!open) return null;

  const title = type === 'special' ? 'ویژه' : 'نردبان';

  return (
    <div className="fixed inset-0 z-[111] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.45)]">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="بستن"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <h3 className="text-lg font-black text-slate-950">موجودی کیف پول کافی نیست</h3>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          برای فعال‌سازی <span className="font-black text-slate-800">{title}</span>، کیف پول شما باید
          حداقل <span className="font-black text-slate-800"> {Number(amount || 0).toLocaleString('fa-IR')} ریال </span>
          موجودی داشته باشد.
        </p>

        <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm">
              <Wallet className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400">مبلغ موردنیاز</p>
              <p className="mt-1 text-lg font-black text-slate-950">
                {Number(amount || 0).toLocaleString('fa-IR')} ریال
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/dashboard/wallet"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-blue-700 to-blue-900 px-5 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-18px_rgba(30,64,175,0.78)]"
          >
            <Wallet className="h-4 w-4" />
            رفتن به کیف پول
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
}