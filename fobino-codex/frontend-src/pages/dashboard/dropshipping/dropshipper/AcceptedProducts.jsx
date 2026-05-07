

import { useCallback, useEffect, useState } from 'react';

import { dropshippingService } from '../../../../services';
import ProductCard from '../../../../components/dropshipping/ProductCard';
import EmptyState from '../../../../components/dropshipping/EmptyState';
import ErrorState from '../../../../components/dropshipping/ErrorState';
import ProductGridSkeleton from '../../../../components/dropshipping/ProductGridSkeleton';
import PageSectionHeader from '../../../../components/dropshipping/PageSectionHeader';

export default function AcceptedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const payload = await dropshippingService.getAcceptedProducts();
      setProducts(payload?.data || []);
    } catch (err) {
      setError(err.message || 'دریافت لیست محصولات با مشکل روبه‌رو شد');
    } finally {
      setLoading(false);
    }
  }, []);

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
        icon="📦"
        title="هنوز محصول پذیرفته‌شده‌ای ندارید"
        description="محصولاتی که حداقل یک RFP برای آن‌ها ثبت کرده‌اید در این بخش فهرست می‌شوند."
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 md:px-6 xl:px-8">
      <div className="space-y-6 md:space-y-8">
        <PageSectionHeader
          title="محصولات پذیرفته‌شده"
          subtitle="محصولاتی که حداقل یک RFP برای آن‌ها ثبت کرده‌اید در این بخش فهرست می‌شوند."
        />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              to={`/dashboard/dropshipping/dropshipper/products/${product._id}`}
              showProviderRating={true}
              mode="dropshipper"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
