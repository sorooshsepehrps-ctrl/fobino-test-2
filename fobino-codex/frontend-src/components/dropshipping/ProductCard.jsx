
import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

const money = (value) => `${Number(value || 0).toLocaleString('fa-IR')} تومان`;

const ProductCard = ({
  product,
  to,
  actions,
  showProviderRating = false,
  compact = false,
}) => {
  const image = product?.primaryImage || product?.images?.[0] || '/images/placeholder.png';
  const providerRating = product?.providerRating;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link to={to} className="block">
        <div className={`relative w-full overflow-hidden bg-slate-100 ${compact ? 'h-44' : 'h-56'}`}>
          <img src={image} alt={product?.productName || 'product'} className="h-full w-full object-cover" />
          <div className="absolute right-3 top-3">
            <StatusBadge status={product?.status} />
          </div>
          {showProviderRating ? (
            <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-amber-700 shadow-sm backdrop-blur">
              ★ {providerRating?.averageStars ? Number(providerRating.averageStars).toFixed(1) : '0.0'}
            </div>
          ) : null}
        </div>
      </Link>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to={to} className="block">
              <h3 className="truncate text-base font-black text-slate-900">{product?.productName}</h3>
            </Link>
            <p className="mt-1 truncate text-xs text-slate-500">{product?.brand || 'بدون برند'}</p>
          </div>
          <div className="text-left">
            <p className="text-xs text-slate-500">قیمت</p>
            <p className="mt-1 text-sm font-black text-slate-900">{money(product?.retailPrice)}</p>
          </div>
        </div>

        <p className="mt-4 line-clamp-2 text-sm leading-7 text-slate-500">{product?.description || '---'}</p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">RFP تکمیل‌شده</p>
            <p className="mt-1 text-sm font-black text-slate-900">{product?.rfpCounts?.completed || 0}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">RFP فعال</p>
            <p className="mt-1 text-sm font-black text-slate-900">{product?.rfpCounts?.active || 0}</p>
          </div>
        </div>

        {actions ? <div className="mt-5 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
};

export default ProductCard;
