import { useEffect, useMemo, useState } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import {
  PAYMENT_METHOD_OPTIONS,
  UNIT_OPTIONS,
  buildUpdatePostPayload,
  createEditablePostForm,
  fillEditablePostForm,
} from '../../../utils/postDashboard';

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-slate-900">{label}</label>
      {children}
      {hint ? <p className="mt-2 text-xs leading-6 text-slate-400">{hint}</p> : null}
    </div>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
    />
  );
}

export default function EditPostModal({
  open,
  post,
  onClose,
  onSubmit,
  isSubmitting = false,
}) {
  const [form, setForm] = useState(createEditablePostForm());

  useEffect(() => {
    if (!open || !post) return;
    setForm(fillEditablePostForm(post));
  }, [open, post]);

  const isSell = post?.type === 'sell';
  const isBuy = post?.type === 'buy';

  const titleText = useMemo(() => {
    if (isSell) return 'ویرایش آگهی فروش';
    if (isBuy) return 'ویرایش آگهی خرید';
    return 'ویرایش آگهی';
  }, [isSell, isBuy]);

  if (!open || !post) return null;

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const togglePaymentMethod = (method) => {
    setForm((prev) => {
      const exists = prev.paymentMethods.includes(method);
      const nextMethods = exists
        ? prev.paymentMethods.filter((item) => item !== method)
        : [...prev.paymentMethods, method];

      return {
        ...prev,
        paymentMethods: nextMethods.length ? nextMethods : ['cash'],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = buildUpdatePostPayload(post, form);
    await onSubmit?.(post, payload);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_30px_90px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 md:px-6">
          <div>
            <h3 className="text-lg font-black text-slate-950 md:text-xl">{titleText}</h3>
            <p className="mt-1 text-sm text-slate-500 line-clamp-1">
              {post?.title || 'بدون عنوان'}
            </p>
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

        <form onSubmit={handleSubmit}>
          <div className="max-h-[75vh] overflow-y-auto px-5 py-5 md:px-6 md:py-6">
            <div className="grid gap-6">
              <section className="rounded-[28px] border border-slate-200 bg-white p-5">
                <h4 className="text-base font-black text-slate-950">اطلاعات عمومی قابل ویرایش</h4>
                <p className="mt-1 text-sm text-slate-500">
                  فقط فیلدهایی که در سیاست فعلی قابل ویرایش هستند در این modal نمایش داده می‌شوند.
                </p>

                <div className="mt-5 grid gap-5">
                  <Field label="عنوان آگهی">
                    <Input
                      type="text"
                      value={form.title}
                      onChange={(e) => setField('title', e.target.value)}
                      placeholder="عنوان آگهی"
                    />
                  </Field>

                  <Field label="توضیحات آگهی">
                    <textarea
                      rows={5}
                      value={form.description}
                      onChange={(e) => setField('description', e.target.value)}
                      placeholder="توضیحات آگهی"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium leading-7 text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </Field>

                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="کلمات کلیدی" hint="با ویرگول یا خط جدید جدا کن">
                      <textarea
                        rows={4}
                        value={form.keywordsText}
                        onChange={(e) => setField('keywordsText', e.target.value)}
                        placeholder="مثلاً مواد اولیه، پلیمر، پلی‌اتیلن"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium leading-7 text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />
                    </Field>

                    <Field label="تاریخ پایان نمایش آگهی">
                      <Input
                        type="date"
                        value={form.expiresAt}
                        onChange={(e) => setField('expiresAt', e.target.value)}
                      />
                    </Field>
                  </div>
                </div>
              </section>

              {isSell ? (
                <section className="rounded-[28px] border border-slate-200 bg-white p-5">
                  <h4 className="text-base font-black text-slate-950">فیلدهای قابل ویرایش آگهی فروش</h4>

                  <div className="mt-5 grid gap-5 md:grid-cols-3">
                    <Field label="استان">
                      <Input
                        type="text"
                        value={form.province}
                        onChange={(e) => setField('province', e.target.value)}
                      />
                    </Field>

                    <Field label="شهر">
                      <Input
                        type="text"
                        value={form.city}
                        onChange={(e) => setField('city', e.target.value)}
                      />
                    </Field>

                    <Field label="آدرس">
                      <Input
                        type="text"
                        value={form.address}
                        onChange={(e) => setField('address', e.target.value)}
                      />
                    </Field>
                  </div>

                  <div className="mt-5 grid gap-5 md:grid-cols-4">
                    <Field label="موجودی">
                      <Input
                        type="number"
                        min="0"
                        value={form.availableQuantity}
                        onChange={(e) => setField('availableQuantity', e.target.value)}
                      />
                    </Field>

                    <Field label="حداقل سفارش">
                      <Input
                        type="number"
                        min="0"
                        value={form.minOrder}
                        onChange={(e) => setField('minOrder', e.target.value)}
                      />
                    </Field>

                    <Field label="حداقل قیمت هر واحد">
                      <Input
                        type="number"
                        min="0"
                        value={form.minPricePerUnit}
                        onChange={(e) => setField('minPricePerUnit', e.target.value)}
                      />
                    </Field>

                    <Field label="حداکثر قیمت هر واحد">
                      <Input
                        type="number"
                        min="0"
                        value={form.maxPricePerUnit}
                        onChange={(e) => setField('maxPricePerUnit', e.target.value)}
                      />
                    </Field>
                  </div>

                  <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-900">تخفیف فعال</p>
                        <p className="mt-1 text-xs leading-6 text-slate-500">
                          در صورت فعال بودن، درصد و تاریخ پایان را به‌روزرسانی کن
                        </p>
                      </div>

                      <input
                        type="checkbox"
                        checked={form.hasDiscount}
                        onChange={(e) => setField('hasDiscount', e.target.checked)}
                        className="h-5 w-5 rounded border-slate-300"
                      />
                    </div>

                    {form.hasDiscount ? (
                      <div className="mt-4 grid gap-5 md:grid-cols-2">
                        <Field label="درصد تخفیف">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={form.discountPercentage}
                            onChange={(e) => setField('discountPercentage', e.target.value)}
                          />
                        </Field>

                        <Field label="تاریخ پایان تخفیف">
                          <Input
                            type="date"
                            value={form.discountUntil}
                            onChange={(e) => setField('discountUntil', e.target.value)}
                          />
                        </Field>
                      </div>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {isBuy ? (
                <section className="rounded-[28px] border border-slate-200 bg-white p-5">
                  <h4 className="text-base font-black text-slate-950">فیلدهای قابل ویرایش آگهی خرید</h4>

                  <div className="mt-5 grid gap-5 md:grid-cols-4">
                    <Field label="مقدار مورد نیاز">
                      <Input
                        type="number"
                        min="0"
                        value={form.neededQuantity}
                        onChange={(e) => setField('neededQuantity', e.target.value)}
                      />
                    </Field>

                    <Field label="واحد">
                      <Select
                        value={form.neededUnit}
                        onChange={(e) => setField('neededUnit', e.target.value)}
                      >
                        {UNIT_OPTIONS.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </Select>
                    </Field>

                    <Field label="حداکثر بودجه">
                      <Input
                        type="number"
                        min="0"
                        value={form.maxBudget}
                        onChange={(e) => setField('maxBudget', e.target.value)}
                      />
                    </Field>

                    <Field label="تاریخ انقضای درخواست">
                      <Input
                        type="date"
                        value={form.requestExpiry}
                        onChange={(e) => setField('requestExpiry', e.target.value)}
                      />
                    </Field>
                  </div>

                  <div className="mt-5 grid gap-5 md:grid-cols-3">
                    <Field label="استان تحویل">
                      <Input
                        type="text"
                        value={form.deliveryProvince}
                        onChange={(e) => setField('deliveryProvince', e.target.value)}
                      />
                    </Field>

                    <Field label="شهر تحویل">
                      <Input
                        type="text"
                        value={form.deliveryCity}
                        onChange={(e) => setField('deliveryCity', e.target.value)}
                      />
                    </Field>

                    <Field label="آدرس تحویل">
                      <Input
                        type="text"
                        value={form.deliveryAddress}
                        onChange={(e) => setField('deliveryAddress', e.target.value)}
                      />
                    </Field>
                  </div>

                  <div className="mt-5">
                    <Field label="توضیحات تکمیلی">
                      <textarea
                        rows={5}
                        value={form.additionalRequirements}
                        onChange={(e) => setField('additionalRequirements', e.target.value)}
                        placeholder="شرایط خاص، استاندارد موردنیاز، توضیحات تکمیلی و..."
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium leading-7 text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />
                    </Field>
                  </div>

                  <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <h5 className="text-sm font-black text-slate-900">روش‌های پرداخت</h5>
                    <p className="mt-1 text-xs leading-6 text-slate-500">
                      می‌توانی یک یا چند روش پرداخت را فعال نگه داری.
                    </p>

                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {PAYMENT_METHOD_OPTIONS.map((item) => {
                        const checked = form.paymentMethods.includes(item.value);

                        return (
                          <label
                            key={item.value}
                            className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 transition ${
                              checked
                                ? 'border-blue-200 bg-blue-50 text-blue-800'
                                : 'border-slate-200 bg-white text-slate-700'
                            }`}
                          >
                            <span className="text-sm font-bold">{item.label}</span>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePaymentMethod(item.value)}
                              className="h-4 w-4 rounded border-slate-300"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </section>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              انصراف
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-blue-700 to-blue-900 px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-18px_rgba(30,64,175,0.78)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              ذخیره تغییرات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}