import { Link } from 'react-router-dom';
import { ShoppingBag, ShoppingCart } from 'lucide-react';

export default function CategoryActionOverlay({ category }) {
  if (!category || category.level !== 3) return null;

  const sellHref = `/posts?type=sell&categoryLevel3=${category._id}`;
  const buyHref = `/posts?type=buy&categoryLevel3=${category._id}`;

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-300 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 md:block">
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/70 bg-white/95 p-2 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.35)] backdrop-blur-md">
        <Link
          to={buyHref}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
        >
          <ShoppingCart className="h-4 w-4" />
          آگهی خرید
        </Link>

        <Link
          to={sellHref}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
        >
          <ShoppingBag className="h-4 w-4" />
          آگهی فروش
        </Link>
      </div>
    </div>
  );
}