// frontend/my-app/src/pages/dashboard/dropshipping/dropshipper/CreateRFPRequestPage.jsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dropshippingService from '../../../../services/dropshippingService';
import CreateRFPRequest from './CreateRFPRequest';

export default function CreateRFPRequestPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await dropshippingService.getDropshipperProductDetail(id);
        const productData = response?.data || response;
        setProduct(productData);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('محصول یافت نشد');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-lg font-medium text-slate-700">در حال بارگذاری محصول...</div>
          <div className="text-sm text-slate-500">لطفاً چند لحظه صبر کنید</div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <div className="mb-2 text-lg font-medium text-red-600">{error || 'محصول یافت نشد'}</div>
          <button
            onClick={() => navigate('/dashboard/dropshipping/dropshipper/products')}
            className="mt-4 rounded-xl bg-slate-900 px-6 py-2 text-white hover:bg-slate-800"
          >
            بازگشت به لیست محصولات
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <CreateRFPRequest
        open={true}
        onClose={() => navigate('/dashboard/dropshipping/dropshipper/products')}
        product={product}
        onCreated={() => navigate('/dashboard/dropshipping/dropshipper/accepted-products')}
      />
    </div>
  );
}