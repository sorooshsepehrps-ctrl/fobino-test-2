import { Mail, MessageCircle, Phone, X } from 'lucide-react';

export default function ContactInfoModal({
  open,
  onClose,
  data,
  post,
  onStartChat,
  isStartingChat = false,
}) {
  if (!open || !data) return null;

  const phone = data?.phone || data?.contact?.phone || data?.user?.phone || '—';
  const email = data?.email || data?.contact?.email || data?.user?.email || '—';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.45)]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-950">اطلاعات تماس</h3>
            <p className="mt-1 text-sm text-slate-500">
              {post?.title || 'آگهی انتخاب‌شده'}
            </p>
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

        <div className="space-y-4">
          <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-500">
              <Phone className="h-4 w-4" />
              <span className="text-sm font-bold">شماره تماس</span>
            </div>
            <p className="text-base font-black text-slate-950" dir="ltr">
              {phone}
            </p>
          </div>

          <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-500">
              <Mail className="h-4 w-4" />
              <span className="text-sm font-bold">ایمیل</span>
            </div>
            <p className="text-base font-black text-slate-950 break-all" dir="ltr">
              {email}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onStartChat?.(post)}
            disabled={isStartingChat}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-blue-700 to-blue-900 px-5 py-3.5 text-sm font-bold text-white shadow-[0_16px_34px_-20px_rgba(30,64,175,0.8)] transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            <MessageCircle className="h-4 w-4" />
            {isStartingChat ? 'در حال آماده‌سازی چت...' : 'شروع چت'}
          </button>
        </div>
      </div>
    </div>
  );
}