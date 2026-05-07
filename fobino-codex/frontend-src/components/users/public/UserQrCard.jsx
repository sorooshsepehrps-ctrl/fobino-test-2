import { Copy, ExternalLink, QrCode, Share2 } from 'lucide-react';
import Button from '../../ui/Button';

export default function UserQrCard({ profile, onOpenBusinessCard }) {
  const url = profile?.publicProfileUrl || (typeof window !== 'undefined' ? window.location.href : '');

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(url); } catch (_) {}
  };

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'پروفایل عمومی فوبینو', url }); } catch (_) {}
    } else {
      copyLink();
    }
  };

  return (
    <section className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-100" dir="rtl">
      <div className="bg-gradient-to-br from-slate-950 to-emerald-900 p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/20"><QrCode className="h-6 w-6" /></div>
          <div>
            <h2 className="text-xl font-black">QR پروفایل عمومی</h2>
            <p className="mt-1 text-xs text-emerald-50">اسکن QR همین صفحه عمومی را باز می‌کند.</p>
          </div>
        </div>
      </div>

      <div className="p-5 text-center">
        <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-[2rem] bg-slate-50 p-3 ring-1 ring-slate-100">
          {profile?.qrCodeDataUrl ? <img src={profile.qrCodeDataUrl} alt="QR Code" className="h-full w-full rounded-2xl bg-white object-contain p-2" /> : <QrCode className="h-20 w-20 text-slate-300" />}
        </div>
        <p className="mx-auto mt-4 max-w-[280px] break-all rounded-2xl bg-slate-50 px-3 py-2 text-xs leading-6 text-slate-500 ring-1 ring-slate-100">{url}</p>

        <div className="mt-5 grid gap-2">
          <Button className="w-full rounded-2xl font-black" onClick={onOpenBusinessCard} icon={QrCode}>نمایش کارت ویزیت</Button>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={copyLink} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"><Copy className="h-4 w-4" />کپی لینک</button>
            <button type="button" onClick={share} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"><Share2 className="h-4 w-4" />اشتراک</button>
          </div>
          {url && <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"><ExternalLink className="h-4 w-4" />باز کردن لینک عمومی</a>}
        </div>
      </div>
    </section>
  );
}
