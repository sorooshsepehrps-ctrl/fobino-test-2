import { getPostTypeLabel, normalizeKeyFeatures, normalizeKeywords } from '../../../../utils/postDashboard';

function ReviewCard({ title, children }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.18)]">
      <h3 className="text-base font-black text-slate-950">{title}</h3>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
      <span className="text-xs font-bold text-slate-400">{label}</span>
      <span className="text-sm font-black text-slate-900 text-left">{value || '—'}</span>
    </div>
  );
}

export default function PostReviewStep({ form, selectedCategoryPath = '' }) {
  const keywords = normalizeKeywords(form.keywordsText);
  const keyFeatures = normalizeKeyFeatures(form.keyFeatures);

  return (
    <section className="space-y-5 rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.25)] md:p-6">
      <div>
        <h2 className="text-xl font-black text-slate-950">بررسی نهایی اطلاعات</h2>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          قبل از ذخیره پیش‌نویس یا ثبت نهایی، اطلاعات واردشده را یک‌بار مرور کن.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ReviewCard title="اطلاعات عمومی">
          <ReviewRow label="نوع آگهی" value={getPostTypeLabel(form.type)} />
          <ReviewRow label="عنوان" value={form.title} />
          <ReviewRow label="دسته‌بندی" value={selectedCategoryPath} />
          <ReviewRow label="تاریخ پایان نمایش" value={form.expiresAt || 'پیش‌فرض سیستم'} />
          <ReviewRow label="کلمات کلیدی" value={keywords.length ? keywords.join('، ') : 'ثبت نشده'} />
        </ReviewCard>

        <ReviewCard title="توضیحات">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-8 text-slate-700">
            {form.description || '—'}
          </div>
        </ReviewCard>

        {form.type === 'sell' ? (
          <>
            <ReviewCard title="جزئیات فروش">
              <ReviewRow label="نام محصول" value={form.productName} />
              <ReviewRow label="برند" value={form.brand} />
              <ReviewRow label="نوع محصول" value={form.productType} />
              <ReviewRow label="موقعیت" value={[form.province, form.city].filter(Boolean).join(' - ')} />
              <ReviewRow label="واحد" value={form.unit} />
              <ReviewRow label="موجودی" value={form.availableQuantity} />
              <ReviewRow label="حداقل سفارش" value={form.minOrder} />
              <ReviewRow label="حداقل قیمت" value={form.minPricePerUnit} />
              <ReviewRow label="حداکثر قیمت" value={form.maxPricePerUnit} />
            </ReviewCard>

            <ReviewCard title="تنظیمات تکمیلی فروش">
              <ReviewRow label="دراپ‌شیپینگ" value={form.dropShipping ? 'بله' : 'خیر'} />
              <ReviewRow label="نیاز به بازاریاب" value={form.needsMarketer ? 'بله' : 'خیر'} />
              <ReviewRow label="درصد بازاریاب" value={form.needsMarketer ? form.marketerPercentage : '—'} />
              <ReviewRow label="تخفیف فعال" value={form.hasDiscount ? 'بله' : 'خیر'} />
              <ReviewRow label="درصد تخفیف" value={form.hasDiscount ? form.discountPercentage : '—'} />
              <ReviewRow label="پایان تخفیف" value={form.hasDiscount ? form.discountUntil : '—'} />
            </ReviewCard>

            <ReviewCard title="ویژگی‌های کلیدی">
              {keyFeatures.length ? (
                keyFeatures.map((item, index) => (
                  <ReviewRow
                    key={`${item.name}-${index}`}
                    label={item.name}
                    value={item.value}
                  />
                ))
              ) : (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  ویژگی‌ای ثبت نشده است.
                </div>
              )}
            </ReviewCard>
          </>
        ) : (
          <>
            <ReviewCard title="جزئیات خرید">
              <ReviewRow label="نام محصول مورد نیاز" value={form.neededProductName} />
              <ReviewRow label="نوع محصول مورد نیاز" value={form.neededProductType} />
              <ReviewRow label="مقدار مورد نیاز" value={form.neededQuantity} />
              <ReviewRow label="واحد" value={form.neededUnit} />
              <ReviewRow label="نوع مصرف" value={form.usageType} />
              <ReviewRow label="تاریخ انقضای درخواست" value={form.requestExpiry} />
            </ReviewCard>

            <ReviewCard title="تحویل و پرداخت">
              <ReviewRow label="استان تحویل" value={form.deliveryProvince} />
              <ReviewRow label="شهر تحویل" value={form.deliveryCity} />
              <ReviewRow label="آدرس تحویل" value={form.deliveryAddress || '—'} />
              <ReviewRow label="حداکثر بودجه" value={form.maxBudget || '—'} />
              <ReviewRow
                label="روش‌های پرداخت"
                value={form.paymentMethods.length ? form.paymentMethods.join('، ') : '—'}
              />
            </ReviewCard>

            <ReviewCard title="توضیحات تکمیلی خرید">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-8 text-slate-700">
                {form.additionalRequirements || 'موردی ثبت نشده است.'}
              </div>
            </ReviewCard>
          </>
        )}
      </div>
    </section>
  );
}