import { PAYMENT_METHOD_OPTIONS, UNIT_OPTIONS, USAGE_TYPE_OPTIONS } from '../../../../utils/postDashboard';

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

export default function BuyPostDetailsStep({ form, onChange, onTogglePaymentMethod }) {
  return (
    <section className="space-y-6 rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.25)] md:p-6">
      <div>
        <h2 className="text-xl font-black text-slate-950">جزئیات آگهی خرید</h2>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          نیازمندی خرید، محل تحویل، بودجه و روش‌های پرداخت را تکمیل کن.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="نام محصول مورد نیاز">
          <Input
            type="text"
            value={form.neededProductName}
            onChange={(e) => onChange('neededProductName', e.target.value)}
            placeholder="مثلاً پلی‌پروپیلن نساجی"
          />
        </Field>

        <Field label="نوع محصول مورد نیاز">
          <Input
            type="text"
            value={form.neededProductType}
            onChange={(e) => onChange('neededProductType', e.target.value)}
            placeholder="مثلاً گرانول"
          />
        </Field>
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        <Field label="مقدار مورد نیاز">
          <Input
            type="number"
            min="0"
            value={form.neededQuantity}
            onChange={(e) => onChange('neededQuantity', e.target.value)}
            placeholder="0"
          />
        </Field>

        <Field label="واحد">
          <Select value={form.neededUnit} onChange={(e) => onChange('neededUnit', e.target.value)}>
            {UNIT_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="نوع مصرف">
          <Select value={form.usageType} onChange={(e) => onChange('usageType', e.target.value)}>
            {USAGE_TYPE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="تاریخ انقضای درخواست">
          <Input
            type="date"
            value={form.requestExpiry}
            onChange={(e) => onChange('requestExpiry', e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Field label="استان تحویل">
          <Input
            type="text"
            value={form.deliveryProvince}
            onChange={(e) => onChange('deliveryProvince', e.target.value)}
            placeholder="تهران"
          />
        </Field>

        <Field label="شهر تحویل">
          <Input
            type="text"
            value={form.deliveryCity}
            onChange={(e) => onChange('deliveryCity', e.target.value)}
            placeholder="تهران"
          />
        </Field>

        <Field label="آدرس تحویل">
          <Input
            type="text"
            value={form.deliveryAddress}
            onChange={(e) => onChange('deliveryAddress', e.target.value)}
            placeholder="آدرس کامل"
          />
        </Field>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="حداکثر بودجه">
          <Input
            type="number"
            min="0"
            value={form.maxBudget}
            onChange={(e) => onChange('maxBudget', e.target.value)}
            placeholder="0"
          />
        </Field>

        <Field label="توضیحات تکمیلی">
          <textarea
            rows={4}
            value={form.additionalRequirements}
            onChange={(e) => onChange('additionalRequirements', e.target.value)}
            placeholder="شرایط خاص، استاندارد موردنیاز، نحوه همکاری و..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium leading-7 text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </Field>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-base font-black text-slate-950">روش‌های پرداخت</h3>
        <p className="mt-1 text-xs leading-6 text-slate-500">
          می‌توانی یک یا چند روش پرداخت را فعال کنی.
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
                  onChange={() => onTogglePaymentMethod(item.value)}
                  className="h-4 w-4 rounded border-slate-300"
                />
              </label>
            );
          })}
        </div>
      </div>
    </section>
  );
}