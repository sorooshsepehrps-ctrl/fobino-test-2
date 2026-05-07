export const DEFAULT_USER_AVATAR =
  'https://ui-avatars.com/api/?name=Fobino&background=e2e8f0&color=0f172a&bold=true';

export const DEFAULT_POST_IMAGE =
  'https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=1200&auto=format&fit=crop';

export function getUserDisplayName(user) {
  if (!user) return 'کاربر فوبینو';
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return fullName || user.fullName || 'کاربر فوبینو';
}

export function getUserAvatar(user) {
  return user?.profileImage || DEFAULT_USER_AVATAR;
}

export function getPostPrimaryImage(post) {
  if (post?.primaryImage?.url) return post.primaryImage.url;
  if (post?.primaryImage && typeof post.primaryImage === 'string') return post.primaryImage;

  if (post?.productImages?.length) {
    const primaryFromProductImages = post.productImages.find((img) => img?.isPrimary);
    if (primaryFromProductImages?.url) return primaryFromProductImages.url;
    if (post.productImages[0]?.url) return post.productImages[0].url;
  }

  if (post?.images?.length) {
    const primary = post.images.find((img) => img?.isPrimary);
    if (primary?.url) return primary.url;
    if (post.images[0]?.url) return post.images[0].url;
  }

  return DEFAULT_POST_IMAGE;
}

export function formatPrice(value) {
  if (value === undefined || value === null || value === '') return 'توافقی';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 'توافقی';
  return `${numeric.toLocaleString('fa-IR')} ریال`;
}

export function getPostTypeLabel(type) {
  return type === 'buy' ? 'آگهی خرید' : 'آگهی فروش';
}

export function getPostTypeTheme(type) {
  return type === 'buy'
    ? {
        badge: 'bg-red-50 text-red-600 border-red-100',
        soft: 'bg-red-50 text-red-700',
      }
    : {
        badge: 'bg-blue-50 text-blue-700 border-blue-100',
        soft: 'bg-blue-50 text-blue-700',
      };
}

export function buildPosterMeta(post) {
  if (post?.type === 'buy') {
    const city = post?.deliveryCity || '';
    const province = post?.deliveryProvince || '';
    return [city, province].filter(Boolean).join(' - ');
  }

  const city = post?.location?.city || post?.city || '';
  const province = post?.location?.province || post?.province || '';
  return [city, province].filter(Boolean).join(' - ');
}

export function getPostShortDescription(post) {
  if (post?.type === 'buy') {
    return (
      post?.additionalRequirements ||
      post?.description ||
      'اطلاعات تکمیلی این درخواست خرید از طریق تماس با آگهی‌دهنده قابل مشاهده است.'
    );
  }

  return (
    post?.description ||
    post?.content ||
    post?.summary ||
    'اطلاعات تکمیلی این آگهی در صفحه جزئیات یا از طریق ارتباط با آگهی‌دهنده قابل مشاهده است.'
  );
}

export function buildPostsResultText(total = 0, type = 'sell') {
  if (!total) {
    return type === 'buy'
      ? 'هیچ آگهی خریدی پیدا نشد'
      : 'هیچ آگهی فروشی پیدا نشد';
  }

  return `${total.toLocaleString('fa-IR')} ${
    type === 'buy' ? 'آگهی خرید' : 'آگهی فروش'
  } پیدا شد`;
}

export function isPostSpecialActive(post) {
  return Boolean(post?.isSpecialActive || post?.isSpecial);
}

export function isPostNardebanActive(post) {
  return Boolean(post?.isNardebanActive || post?.isNardeban);
}

export function getPostViews(post) {
  return Number(post?.stats?.views || post?.views || 0);
}