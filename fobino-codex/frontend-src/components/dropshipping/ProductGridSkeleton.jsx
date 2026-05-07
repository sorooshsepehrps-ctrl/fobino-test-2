
import React from 'react';
import ProductCardSkeleton from './ProductCardSkeleton';

const ProductGridSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};

export default ProductGridSkeleton;
