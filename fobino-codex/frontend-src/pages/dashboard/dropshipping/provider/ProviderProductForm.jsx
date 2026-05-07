
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Save, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import { dropshippingService } from '../../../../services';

const initialState = {
  productName: '',
  brand: '',
  description: '',
  retailPrice: '',
  stockQuantity: '',
  status: 'active',
  shippingTimeValue: '',
  shippingTimeUnit: 'روز',
  locationProvince: '',
  locationCity: '',
  locationAddress: '',
  locationPostalCode: '',
  primaryImage: '',
  images: '',
};

export default function ProviderProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode) loadProduct();
  }, [id]);

  async function loadProduct() {
    try {
      setLoading(true);
      const res = await dropshippingService.getProductById(id);
      const product = res?.data?.data;
      if (!product) return;

      setForm({
        productName: product.productName || '',
        brand: product.brand || '',
        description: product.description || '',
        retailPrice: product.retailPrice || '',
        stockQuantity: product.stockQuantity || '',
        status: product.status || 'active',
        shippingTimeValue: product.shippingTime?.value || '',
        shippingTimeUnit: product.shippingTime?.unit || 'روز',
        locationProvince: product.location?.province || '',
        locationCity: product.location?.city || '',
        locationAddress: product.location?.address || '',
        locationPostalCode: product.location?.postalCode || '',
        primaryImage: product.primaryImage || '',
        images: (product.images || []).map((item) => item?.url || item).join('\n'),
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || 'اطلاعات محصول بارگذاری نشد');
    } finally {
      setLoading(false);
    }
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const payload = useMemo(() => {
    const imageList = form.images
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);

    return {
      productName: form.productName.trim(),
      brand: form.brand.trim(),
      description: form.description.trim(),
      retailPrice: Number(form.retailPrice || 0),
      stockQuantity: Number(form.stockQuantity || 0),
      status: form.status,
      primaryImage: form.primaryImage.trim() || undefined,
      images: imageList,
      shippingTime: {
        value: Number(form.shippingTimeValue || 0),
        unit: form.shippingTimeUnit,
      },
      location: {
        province: form.locationProvince.trim(),
        city: form.locationCity.trim(),
        address: form.locationAddress.trim(),
        postalCode: form.locationPostalCode.trim(),
      },
    };
  }, [form]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!payload.productName || !payload.description || !payload.retailPrice || !payload.stockQuantity) {
      toast.error('فیلدهای اصلی محصول را کامل کنید');
      return;
    }

    try {
      setSubmitting(true);

      if (isEditMode) {
        await dropshippingService.updateProduct(id, payload);
        toast.success('محصول با موفقیت ویرایش شد');
        navigate(`/dashboard/dropshipping/provider/products/${id}`);
      } else {
        const res = await dropshippingService.createProduct(payload);
        const createdId = res?.data?.data?._id;
        toast.success('محصول با موفقیت ایجاد شد');
        navigate(createdId ? `/dashboard/dropshipping/provider/products/${createdId}` : '/dashboard/dropshipping/provider/products');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'ذخیره محصول با خطا مواجه شد');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="h-48 animate-pulse rounded-[28px] bg-slate-100" />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="rounded-[28px] border border-slate-100" padding="lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate('/dashboard/dropshipping/provider/products')}
              className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              <ArrowRight className="h-4 w-4" />
              بازگشت به محصولات
            </button>

            <h1 className="text-2xl font-black text-slate-900">
              {isEditMode ? 'ویرایش محصول' : 'ایجاد محصول جدید'}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              فرم زیر را با دقت کامل کنید. مسیر ارسال، موجودی و زمان ارسال در تجربه دراپ‌شیپر بسیار اثرگذار است.
            </p>
          </div>

          <Button type="submit" variant="brand" icon={Save} loading={submitting}>
            {isEditMode ? 'ذخیره تغییرات' : 'ثبت محصول'}
          </Button>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-3xl border border-slate-100" padding="lg">
          <h2 className="mb-5 text-lg font-bold text-slate-900">اطلاعات اصلی</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="نام محصول" value={form.productName} onChange={(e) => updateField('productName', e.target.value)} required />
            <Input label="برند" value={form.brand} onChange={(e) => updateField('brand', e.target.value)} />

            <Input
              label="قیمت خرده‌فروشی"
              type="number"
              value={form.retailPrice}
              onChange={(e) => updateField('retailPrice', e.target.value)}
              required
            />

            <Input
              label="موجودی"
              type="number"
              value={form.stockQuantity}
              onChange={(e) => updateField('stockQuantity', e.target.value)}
              required
            />

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">توضیحات</label>
              <textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={6}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">وضعیت محصول</label>
              <select
                value={form.status}
                onChange={(e) => updateField('status', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">فعال</option>
                <option value="inactive">غیرفعال</option>
                <option value="draft">پیش‌نویس</option>
              </select>
            </div>

            <div className="grid grid-cols-[1fr_140px] gap-3">
              <Input
                label="زمان ارسال"
                type="number"
                value={form.shippingTimeValue}
                onChange={(e) => updateField('shippingTimeValue', e.target.value)}
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">واحد</label>
                <select
                  value={form.shippingTimeUnit}
                  onChange={(e) => updateField('shippingTimeUnit', e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="روز">روز</option>
                  <option value="هفته">هفته</option>
                  <option value="ساعت">ساعت</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl border border-slate-100" padding="lg">
            <h2 className="mb-5 text-lg font-bold text-slate-900">موقعیت محصول</h2>

            <div className="grid gap-4">
              <Input label="استان" value={form.locationProvince} onChange={(e) => updateField('locationProvince', e.target.value)} />
              <Input label="شهر" value={form.locationCity} onChange={(e) => updateField('locationCity', e.target.value)} />
              <Input label="آدرس" value={form.locationAddress} onChange={(e) => updateField('locationAddress', e.target.value)} />
              <Input label="کد پستی" value={form.locationPostalCode} onChange={(e) => updateField('locationPostalCode', e.target.value)} />
            </div>
          </Card>

          <Card className="rounded-3xl border border-slate-100" padding="lg">
            <div className="mb-4 flex items-center gap-2">
              <ImagePlus className="h-5 w-5 text-blue-900" />
              <h2 className="text-lg font-bold text-slate-900">تصاویر</h2>
            </div>

            <div className="space-y-4">
              <Input label="تصویر اصلی" value={form.primaryImage} onChange={(e) => updateField('primaryImage', e.target.value)} placeholder="URL تصویر اصلی" />

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">لیست تصاویر</label>
                <textarea
                  value={form.images}
                  onChange={(e) => updateField('images', e.target.value)}
                  rows={6}
                  placeholder="هر خط یک URL تصویر"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
