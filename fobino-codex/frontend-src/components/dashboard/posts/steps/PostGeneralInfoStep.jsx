function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-slate-900">{label}</label>
      {children}
      {hint ? <p className="mt-2 text-xs leading-6 text-slate-400">{hint}</p> : null}
    </div>
  );
}

export default function PostGeneralInfoStep({ form, onChange }) {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.25)] md:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-black text-slate-950">اطلاعات عمومی آگهی</h2>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          عنوان، توضیحات، کلیدواژه‌ها و تاریخ پایان نمایش آگهی را در این بخش تکمیل کن.
        </p>
      </div>

      <div className="grid gap-5">
        <Field label="عنوان آگهی" hint="بین ۵ تا ۲۰۰ کاراکتر">
          <input
            type="text"
            value={form.title}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder="مثلاً فروش عمده پلی‌اتیلن سبک"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </Field>

        <Field label="توضیحات آگهی" hint="حداقل ۲۰ کاراکتر">
          <textarea
            rows={6}
            value={form.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="جزئیات مهم آگهی، شرایط همکاری، مشخصات محصول یا نیازمندی را بنویس..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium leading-7 text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="کلمات کلیدی" hint="با ویرگول یا خط جدید جدا کن">
            <textarea
              rows={4}
              value={form.keywordsText}
              onChange={(e) => onChange('keywordsText', e.target.value)}
              placeholder="پلی اتیلن، مواد اولیه، پتروشیمی"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium leading-7 text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </Field>

          <Field label="تاریخ پایان نمایش آگهی" hint="در صورت خالی بودن، بک‌اند مقدار پیش‌فرض می‌گذارد">
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => onChange('expiresAt', e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </Field>
        </div>
      </div>
    </section>
  );
}