import { Plus, Trash2 } from 'lucide-react';
import { PRODUCT_TYPE_OPTIONS, UNIT_OPTIONS } from '../../../../utils/postDashboard';

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

export default function SellPostDetailsStep({
  form,
  onChange,
  onFeatureAdd,
  onFeatureRemove,
  onFeatureChange,
}) {
  return (
    <section className="space-y-6 rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.25)] md:p-6">
      <div>
        <h2 className="text-xl font-black text-slate-950">جزئیات آگهی فروش</h2>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          تمام فیلدهای اصلی موردنیاز برای ثبت آگهی فروش را کامل کن.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="نام محصول">
          <Input
            type="text"
            value={form.productName}
            onChange={(e) => onChange('productName', e.target.value)}
            placeholder="مثلاً پلی‌اتیلن سبک"
          />
        </Field>

        <Field label="برند">
          <Input
            type="text"
            value={form.brand}
            onChange={(e) => onChange('brand', e.target.value)}
            placeholder="مثلاً مارون"
          />
        </Field>

        <Field label="نوع محصول">
          <Select
            value={form.productType}
            onChange={(e) => onChange('productType', e.target.value)}
          >
            {PRODUCT_TYPE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="واحد">
          <Select value={form.unit} onChange={(e) => onChange('unit', e.target.value)}>
            {UNIT_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Field label="استان">
          <Input
            type="text"
            value={form.province}
            onChange={(e) => onChange('province', e.target.value)}
            placeholder="تهران"
          />
        </Field>

        <Field label="شهر">
          <Input
            type="text"
            value={form.city}
            onChange={(e) => onChange('city', e.target.value)}
            placeholder="تهران"
          />
        </Field>

        <Field label="آدرس">
          <Input
            type="text"
            value={form.address}
            onChange={(e) => onChange('address', e.target.value)}
            placeholder="آدرس محل انبار یا کارخانه"
          />
        </Field>
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        <Field label="موجودی">
          <Input
            type="number"
            min="0"
            value={form.availableQuantity}
            onChange={(e) => onChange('availableQuantity', e.target.value)}
            placeholder="0"
          />
        </Field>

        <Field label="حداقل سفارش">
          <Input
            type="number"
            min="0"
            value={form.minOrder}
            onChange={(e) => onChange('minOrder', e.target.value)}
            placeholder="0"
          />
        </Field>

        <Field label="حداقل قیمت هر واحد">
          <Input
            type="number"
            min="0"
            value={form.minPricePerUnit}
            onChange={(e) => onChange('minPricePerUnit', e.target.value)}
            placeholder="0"
          />
        </Field>

        <Field label="حداکثر قیمت هر واحد">
          <Input
            type="number"
            min="0"
            value={form.maxPricePerUnit}
            onChange={(e) => onChange('maxPricePerUnit', e.target.value)}
            placeholder="0"
          />
        </Field>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-slate-900">دراپ‌شیپینگ</p>
              <p className="mt-1 text-xs leading-6 text-slate-500">در صورت امکان فروش بدون انبارداری مستقیم</p>
            </div>
            <input
              type="checkbox"
              checked={form.dropShipping}
              onChange={(e) => onChange('dropShipping', e.target.checked)}
              className="h-5 w-5 rounded border-slate-300"
            />
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-slate-900">نیاز به بازاریاب</p>
              <p className="mt-1 text-xs leading-6 text-slate-500">در صورت نیاز درصد همکاری را مشخص کن</p>
            </div>
            <input
              type="checkbox"
              checked={form.needsMarketer}
              onChange={(e) => onChange('needsMarketer', e.target.checked)}
              className="h-5 w-5 rounded border-slate-300"
            />
          </div>

          {form.needsMarketer ? (
            <div className="mt-4">
              <Field label="درصد بازاریاب">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={form.marketerPercentage}
                  onChange={(e) => onChange('marketerPercentage', e.target.value)}
                  placeholder="مثلاً 10"
                />
              </Field>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-slate-900">تخفیف فعال</p>
            <p className="mt-1 text-xs leading-6 text-slate-500">در صورت فعال بودن، درصد و تاریخ پایان را وارد کن</p>
          </div>
          <input
            type="checkbox"
            checked={form.hasDiscount}
            onChange={(e) => onChange('hasDiscount', e.target.checked)}
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
                onChange={(e) => onChange('discountPercentage', e.target.value)}
                placeholder="مثلاً 15"
              />
            </Field>

            <Field label="تاریخ پایان تخفیف">
              <Input
                type="date"
                value={form.discountUntil}
                onChange={(e) => onChange('discountUntil', e.target.value)}
              />
            </Field>
          </div>
        ) : null}
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-950">ویژگی‌های کلیدی</h3>
            <p className="mt-1 text-xs leading-6 text-slate-500">
              هر ویژگی شامل نام و مقدار است. مثال: رنگ / سفید
            </p>
          </div>

          <button
            type="button"
            onClick={onFeatureAdd}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <Plus className="h-4 w-4" />
            افزودن ویژگی
          </button>
        </div>

        <div className="space-y-3">
          {form.keyFeatures.map((item, index) => (
            <div key={index} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <Input
                type="text"
                value={item.name}
                onChange={(e) => onFeatureChange(index, 'name', e.target.value)}
                placeholder="نام ویژگی"
              />

              <Input
                type="text"
                value={item.value}
                onChange={(e) => onFeatureChange(index, 'value', e.target.value)}
                placeholder="مقدار ویژگی"
              />

              <button
                type="button"
                onClick={() => onFeatureRemove(index)}
                disabled={form.keyFeatures.length === 1}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 text-red-600 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}