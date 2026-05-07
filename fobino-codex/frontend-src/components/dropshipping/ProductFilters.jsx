
import React, { useState } from 'react';

export default function ProductFilters({ value, onChange }) {
  const [local, setLocal] = useState(value || {});

  const patch = (key, nextValue) => {
    const merged = { ...local, [key]: nextValue };
    setLocal(merged);
  };

  return (
    <div className="product-filters-card mt-24">
      <div className="filters-grid">
        <input
          value={local.search || ''}
          onChange={(e) => patch('search', e.target.value)}
          placeholder="جستجو بر اساس نام محصول"
        />
        <input
          value={local.category || ''}
          onChange={(e) => patch('category', e.target.value)}
          placeholder="دسته‌بندی"
        />
        <input
          value={local.minPrice || ''}
          onChange={(e) => patch('minPrice', e.target.value)}
          placeholder="حداقل قیمت"
        />
        <input
          value={local.maxPrice || ''}
          onChange={(e) => patch('maxPrice', e.target.value)}
          placeholder="حداکثر قیمت"
        />
        <input
          value={local.province || ''}
          onChange={(e) => patch('province', e.target.value)}
          placeholder="استان"
        />
        <input
          value={local.city || ''}
          onChange={(e) => patch('city', e.target.value)}
          placeholder="شهر"
        />
      </div>

      <div className="filters-actions mt-16">
        <button className="primary-btn" onClick={() => onChange?.(local)}>
          اعمال فیلتر
        </button>
        <button
          className="secondary-btn"
          onClick={() => {
            const reset = {
              search: '',
              category: '',
              minPrice: '',
              maxPrice: '',
              province: '',
              city: '',
              page: 1,
              limit: value?.limit || 12
            };
            setLocal(reset);
            onChange?.(reset);
          }}
        >
          حذف فیلترها
        </button>
      </div>
    </div>
  );
}
