export const APP_NAME = 'فوبینو';
export const APP_URL = import.meta.env.VITE_APP_URL || 'https://fobino.ir';

export const USER_TYPES = {
  INDIVIDUAL: 'individual',
  COMPANY: 'company',
};

export const USER_TYPE_LABELS = {
  individual: 'حقیقی',
  company: 'حقوقی',
};

export const VERIFICATION_LEVELS = {
  0: { name: 'سطح ۰', description: 'ثبت‌نام اولیه' },
  1: { name: 'سطح ۱', description: 'کارت ملی' },
  2: { name: 'سطح ۲', description: 'شماره شبا' },
  3: { name: 'سطح ۳', description: 'مدارک تکمیلی' },
  4: { name: 'سطح ۴', description: 'تایید نهایی' },
  5: { name: 'سطح ۵', description: 'VIP' },
};

export const SUBSCRIPTION_PLANS = [
  {
    id: 'vip',
    name: 'VIP',
    duration: '۳۶۵ روزه',
    price: 28000000,
    priceDisplay: '۲,۸۰۰,۰۰۰ تومان',
    features: [
      '۸۵ دسترسی رایگان به اطلاعات تماس در هر دوره مصرف',
      'نمایش نشان VIP در آگهی‌ها و بخش‌های عمومی',
      '۲۰ ساعت مشاوره آنلاین رایگان',
      'پشتیبانی اولویت‌دار',
    ],
    highlighted: false,
  },
  {
    id: 'producer',
    name: 'تولیدکننده',
    duration: '۳۶۵ روزه',
    price: 100000000,
    priceDisplay: '۱۰,۰۰۰,۰۰۰ تومان',
    features: [
      '۸۵ دسترسی رایگان به اطلاعات تماس در هر دوره مصرف',
      'نمایش نشان تولیدکننده با ۳ سطح ستاره‌ای پس از احراز',
      '۲۰ ساعت مشاوره آنلاین رایگان',
      'امکان ثبت درخواست مشاوره حضوری',
      'دسترسی به فلو احراز تولیدکننده',
    ],
    highlighted: true,
  },
];


export const PROVINCES = [
  'آذربایجان شرقی', 'آذربایجان غربی', 'اردبیل', 'اصفهان', 'البرز',
  'ایلام', 'بوشهر', 'تهران', 'چهارمحال و بختیاری', 'خراسان جنوبی',
  'خراسان رضوی', 'خراسان شمالی', 'خوزستان', 'زنجان', 'سمنان',
  'سیستان و بلوچستان', 'فارس', 'قزوین', 'قم', 'کردستان', 'کرمان',
  'کرمانشاه', 'کهگیلویه و بویراحمد', 'گلستان', 'گیلان', 'لرستان',
  'مازندران', 'مرکزی', 'هرمزگان', 'همدان', 'یزد',
];

export const SELLER_STATUS_OPTIONS = [
  { value: 'available', label: 'آماده به کار' },
  { value: 'busy', label: 'مشغول' },
  { value: 'away', label: 'دور از دسترس' },
  { value: 'offline', label: 'آفلاین' },
];
