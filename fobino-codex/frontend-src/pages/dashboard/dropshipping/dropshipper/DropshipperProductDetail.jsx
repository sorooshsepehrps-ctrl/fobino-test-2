
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Fix the import - use default import from the correct path
import dropshippingService from '../../../../services/dropshippingService';
import RFPStatusTabs from '../../../../components/dropshipping/RFPStatusTabs';
import RFPCard from '../../../../components/dropshipping/RFPCard';
import EmptyState from '../../../../components/dropshipping/EmptyState';
import ErrorState from '../../../../components/dropshipping/ErrorState';
import LoadingState from '../../../../components/dropshipping/LoadingState';
import PageSectionHeader from '../../../../components/dropshipping/PageSectionHeader';
import StatusBadge from '../../../../components/dropshipping/StatusBadge';

export default function DropshipperProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const payload = await dropshippingService.getDropshipperProductDetail(id);
      setProduct(payload?.data || null);
    } catch (err) {
      console.error('Error fetching product:', err);
      setError(err.message || 'دریافت اطلاعات محصول با مشکل روبه‌رو شد');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const groupedRfps = product?.groupedRfps || {};
  const statusKeys = useMemo(() => Object.keys(groupedRfps), [groupedRfps]);
  const hasAnyRfp = useMemo(
    () => statusKeys.some((key) => Array.isArray(groupedRfps[key]) && groupedRfps[key].length > 0),
    [groupedRfps, statusKeys]
  );

  const currentItems = useMemo(() => {
    if (!hasAnyRfp) return [];
    if (activeTab === 'all') return statusKeys.flatMap((key) => groupedRfps[key] || []);
    return groupedRfps[activeTab] || [];
  }, [activeTab, groupedRfps, hasAnyRfp, statusKeys]);

  if (loading) {
    return (
      <LoadingState
        title="در حال دریافت اطلاعات محصول"
        description="جزئیات محصول و RFPهای شما در حال بارگذاری است."
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        title="دریافت اطلاعات محصول با مشکل روبه‌رو شد"
        description={error}
        onRetry={fetchProduct}
      />
    );
  }

  if (!product) {
    return (
      <EmptyState
        icon="📦"
        title="محصول پیدا نشد"
        description="ممکن است این محصول حذف شده باشد یا دسترسی لازم برای مشاهده آن را نداشته باشید."
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 md:px-6 xl:px-8">
      <div className="space-y-6 md:space-y-8">
        <PageSectionHeader
          title={product?.productName || 'جزئیات محصول'}
          subtitle="در این صفحه فقط RFPهای متعلق به حساب شما برای این محصول نمایش داده می‌شود."
          actions={
            <button
              type="button"
              onClick={() => navigate(`/dashboard/dropshipping/dropshipper/products/${product._id}/request`)}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              ایجاد RFP جدید
            </button>
          }
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="overflow-hidden rounded-2xl bg-slate-100">
              <img
                src={product?.primaryImage?.url || product?.primaryImage || '/placeholder.png'}
                alt={product?.productName || 'product'}
                className="h-72 w-full object-cover"
              />
            </div>
            <h1 className="mt-5 text-lg font-black text-slate-900 md:text-xl">{product?.productName}</h1>
            <p className="mt-2 text-sm leading-7 text-slate-500">{product?.description || 'بدون توضیح'}</p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">قیمت</p>
                <p className="mt-2 text-sm font-black text-slate-900">
                  {Number(product?.retailPrice || 0).toLocaleString('fa-IR')} تومان
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">وضعیت</p>
                <div className="mt-2"><StatusBadge status={product?.status} /></div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">امتیاز تامین‌کننده</p>
              <p className="mt-2 text-sm font-black text-slate-900">
                {Number(product?.providerRating?.averageStars || 0).toLocaleString('fa-IR')} / 5
                <span className="mr-2 text-xs font-medium text-slate-500">
                  ({Number(product?.providerRating?.totalRatings || 0).toLocaleString('fa-IR')} امتیاز)
                </span>
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <RFPStatusTabs
                statuses={statusKeys}
                activeStatus={activeTab}
                onChange={setActiveTab}
                counts={groupedRfps}
                includeAll
              />
            </div>

            {!hasAnyRfp ? (
              <EmptyState
                icon="📭"
                title="هنوز RFPی برای این محصول ثبت نکرده‌اید"
                description="برای شروع همکاری با این محصول، یک RFP جدید ثبت کنید تا روند تایید و پرداخت آغاز شود."
                actionLabel="ایجاد RFP"
                actionTo={`/dashboard/dropshipping/dropshipper/products/${product?._id}/request`}
              />
            ) : (
              <div className="space-y-4">
                {currentItems.map((rfp) => (
                  <RFPCard
                    key={rfp._id}
                    rfp={rfp}
                    to={`/dashboard/dropshipping/dropshipper/rfps/${rfp._id}`}
                    mode="dropshipper"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}