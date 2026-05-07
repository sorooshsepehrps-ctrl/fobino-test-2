


import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { dropshippingService } from '../../../../services';
import RFPStatusTabs from '../../../../components/dropshipping/RFPStatusTabs';
import RFPCard from '../../../../components/dropshipping/RFPCard';
import EmptyState from '../../../../components/dropshipping/EmptyState';
import ErrorState from '../../../../components/dropshipping/ErrorState';
import LoadingState from '../../../../components/dropshipping/LoadingState';
import PageSectionHeader from '../../../../components/dropshipping/PageSectionHeader';
import StatusBadge from '../../../../components/dropshipping/StatusBadge';

export default function ProviderProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const payload = await dropshippingService.getProductById(id);
      setProduct(payload?.data || null);
    } catch (err) {
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
    if (activeTab === 'all') {
      return statusKeys.flatMap((key) => groupedRfps[key] || []);
    }
    return groupedRfps[activeTab] || [];
  }, [activeTab, groupedRfps, hasAnyRfp, statusKeys]);

  if (loading) {
    return (
      <LoadingState
        title="در حال دریافت اطلاعات محصول"
        description="جزئیات محصول و لیست RFPها در حال بارگذاری است."
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

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 md:px-6 xl:px-8">
      <div className="space-y-6 md:space-y-8">
        <PageSectionHeader
          title={product?.productName || 'جزئیات محصول'}
          subtitle="در این صفحه می‌توانید وضعیت کلی محصول، آمار RFPها و تفکیک درخواست‌ها بر اساس وضعیت را مشاهده کنید."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-500">وضعیت محصول</p>
            <div className="mt-3"><StatusBadge status={product?.status} /></div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-500">RFP تکمیل‌شده</p>
            <p className="mt-3 text-2xl font-black text-slate-900">{product?.rfpCounts?.completed || 0}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-500">RFP فعال</p>
            <p className="mt-3 text-2xl font-black text-slate-900">{product?.rfpCounts?.active || 0}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-500">RFP لغوشده/ناموفق</p>
            <p className="mt-3 text-2xl font-black text-slate-900">{product?.rfpCounts?.cancelled || 0}</p>
          </div>
        </div>

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
            <p className="mt-2 text-sm leading-7 text-slate-500">{product?.description || 'بدون توضیحات'}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">قیمت</p>
                <p className="mt-2 text-sm font-black text-slate-900">
                  {Number(product?.retailPrice || 0).toLocaleString('fa-IR')} تومان
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">موجودی</p>
                <p className="mt-2 text-sm font-black text-slate-900">{product?.stockQuantity || 0}</p>
              </div>
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
                title="هنوز RFPای برای این محصول ثبت نشده است"
                description="به محض ثبت اولین درخواست همکاری برای این محصول، لیست آن در همین صفحه نمایش داده می‌شود."
              />
            ) : (
              <div className="space-y-4">
                {currentItems.map((rfp) => (
                  <RFPCard
                    key={rfp._id}
                    rfp={rfp}
                    to={`/dashboard/dropshipping/provider/rfps/${rfp._id}`}
                    mode="provider"
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
