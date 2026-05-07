import { LayoutGrid, Sparkles } from 'lucide-react';

export default function PostWizardHeader({ type = 'sell' }) {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_25px_80px_-45px_rgba(15,23,42,0.25)] md:p-7">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.10),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.06),transparent_24%)]" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            <Sparkles className="h-3.5 w-3.5" />
            ویزارد ساخت آگهی
          </div>

          <h1 className="text-2xl font-black text-slate-950 md:text-4xl">
            ثبت {type === 'buy' ? 'آگهی خرید' : 'آگهی فروش'}
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
            این صفحه به‌صورت مرحله‌ای طراحی شده تا کاربر با کمترین سردرگمی، نوع آگهی، دسته‌بندی و
            اطلاعات پایه را وارد کند. در فاز بعدی فرم کامل همه فیلدها و submit نهایی تکمیل می‌شود.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-bold text-slate-400">ساختار</p>
            <p className="mt-2 text-sm font-black text-slate-900">مرحله‌ای و کاربرپسند</p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <p className="text-sm font-black text-slate-900">انتخاب سه‌سطحی دسته‌بندی</p>
          </div>
        </div>
      </div>
    </section>
  );
}