

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';

import { dropshippingService } from '../../../../services';
import ProductCard from '../../../../components/dropshipping/ProductCard';
import ProviderSummaryCards from '../../../../components/dropshipping/ProviderSummaryCards';
import EmptyState from '../../../../components/dropshipping/EmptyState';
import ErrorState from '../../../../components/dropshipping/ErrorState';
import ProductGridSkeleton from '../../../../components/dropshipping/ProductGridSkeleton';
import PageSectionHeader from '../../../../components/dropshipping/PageSectionHeader';

const INITIAL_PAGINATION = {
  page: 1,
  limit: 12,
  total: 0,
  pages: 1,
};

export default function ProviderProducts() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const payload = await dropshippingService.getMyProducts({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      setProducts(payload?.data || []);
      setPagination((prev) => ({
        ...prev,
        total: payload?.pagination?.total || 0,
        pages: payload?.pagination?.pages || 1,
      }));
    } catch (err) {
      setError(err.message || 'دریافت لیست محصولات با خطا روبه‌رو شد');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const stats = useMemo(() => {
    return products.reduce(
      (acc, product) => {
        acc.total += 1;
        if (product?.status === 'active') acc.active += 1;
        acc.completedRfps += product?.rfpCounts?.completed || 0;
        acc.activeRfps += product?.rfpCounts?.active || 0;
        return acc;
      },
      { total: 0, active: 0, completedRfps: 0, activeRfps: 0 }
    );
  }, [products]);

  const handleDelete = async (productId, locked) => {
    if (locked) {
      toast.error('به دلیل وجود RFP فعال، حذف این محصول مجاز نیست');
      return;
    }

    const confirmed = window.confirm('آیا از حذف این محصول مطمئن هستید؟');
    if (!confirmed) return;

    try {
      await dropshippingService.deleteProduct(productId);
      toast.success('محصول با موفقیت حذف شد');
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'حذف محصول انجام نشد');
    }
  };

  const handleToggleStatus = async (productId) => {
    try {
      await dropshippingService.toggleProductStatus(productId);
      toast.success('وضعیت محصول به‌روزرسانی شد');
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'تغییر وضعیت محصول انجام نشد');
    }
  };

  if (loading) {
    return <ProductGridSkeleton count={6} />;
  }

  if (error) {
    return (
      <ErrorState
        title="دریافت لیست محصولات با خطا روبه‌رو شد"
        description={error}
        onRetry={fetchProducts}
      />
    );
  }

  if (!products?.length) {
    return (
      <EmptyState
        icon="🛍️"
        title="هنوز محصولی ثبت نکرده‌اید"
        description="برای شروع فروش دراپ‌شیپینگ، اولین محصول خود را ایجاد کنید. بعد از ایجاد، از همین صفحه می‌توانید وضعیت، RFPها و عملکرد هر محصول را مدیریت کنید."
        actionLabel="ایجاد اولین محصول"
        actionTo="/dashboard/dropshipping/provider/products/new"
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 md:px-6 xl:px-8">
      <div className="space-y-6 md:space-y-8">
        <PageSectionHeader
          title="محصولات من"
          subtitle="محصولات دراپ‌شیپینگ شما، وضعیت هر محصول و محدودیت‌های ویرایش یا حذف از اینجا قابل مدیریت است."
          actions={
            <Link
              to="/dashboard/dropshipping/provider/products/new"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              ایجاد محصول جدید
            </Link>
          }
        />

        <ProviderSummaryCards
          items={[
            { label: 'کل محصولات', value: stats.total },
            { label: 'محصولات فعال', value: stats.active },
            { label: 'RFP تکمیل‌شده', value: stats.completedRfps },
            { label: 'RFP فعال', value: stats.activeRfps },
          ]}
        />

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px_160px]">
            <div className="relative">
              <Search className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setPagination((prev) => ({ ...prev, page: 1 }));
                    fetchProducts();
                  }
                }}
                placeholder="جستجو در بین محصولات شما"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-4 pr-11 text-sm text-slate-700 outline-none transition focus:border-slate-400"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
              <option value="out_of_stock">ناموجود</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setPagination((prev) => ({ ...prev, page: 1 }));
                fetchProducts();
              }}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              اعمال فیلتر
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => {
            const locked = Boolean(product?.mutationsLocked || product?.rfpCounts?.active > 0);

            const secondaryActions = (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate(`/dashboard/dropshipping/provider/products/${product._id}/edit`);
                  }}
                  disabled={locked}
                  title={locked ? 'به دلیل وجود RFP فعال، ویرایش مجاز نیست' : 'ویرایش محصول'}
                  className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
                    locked
                      ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                      : 'bg-slate-900 text-white hover:opacity-90'
                  }`}
                >
                  ویرایش
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(product._id, locked);
                  }}
                  disabled={locked}
                  title={locked ? 'به دلیل وجود RFP فعال، حذف مجاز نیست' : 'حذف محصول'}
                  className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
                    locked
                      ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                      : 'bg-rose-600 text-white hover:bg-rose-700'
                  }`}
                >
                  حذف
                </button>
              </div>
            );

            return (
              <ProductCard
                key={product._id}
                product={product}
                to={`/dashboard/dropshipping/provider/products/${product._id}`}
                showProviderRating={false}
                mode="provider"
                metaBadge={locked ? 'دارای RFP فعال' : null}
                primaryAction={{
                  label: product?.status === 'active' ? 'غیرفعال‌کردن' : 'فعال‌کردن',
                  onClick: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleStatus(product._id);
                  },
                }}
                secondaryAction={secondaryActions}
              />
            );
          })}
        </div>

        {pagination.pages > 1 ? (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              قبلی
            </button>
            <span className="text-sm text-slate-500">
              صفحه {pagination.page} از {pagination.pages}
            </span>
            <button
              type="button"
              disabled={pagination.page >= pagination.pages}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              بعدی
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
