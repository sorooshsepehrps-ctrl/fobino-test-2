

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { dropshippingService } from '../../../../services';
import ProductCard from '../../../../components/dropshipping/ProductCard';
import ProductFilters from '../../../../components/dropshipping/ProductFilters';
import EmptyState from '../../../../components/dropshipping/EmptyState';
import ErrorState from '../../../../components/dropshipping/ErrorState';
import ProductGridSkeleton from '../../../../components/dropshipping/ProductGridSkeleton';
import PageSectionHeader from '../../../../components/dropshipping/PageSectionHeader';

const DEFAULT_FILTERS = {
  search: '',
  minPrice: '',
  maxPrice: '',
  category: '',
  province: '',
  city: '',
};

export default function BrowseProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const payload = await dropshippingService.browseProducts(filters);
      setProducts(payload?.data || []);
    } catch (err) {
      setError(err.message || 'دریافت لیست محصولات با مشکل روبه‌رو شد');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  if (loading) return <ProductGridSkeleton count={6} />;

  if (error) {
    return (
      <ErrorState
        title="دریافت لیست محصولات با مشکل روبه‌رو شد"
        description={error}
        onRetry={fetchProducts}
      />
    );
  }

  if (!products?.length) {
    return (
      <EmptyState
        icon="🔎"
        title="محصولی پیدا نشد"
        description="در حال حاضر نتیجه‌ای مطابق جستجو یا فیلترهای شما وجود ندارد. فیلترها را تغییر دهید و دوباره تلاش کنید."
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 md:px-6 xl:px-8">
      <div className="space-y-6 md:space-y-8">
        <PageSectionHeader
          title="محصولات دراپ‌شیپینگ"
          subtitle="محصولات قابل همکاری را بررسی کنید، بر اساس فیلترهای دلخواه محدود کنید و برای هر محصول RFP جدید بسازید."
        />

        <ProductFilters
          filters={filters}
          onChange={setFilters}
          onSubmit={fetchProducts}
          onReset={() => setFilters(DEFAULT_FILTERS)}
        />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              to={`/dashboard/dropshipping/dropshipper/products/${product._id}`}
              showProviderRating={true}
              mode="dropshipper"
              primaryAction={{
                label: 'ایجاد RFP',
                onClick: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/dashboard/dropshipping/dropshipper/products/${product._id}?action=create-rfp`);
                },
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
