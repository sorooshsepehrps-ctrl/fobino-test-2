export const POST_TYPE_OPTIONS = [
  {
    value: 'sell',
    title: 'آگهی فروش',
    description: 'برای ثبت کالا یا محصولی که قصد فروش آن را دارید.',
    accent: 'blue',
  },
  {
    value: 'buy',
    title: 'آگهی خرید',
    description: 'برای ثبت نیازمندی خرید و دریافت پیشنهاد از فروشندگان.',
    accent: 'red',
  },
];

export const WIZARD_STEP_KEYS = {
  type: 'type',
  category: 'category',
  general: 'general',
  details: 'details',
  review: 'review',
};

export const PRODUCT_TYPE_OPTIONS = [
  { value: 'new', label: 'نو' },
  { value: 'used', label: 'کارکرده' },
  { value: 'refurbished', label: 'بازسازی‌شده' },
  { value: 'wholesale', label: 'عمده' },
  { value: 'retail', label: 'خرده' },
];

export const UNIT_OPTIONS = [
  { value: 'ton', label: 'تن' },
  { value: 'kg', label: 'کیلوگرم' },
  { value: 'gram', label: 'گرم' },
  { value: 'meter', label: 'متر' },
  { value: 'sqm', label: 'متر مربع' },
  { value: 'piece', label: 'عدد' },
  { value: 'pack', label: 'بسته' },
  { value: 'roll', label: 'رول' },
  { value: 'liter', label: 'لیتر' },
  { value: 'box', label: 'جعبه' },
  { value: 'container', label: 'کانتینر' },
  { value: 'pallet', label: 'پالت' },
];

export const USAGE_TYPE_OPTIONS = [
  { value: 'domestic', label: 'داخلی' },
  { value: 'export', label: 'صادراتی' },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'نقدی' },
  { value: 'fobino_secure', label: 'پرداخت امن فوبینو' },
  { value: 'installment', label: 'اقساطی' },
  { value: 'credit', label: 'اعتباری' },
  { value: 'other', label: 'سایر' },
];

export function getWizardSteps(type = 'sell') {
  return [
    {
      key: WIZARD_STEP_KEYS.type,
      title: 'نوع آگهی',
      description: 'انتخاب خرید یا فروش',
    },
    {
      key: WIZARD_STEP_KEYS.category,
      title: 'دسته‌بندی',
      description: 'انتخاب سطح ۱ تا ۳',
    },
    {
      key: WIZARD_STEP_KEYS.general,
      title: 'اطلاعات عمومی',
      description: 'عنوان، توضیحات و تنظیمات پایه',
    },
    {
      key: WIZARD_STEP_KEYS.details,
      title: type === 'buy' ? 'جزئیات خرید' : 'جزئیات فروش',
      description: type === 'buy' ? 'فرم کامل نیازمندی خرید' : 'فرم کامل فروش',
    },
    {
      key: WIZARD_STEP_KEYS.review,
      title: 'بررسی نهایی',
      description: 'آماده ثبت',
    },
  ];
}

