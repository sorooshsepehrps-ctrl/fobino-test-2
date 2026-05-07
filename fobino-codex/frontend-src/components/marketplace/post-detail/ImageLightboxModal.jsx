import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function ImageLightboxModal({
  open,
  images = [],
  currentIndex = 0,
  onClose,
  onPrev,
  onNext,
  title = '',
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
      if (event.key === 'ArrowLeft') onNext?.();
      if (event.key === 'ArrowRight') onPrev?.();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, onNext, onPrev]);

  if (!open || !images.length) return null;

  const activeImage = images[currentIndex];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/90 p-3 backdrop-blur-md md:p-6">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/20"
        aria-label="بستن"
      >
        <X className="h-6 w-6" />
      </button>

      {images.length > 1 ? (
        <>
          <button
            type="button"
            onClick={onPrev}
            className="absolute right-4 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/20 md:right-8"
            aria-label="تصویر قبلی"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={onNext}
            className="absolute left-4 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/20 md:left-8"
            aria-label="تصویر بعدی"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        </>
      ) : null}

      <div className="w-full max-w-6xl">
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_30px_100px_-40px_rgba(15,23,42,0.6)]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-white">
            <div>
              <h3 className="text-base font-black md:text-lg">{title || 'تصاویر آگهی'}</h3>
              <p className="mt-1 text-xs font-medium text-white/60">
                تصویر {currentIndex + 1} از {images.length}
              </p>
            </div>
          </div>

          <div className="flex min-h-[320px] items-center justify-center bg-slate-950 md:min-h-[620px]">
            <img
              src={activeImage?.url || activeImage}
              alt={title || 'post image'}
              className="max-h-[78vh] w-auto max-w-full object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}