
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackagePlus, Wallet, Boxes, AlertTriangle, ArrowLeft, ClipboardList, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import ProviderSummaryCards from '../../../../components/dropshipping/ProviderSummaryCards';
import { dropshippingService } from '../../../../services';

export default function ProviderPanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [rfps, setRfps] = useState([]);
  const [financeSummary, setFinanceSummary] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [productsRes, rfpsRes, financeRes] = await Promise.all([
        dropshippingService.getMyProducts({ page: 1, limit: 4 }),
        dropshippingService.getMyRFPs({ page: 1, limit: 6, role: 'provider' }),
        dropshippingService.getProviderFinance({ page: 1, limit: 5 }),
      ]);

      setProducts(productsRes?.data?.data || []);
      setRfps(rfpsRes?.data?.data || []);
      setFinanceSummary(financeRes?.data?.summary || null);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'بارگذاری پنل تامین‌کننده با خطا مواجه شد');
    } finally {
      setLoading(false);
    }
  }

  const summary = useMemo(() => {
    const activeRfps = rfps.filter((item) =>
      [
        'approved',
        'payment_completed',
        'shipment_deadline_passed',
        'late_ticket_created',
        'shipped',
        'delivered_pending_confirmation',
      ].includes(item.status)
    ).length;

    const completedRfps = rfps.filter((item) => item.status === 'completed').length;

    return {
      totalProducts: products.length,
      activeRfps,
      completedRfps,
      pendingIncoming: financeSummary?.incomingPendingTotal || 0,
    };
  }, [products, rfps, financeSummary]);

  const needAttention = useMemo(() => {
    return rfps.filter((item) =>
      ['pending_provider_approval', 'shipment_deadline_passed', 'late_ticket_created'].includes(item.status)
    );
  }, [rfps]);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-950 via-blue-900 to-sky-800 text-white" padding="lg">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              <ShieldAlert className="h-4 w-4" />
              پنل تامین‌کننده دراپ‌شیپینگ
            </div>
            <h1 className="text-2xl font-black lg:text-4xl">مدیریت محصولات، RFPها و دریافتی‌های در انتظار</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100 lg:text-base">
              در این پنل، ساخت محصول جدید، مدیریت کامل محصولات، پیگیری RFPهای اخیر و مشاهده وضعیت مالی دراپ‌شیپینگ در یک مسیر
              متمرکز قرار گرفته است.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="secondary" icon={PackagePlus} onClick={() => navigate('/dashboard/dropshipping/provider/products/new')}>
                ایجاد محصول جدید
              </Button>
              <Button variant="brandOutline" className="border-white/30 bg-white/5 text-white hover:bg-white/10" icon={Boxes} onClick={() => navigate('/dashboard/dropshipping/provider/products')}>
                محصولات من
              </Button>
              <Button variant="brandOutline" className="border-white/30 bg-white/5 text-white hover:bg-white/10" icon={Wallet} onClick={() => navigate('/dashboard/dropshipping/provider/finance')}>
                صفحه مالی
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-3xl bg-white/10 p-4 backdrop-blur">
              <div className="text-sm text-blue-100">نیازمند اقدام</div>
              <div className="mt-2 text-3xl font-black">{needAttention.length}</div>
              <div className="mt-2 text-xs text-blue-100">RFPهایی که نیاز به تایید، ارسال یا پیگیری دارند</div>
            </div>
            <div className="rounded-3xl bg-white/10 p-4 backdrop-blur">
              <div className="text-sm text-blue-100">دریافتی در انتظار</div>
              <div className="mt-2 text-2xl font-black">
                {new Intl.NumberFormat('fa-IR').format(financeSummary?.incomingPendingTotal || 0)} تومان
              </div>
            </div>
          </div>
        </div>
      </Card>

      <ProviderSummaryCards summary={summary} />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-3xl border border-slate-100" padding="lg">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">دسترسی‌های اصلی</h2>
              <p className="mt-1 text-sm text-slate-500">مسیرهای کلیدی پنل تامین‌کننده</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard/dropshipping/provider/products/new')}
              className="rounded-3xl border border-slate-200 bg-white p-5 text-right transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-900">
                <PackagePlus className="h-5 w-5" />
              </div>
              <div className="font-bold text-slate-900">ایجاد محصول</div>
              <div className="mt-2 text-sm leading-6 text-slate-500">ثبت محصول جدید با مشخصات کامل، تصویر، موجودی و زمان ارسال</div>
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard/dropshipping/provider/products')}
              className="rounded-3xl border border-slate-200 bg-white p-5 text-right transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                <Boxes className="h-5 w-5" />
              </div>
              <div className="font-bold text-slate-900">محصولات من</div>
              <div className="mt-2 text-sm leading-6 text-slate-500">جستجو، فیلتر، ویرایش، حذف و بررسی آمار هر محصول</div>
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard/dropshipping/provider/finance')}
              className="rounded-3xl border border-slate-200 bg-white p-5 text-right transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-800">
                <Wallet className="h-5 w-5" />
              </div>
              <div className="font-bold text-slate-900">مالی</div>
              <div className="mt-2 text-sm leading-6 text-slate-500">دریافتی‌های در انتظار، مبالغ آزادشده، کارمزدها و جزئیات تراکنش‌ها</div>
            </button>
          </div>
        </Card>

        <Card className="rounded-3xl border border-slate-100" padding="lg">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">RFPهای نیازمند اقدام</h2>
              <p className="mt-1 text-sm text-slate-500">مواردی که باید سریع‌تر بررسی شوند</p>
            </div>
          </div>

          <div className="space-y-3">
            {!loading && needAttention.length === 0 ? (
              <div className="rounded-3xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                فعلاً مورد نیازمند اقدام وجود ندارد.
              </div>
            ) : null}

            {needAttention.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => navigate(`/dashboard/dropshipping/provider/rfps/${item._id}`)}
                className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-right transition-all hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900">{item.rfpCode}</div>
                    <div className="mt-1 text-sm text-slate-500">
                      وضعیت: {item.status} {item.agreedShipmentDateJalali ? `• تاریخ ارسال: ${item.agreedShipmentDateJalali}` : ''}
                    </div>
                  </div>

                  <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                    ['shipment_deadline_passed', 'late_ticket_created'].includes(item.status) ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-3xl border border-slate-100" padding="lg">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">آخرین محصولات</h2>
              <p className="mt-1 text-sm text-slate-500">میانبر سریع برای ورود به صفحه هر محصول</p>
            </div>
            <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/dashboard/dropshipping/provider/products')}>
              مشاهده همه
            </Button>
          </div>

          <div className="space-y-3">
            {products.length === 0 && !loading ? (
              <div className="rounded-3xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                هنوز محصولی ثبت نشده است.
              </div>
            ) : null}

            {products.map((product) => (
              <button
                key={product._id}
                type="button"
                onClick={() => navigate(`/dashboard/dropshipping/provider/products/${product._id}`)}
                className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-right transition-all hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900">{product.productName}</div>
                    <div className="mt-1 text-sm text-slate-500">
                      {new Intl.NumberFormat('fa-IR').format(product.retailPrice || 0)} تومان • {product.stockQuantity || 0} عدد
                    </div>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {product.status === 'active' ? 'فعال' : 'غیرفعال'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="rounded-3xl border border-slate-100" padding="lg">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">آخرین RFPها</h2>
              <p className="mt-1 text-sm text-slate-500">آخرین فعالیت‌های دراپ‌شیپینگ شما</p>
            </div>
            <ClipboardList className="h-5 w-5 text-slate-400" />
          </div>

          <div className="space-y-3">
            {rfps.length === 0 && !loading ? (
              <div className="rounded-3xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                هنوز RFPای برای شما ثبت نشده است.
              </div>
            ) : null}

            {rfps.map((rfp) => (
              <button
                key={rfp._id}
                type="button"
                onClick={() => navigate(`/dashboard/dropshipping/provider/rfps/${rfp._id}`)}
                className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-right transition-all hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div className="font-bold text-slate-900">{rfp.rfpCode}</div>
                <div className="mt-1 text-sm text-slate-500">
                  مبلغ: {new Intl.NumberFormat('fa-IR').format(rfp.totalAmount || 0)} تومان • وضعیت: {rfp.status}
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