export function getPostStatusMeta(status) {
  switch (status) {
    case 'active':
      return { label: 'فعال', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    case 'inactive':
      return { label: 'غیرفعال', className: 'bg-slate-100 text-slate-700 border-slate-200' };
    case 'draft':
      return { label: 'پیش‌نویس', className: 'bg-amber-50 text-amber-700 border-amber-100' };
    case 'pending':
      return { label: 'در انتظار بررسی', className: 'bg-blue-50 text-blue-700 border-blue-100' };
    case 'rejected':
      return { label: 'رد شده', className: 'bg-red-50 text-red-600 border-red-100' };
    case 'sold':
      return { label: 'فروخته شده', className: 'bg-violet-50 text-violet-700 border-violet-100' };
    case 'expired':
      return { label: 'منقضی شده', className: 'bg-orange-50 text-orange-700 border-orange-100' };
    case 'deleted':
      return { label: 'حذف شده', className: 'bg-slate-100 text-slate-500 border-slate-200' };
    default:
      return { label: status || 'نامشخص', className: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

export function getPostTypeLabel(type) {
  return type === 'buy' ? 'آگهی خرید' : 'آگهی فروش';
}

export function getPostTypeBadgeClass(type) {
  return type === 'buy'
    ? 'bg-red-50 text-red-600 border-red-100'
    : 'bg-blue-50 text-blue-700 border-blue-100';
}

export function getCategoryChildren(category) {
  return Array.isArray(category?.children) ? category.children : [];
}

export function formatMoney(value) {
  if (value === undefined || value === null || value === '') return 'توافقی';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 'توافقی';
  return `${numeric.toLocaleString('fa-IR')} ریال`;
}

export function buildMyPostPrice(post) {
  if (!post) return 'توافقی';

  if (post.type === 'sell') {
    if (post.minPricePerUnit && post.maxPricePerUnit) {
      if (Number(post.minPricePerUnit) === Number(post.maxPricePerUnit)) {
        return formatMoney(post.minPricePerUnit);
      }
      return `${Number(post.minPricePerUnit).toLocaleString('fa-IR')} تا ${Number(post.maxPricePerUnit).toLocaleString('fa-IR')} ریال`;
    }
    return 'توافقی';
  }

  if (post.maxBudget) {
    return `تا ${Number(post.maxBudget).toLocaleString('fa-IR')} ریال`;
  }

  return 'توافقی';
}

export function getPostLocation(post) {
  if (!post) return 'ثبت نشده';

  if (post.type === 'buy') {
    return [post.deliveryProvince, post.deliveryCity].filter(Boolean).join(' - ') || 'ثبت نشده';
  }

  return [post.province, post.city].filter(Boolean).join(' - ') || 'ثبت نشده';
}

export function createInitialPostForm(type = 'sell') {
  return {
    type,
    categoryLevel1: '',
    categoryLevel2: '',
    categoryLevel3: '',
    title: '',
    description: '',
    keywordsText: '',
    expiresAt: '',
    status: 'draft',

    productName: '',
    brand: '',
    productType: 'new',
    province: '',
    city: '',
    address: '',
    dropShipping: false,
    needsMarketer: false,
    marketerPercentage: '',
    unit: 'kg',
    availableQuantity: '',
    minOrder: '',
    minPricePerUnit: '',
    maxPricePerUnit: '',
    hasDiscount: false,
    discountPercentage: '',
    discountUntil: '',
    keyFeatures: [{ name: '', value: '' }],

    neededProductName: '',
    neededProductType: '',
    neededQuantity: '',
    neededUnit: 'kg',
    usageType: 'domestic',
    requestExpiry: '',
    paymentMethods: ['cash'],
    deliveryProvince: '',
    deliveryCity: '',
    deliveryAddress: '',
    maxBudget: '',
    additionalRequirements: '',
  };
}

export function normalizeKeywords(keywordsText = '') {
  return keywordsText
    .split(/[\n،,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeKeyFeatures(items = []) {
  return items
    .map((item) => ({
      name: item?.name?.trim() || '',
      value: item?.value?.trim() || '',
    }))
    .filter((item) => item.name && item.value);
}

export function buildCreatePostPayload(form, mode = 'draft') {
  const payload = {
    type: form.type,
    title: form.title?.trim(),
    description: form.description?.trim(),
    categoryLevel1: form.categoryLevel1,
    categoryLevel2: form.categoryLevel2,
    categoryLevel3: form.categoryLevel3,
    keywords: normalizeKeywords(form.keywordsText),
    status: mode === 'publish' ? 'active' : 'draft',
  };

  if (form.expiresAt) {
    payload.expiresAt = form.expiresAt;
  }

  if (form.type === 'sell') {
    payload.productName = form.productName?.trim();
    payload.brand = form.brand?.trim();
    payload.productType = form.productType;
    payload.province = form.province?.trim();
    payload.city = form.city?.trim();
    payload.address = form.address?.trim();
    payload.dropShipping = !!form.dropShipping;
    payload.needsMarketer = !!form.needsMarketer;
    payload.marketerPercentage = form.needsMarketer ? Number(form.marketerPercentage || 0) : 0;
    payload.unit = form.unit;
    payload.availableQuantity = Number(form.availableQuantity || 0);
    payload.minOrder = Number(form.minOrder || 0);
    payload.minPricePerUnit = Number(form.minPricePerUnit || 0);
    payload.maxPricePerUnit = Number(form.maxPricePerUnit || 0);
    payload.hasDiscount = !!form.hasDiscount;
    payload.discountPercentage = form.hasDiscount ? Number(form.discountPercentage || 0) : 0;
    payload.discountUntil = form.hasDiscount && form.discountUntil ? form.discountUntil : undefined;
    payload.keyFeatures = normalizeKeyFeatures(form.keyFeatures);
  }

  if (form.type === 'buy') {
    payload.neededProductName = form.neededProductName?.trim();
    payload.neededProductType = form.neededProductType?.trim();
    payload.neededQuantity = Number(form.neededQuantity || 0);
    payload.neededUnit = form.neededUnit;
    payload.usageType = form.usageType;
    payload.requestExpiry = form.requestExpiry;
    payload.paymentMethods = Array.isArray(form.paymentMethods) && form.paymentMethods.length
      ? form.paymentMethods
      : ['cash'];
    payload.deliveryProvince = form.deliveryProvince?.trim();
    payload.deliveryCity = form.deliveryCity?.trim();
    payload.deliveryAddress = form.deliveryAddress?.trim();
    payload.maxBudget = form.maxBudget ? Number(form.maxBudget) : undefined;
    payload.additionalRequirements = form.additionalRequirements?.trim();
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  return payload;
}

export function validateWizardStep(form, stepKey) {
  if (stepKey === WIZARD_STEP_KEYS.type) {
    if (!form.type) return 'نوع آگهی را انتخاب کن';
    return null;
  }

  if (stepKey === WIZARD_STEP_KEYS.category) {
    if (!form.categoryLevel1 || !form.categoryLevel2 || !form.categoryLevel3) {
      return 'هر سه سطح دسته‌بندی باید انتخاب شوند';
    }
    return null;
  }

  if (stepKey === WIZARD_STEP_KEYS.general) {
    if (!form.title?.trim()) return 'عنوان آگهی الزامی است';
    if ((form.title || '').trim().length < 5) return 'عنوان باید حداقل ۵ کاراکتر باشد';
    if (!form.description?.trim()) return 'توضیحات آگهی الزامی است';
    if ((form.description || '').trim().length < 20) return 'توضیحات باید حداقل ۲۰ کاراکتر باشد';
    return null;
  }

  if (stepKey === WIZARD_STEP_KEYS.details) {
    if (form.type === 'sell') {
      if (!form.productName?.trim()) return 'نام محصول الزامی است';
      if (!form.brand?.trim()) return 'برند الزامی است';
      if (!form.province?.trim()) return 'استان الزامی است';
      if (!form.city?.trim()) return 'شهر الزامی است';
      if (!form.unit) return 'واحد الزامی است';
      if (form.availableQuantity === '') return 'موجودی الزامی است';
      if (form.minOrder === '') return 'حداقل سفارش الزامی است';
      if (form.minPricePerUnit === '') return 'حداقل قیمت الزامی است';
      if (form.maxPricePerUnit === '') return 'حداکثر قیمت الزامی است';
      if (form.needsMarketer && form.marketerPercentage === '') return 'درصد بازاریاب الزامی است';
      if (form.hasDiscount && form.discountPercentage === '') return 'درصد تخفیف الزامی است';
      if (form.hasDiscount && !form.discountUntil) return 'تاریخ پایان تخفیف الزامی است';
      return null;
    }

    if (!form.neededProductName?.trim()) return 'نام محصول مورد نیاز الزامی است';
    if (!form.neededProductType?.trim()) return 'نوع محصول مورد نیاز الزامی است';
    if (form.neededQuantity === '') return 'مقدار مورد نیاز الزامی است';
    if (!form.neededUnit) return 'واحد مورد نیاز الزامی است';
    if (!form.usageType) return 'نوع مصرف الزامی است';
    if (!form.requestExpiry) return 'تاریخ انقضای درخواست الزامی است';
    if (!form.deliveryProvince?.trim()) return 'استان تحویل الزامی است';
    if (!form.deliveryCity?.trim()) return 'شهر تحویل الزامی است';
    return null;
  }

  return null;
}

export function getPostViews(post) {
  if (!post) return 0;
  return Number(post?.stats?.views || post?.views || 0);
}

export function buildMyPostShortDescription(post) {
  if (!post) return '—';

  if (post.type === 'buy') {
    return (
      post.additionalRequirements ||
      post.description ||
      'نیازمندی خرید ثبت شده و آماده دریافت پیشنهاد است.'
    );
  }

  return (
    post.description ||
    'اطلاعات تکمیلی این آگهی در صفحه جزئیات قابل مشاهده است.'
  );
}

export function filterMyPosts(posts = [], { status = '', search = '' } = {}) {
  return posts.filter((post) => {
    const matchesStatus = status ? post?.status === status : true;
    const q = (search || '').trim().toLowerCase();

    const matchesSearch = q
      ? [post?.title, post?.productName, post?.neededProductName, post?.brand]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q))
      : true;

    return matchesStatus && matchesSearch;
  });
}

export function createEditablePostForm() {
  return {
    title: '',
    description: '',
    keywordsText: '',
    expiresAt: '',

    province: '',
    city: '',
    address: '',
    availableQuantity: '',
    minOrder: '',
    minPricePerUnit: '',
    maxPricePerUnit: '',
    hasDiscount: false,
    discountPercentage: '',
    discountUntil: '',

    neededQuantity: '',
    neededUnit: 'kg',
    requestExpiry: '',
    deliveryProvince: '',
    deliveryCity: '',
    deliveryAddress: '',
    maxBudget: '',
    additionalRequirements: '',
    paymentMethods: ['cash'],
  };
}

export function fillEditablePostForm(post) {
  return {
    title: post?.title || '',
    description: post?.description || '',
    keywordsText: Array.isArray(post?.keywords) ? post.keywords.join('، ') : '',
    expiresAt: post?.expiresAt ? String(post.expiresAt).slice(0, 10) : '',

    province: post?.province || '',
    city: post?.city || '',
    address: post?.address || '',
    availableQuantity:
      post?.availableQuantity !== undefined && post?.availableQuantity !== null
        ? String(post.availableQuantity)
        : '',
    minOrder:
      post?.minOrder !== undefined && post?.minOrder !== null ? String(post.minOrder) : '',
    minPricePerUnit:
      post?.minPricePerUnit !== undefined && post?.minPricePerUnit !== null
        ? String(post.minPricePerUnit)
        : '',
    maxPricePerUnit:
      post?.maxPricePerUnit !== undefined && post?.maxPricePerUnit !== null
        ? String(post.maxPricePerUnit)
        : '',
    hasDiscount: !!post?.hasDiscount,
    discountPercentage:
      post?.discountPercentage !== undefined && post?.discountPercentage !== null
        ? String(post.discountPercentage)
        : '',
    discountUntil: post?.discountUntil ? String(post.discountUntil).slice(0, 10) : '',

    neededQuantity:
      post?.neededQuantity !== undefined && post?.neededQuantity !== null
        ? String(post.neededQuantity)
        : '',
    neededUnit: post?.neededUnit || 'kg',
    requestExpiry: post?.requestExpiry ? String(post.requestExpiry).slice(0, 10) : '',
    deliveryProvince: post?.deliveryProvince || '',
    deliveryCity: post?.deliveryCity || '',
    deliveryAddress: post?.deliveryAddress || '',
    maxBudget:
      post?.maxBudget !== undefined && post?.maxBudget !== null ? String(post.maxBudget) : '',
    additionalRequirements: post?.additionalRequirements || '',
    paymentMethods:
      Array.isArray(post?.paymentMethods) && post.paymentMethods.length
        ? post.paymentMethods
        : ['cash'],
  };
}

export function buildUpdatePostPayload(post, form) {
  const payload = {
    title: form.title?.trim(),
    description: form.description?.trim(),
    keywords: normalizeKeywords(form.keywordsText),
    expiresAt: form.expiresAt || undefined,
  };

  if (post?.type === 'sell') {
    payload.province = form.province?.trim();
    payload.city = form.city?.trim();
    payload.address = form.address?.trim();
    payload.availableQuantity =
      form.availableQuantity === '' ? undefined : Number(form.availableQuantity);
    payload.minOrder = form.minOrder === '' ? undefined : Number(form.minOrder);
    payload.minPricePerUnit =
      form.minPricePerUnit === '' ? undefined : Number(form.minPricePerUnit);
    payload.maxPricePerUnit =
      form.maxPricePerUnit === '' ? undefined : Number(form.maxPricePerUnit);
    payload.hasDiscount = !!form.hasDiscount;
    payload.discountPercentage = form.hasDiscount
      ? Number(form.discountPercentage || 0)
      : 0;
    payload.discountUntil =
      form.hasDiscount && form.discountUntil ? form.discountUntil : undefined;
  }

  if (post?.type === 'buy') {
    payload.neededQuantity =
      form.neededQuantity === '' ? undefined : Number(form.neededQuantity);
    payload.neededUnit = form.neededUnit;
    payload.requestExpiry = form.requestExpiry || undefined;
    payload.deliveryProvince = form.deliveryProvince?.trim();
    payload.deliveryCity = form.deliveryCity?.trim();
    payload.deliveryAddress = form.deliveryAddress?.trim();
    payload.maxBudget = form.maxBudget === '' ? undefined : Number(form.maxBudget);
    payload.additionalRequirements = form.additionalRequirements?.trim();
    payload.paymentMethods =
      Array.isArray(form.paymentMethods) && form.paymentMethods.length
        ? form.paymentMethods
        : ['cash'];
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) delete payload[key];
  });

  return payload;
}