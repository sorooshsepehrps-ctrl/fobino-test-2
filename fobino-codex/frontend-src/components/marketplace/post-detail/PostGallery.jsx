import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, ImageIcon } from 'lucide-react';
import { DEFAULT_POST_IMAGE } from '../../../utils/marketplace';
import ImageLightboxModal from './ImageLightboxModal';

export default function PostGallery({ post }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const images = useMemo(() => {
    if (post?.images?.length) {
      return post.images.map((item) => ({
        url: item?.url || DEFAULT_POST_IMAGE,
        isPrimary: !!item?.isPrimary,
      }));
    }

    if (post?.primaryImage?.url) {
      return [{ url: post.primaryImage.url, isPrimary: true }];
    }

    return [{ url: DEFAULT_POST_IMAGE, isPrimary: true }];
  }, [post]);

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const activeImage = images[activeIndex];

  return (
    <>
      <div className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_25px_80px_-45px_rgba(15,23,42,0.3)]">
        <div className="relative h-[320px] overflow-hidden bg-slate-100 md:h-[520px] xl:h-[620px]">
          <img
            src={activeImage?.url}
            alt={post?.title || 'post image'}
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 md:p-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-950/70 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
              <ImageIcon className="h-4 w-4" />
              {images.length.toLocaleString('fa-IR')} تصویر
            </div>

            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-bold text-slate-900 shadow-sm backdrop-blur transition hover:bg-white"
            >
              <Expand className="h-4 w-4" />
              نمایش بزرگ
            </button>
          </div>

          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={prevSlide}
                className="absolute right-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl bg-white/85 text-slate-800 shadow-md transition hover:bg-white"
                aria-label="تصویر قبلی"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={nextSlide}
                className="absolute left-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl bg-white/85 text-slate-800 shadow-md transition hover:bg-white"
                aria-label="تصویر بعدی"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </>
          ) : null}
        </div>

        {images.length > 1 ? (
          <div className="grid grid-cols-4 gap-3 border-t border-slate-100 p-4 md:grid-cols-5 xl:grid-cols-6">
            {images.map((image, index) => (
              <button
                key={`${image.url}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`overflow-hidden rounded-2xl border-2 transition ${
                  index === activeIndex
                    ? 'border-blue-500'
                    : 'border-transparent hover:border-slate-200'
                }`}
              >
                <img
                  src={image.url}
                  alt={`${post?.title || 'post'}-${index + 1}`}
                  className="h-20 w-full object-cover md:h-24"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <ImageLightboxModal
        open={lightboxOpen}
        images={images}
        currentIndex={activeIndex}
        onClose={() => setLightboxOpen(false)}
        onPrev={prevSlide}
        onNext={nextSlide}
        title={post?.title}
      />
    </>
  );
}