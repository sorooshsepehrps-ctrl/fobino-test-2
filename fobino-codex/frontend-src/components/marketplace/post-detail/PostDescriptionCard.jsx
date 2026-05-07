import { FileText } from 'lucide-react';

export default function PostDescriptionCard({ description }) {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.28)] md:p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-950 md:text-xl">توضیحات آگهی</h2>
          <p className="mt-1 text-sm text-slate-500">جزئیات کامل ثبت‌شده توسط آگهی‌دهنده</p>
        </div>
      </div>

      <div className="rounded-[24px] bg-slate-50 p-5">
        <p className="whitespace-pre-line text-sm leading-8 text-slate-700 md:text-base">
          {description || 'برای این آگهی توضیحی ثبت نشده است.'}
        </p>
      </div>
    </section>
  );
}