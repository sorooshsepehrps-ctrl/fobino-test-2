import jalaliMoment from 'jalali-moment';

// Convert to Persian/Jalali date
export const toPersianDate = (date, format = 'jYYYY/jMM/jDD') => {
  if (!date) return '';
  return jalaliMoment(date).locale('fa').format(format);
};

// Convert numbers to Persian
export const toPersianNumber = (num) => {
  if (num === null || num === undefined) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
};

// Format price with commas and Persian
export const formatPrice = (price, currency = 'تومان') => {
  if (!price && price !== 0) return '';
  const formatted = Math.floor(price / 10).toLocaleString('fa-IR');
  return `${formatted} ${currency}`;
};

// Calculate profile completion status
export const getProfileStatus = (percentage) => {
  if (percentage >= 80) return { text: 'عالی', color: 'text-green-600', bg: 'bg-green-100' };
  if (percentage >= 50) return { text: 'خوب', color: 'text-yellow-600', bg: 'bg-yellow-100' };
  if (percentage >= 25) return { text: 'متوسط', color: 'text-orange-600', bg: 'bg-orange-100' };
  return { text: 'ضعیف', color: 'text-red-600', bg: 'bg-red-100' };
};

// Validate Iranian phone number
export const isValidPhone = (phone) => {
  return /^09\d{9}$/.test(phone);
};

// Validate Iranian national code
export const isValidNationalCode = (code) => {
  if (!/^\d{10}$/.test(code)) return false;
  const check = parseInt(code[9]);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(code[i]) * (10 - i);
  }
  const remainder = sum % 11;
  return (remainder < 2 && check === remainder) || (remainder >= 2 && check === 11 - remainder);
};

// Validate IBAN (Shaba)
export const isValidShaba = (shaba) => {
  return /^IR\d{24}$/.test(shaba?.toUpperCase());
};

// Truncate text
export const truncate = (text, length = 100) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

// Get user avatar URL or default
export const getAvatarUrl = (profileImage) => {
  if (profileImage) return profileImage;
  return '/images/default-avatar.png';
};

// Generate profile share URL
export const getProfileShareUrl = (userId) => {
  const baseUrl = import.meta.env.VITE_APP_URL || 'https://fobino.ir';
  return `${baseUrl}/profile-user/${userId}`;
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  }
};

// Calculate days remaining
export const getDaysRemaining = (endDate) => {
  if (!endDate) return 0;
  const end = new Date(endDate);
  const now = new Date();
  const diff = end - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};
