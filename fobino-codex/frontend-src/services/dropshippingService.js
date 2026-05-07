

import api from '../config/api';

const normalizeApiError = (error, fallback) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback ||
    'خطای ناشناخته'
  );
};

const unwrap = async (request, fallbackMessage) => {
  try {
    const response = await request;
    return response?.data;
  } catch (error) {
    throw new Error(normalizeApiError(error, fallbackMessage));
  }
};

const dropshippingService = {
  // Role Status - ADD THIS
  getDropshippingRoleStatus: () =>
    unwrap(api.get('/dropshipping/agreements/me'), 'دریافت وضعیت نقش‌ها با خطا روبه‌رو شد'),

  // Dashboard
  getProviderDashboardSummary: () =>
    unwrap(api.get('/dropshipping/dashboard/provider'), 'دریافت اطلاعات پنل تامین‌کننده با خطا روبه‌رو شد'),
  getDropshipperDashboardSummary: () =>
    unwrap(api.get('/dropshipping/dashboard/dropshipper'), 'دریافت اطلاعات پنل دراپ‌شیپر با خطا روبه‌رو شد'),

  // Products - provider
  createProduct: (data) =>
    unwrap(api.post('/dropshipping/products', data), 'ایجاد محصول با خطا روبه‌رو شد'),
  getMyProducts: (params = {}) =>
    unwrap(api.get('/dropshipping/products/my-products', { params }), 'دریافت لیست محصولات با خطا روبه‌رو شد'),
  getProductById: (id) =>
    unwrap(api.get(`/dropshipping/products/${id}`), 'دریافت اطلاعات محصول با خطا روبه‌رو شد'),
  updateProduct: (id, data) =>
    unwrap(api.put(`/dropshipping/products/${id}`, data), 'ویرایش محصول با خطا روبه‌رو شد'),
  deleteProduct: (id) =>
    unwrap(api.delete(`/dropshipping/products/${id}`), 'حذف محصول با خطا روبه‌رو شد'),
  toggleProductStatus: (id) =>
    unwrap(api.patch(`/dropshipping/products/${id}/toggle-status`), 'تغییر وضعیت محصول با خطا روبه‌رو شد'),
  updateStock: (id, quantity) =>
    unwrap(api.patch(`/dropshipping/products/${id}/stock`, { quantity }), 'به‌روزرسانی موجودی با خطا روبه‌رو شد'),
  getProductRFPs: (id) =>
    unwrap(api.get(`/dropshipping/products/${id}/rfps`), 'دریافت RFPهای محصول با خطا روبه‌رو شد'),

  // Products - dropshipper
  browseProducts: (params = {}) =>
    unwrap(api.get('/dropshipping/products/browse', { params }), 'دریافت لیست محصولات با مشکل روبه‌رو شد'),
  getAcceptedProducts: (params = {}) =>
    unwrap(api.get('/dropshipping/products/accepted', { params }), 'دریافت محصولات پذیرفته‌شده با خطا روبه‌رو شد'),
  getDropshipperProducts: (params = {}) =>
    unwrap(api.get('/dropshipping/products/browse', { params }), 'دریافت لیست محصولات با مشکل روبه‌رو شد'),
  getDropshipperProductDetail: (id) =>
    unwrap(api.get(`/dropshipping/products/${id}`), 'دریافت جزئیات محصول با خطا روبه‌رو شد'),

  // RFPs
  createRFP: (payload) =>
    unwrap(api.post('/dropshipping/rfps', payload), 'ایجاد RFP با خطا روبه‌رو شد'),
  getMyRFPs: (params = {}) =>
    unwrap(api.get('/dropshipping/rfps', { params }), 'دریافت RFPها با خطا روبه‌رو شد'),
  getRFPById: (id) =>
    unwrap(api.get(`/dropshipping/rfps/${id}`), 'دریافت جزئیات RFP با خطا روبه‌رو شد'),
  approveRFP: (id) =>
    unwrap(api.patch(`/dropshipping/rfps/${id}/approve`), 'تایید RFP با خطا روبه‌رو شد'),
  editRFP: (id, changes) =>
    unwrap(api.patch(`/dropshipping/rfps/${id}/edit`, changes), 'ویرایش RFP با خطا روبه‌رو شد'),
  rejectRFP: (id, payload) =>
    unwrap(api.patch(`/dropshipping/rfps/${id}/reject`, payload), 'رد RFP با خطا روبه‌رو شد'),
  processPayment: (id) =>
    unwrap(api.post(`/dropshipping/rfps/${id}/payment`), 'پرداخت RFP با خطا روبه‌رو شد'),
  processRfpPayment: (id) =>
    unwrap(api.post(`/dropshipping/rfps/${id}/pay`), 'پرداخت RFP با خطا روبه‌رو شد'),
  markShipped: (id, trackingCode) =>
    unwrap(api.patch(`/dropshipping/rfps/${id}/ship`, { trackingCode }), 'ثبت کد رهگیری با خطا روبه‌رو شد'),
  confirmDelivery: (id) =>
    unwrap(api.patch(`/dropshipping/rfps/${id}/confirm-delivery`), 'تایید تحویل با خطا روبه‌رو شد'),
  confirmRfpDelivery: (id) =>
    unwrap(api.patch(`/dropshipping/rfps/${id}/confirm-delivery`), 'تایید تحویل با خطا روبه‌رو شد'),

  // Ratings
  submitRating: (payload) =>
    unwrap(api.post('/dropshipping/ratings', payload), 'ثبت امتیاز با خطا روبه‌رو شد'),
  submitRfpRating: (payload) =>
    unwrap(api.post('/dropshipping/ratings', payload), 'ثبت امتیاز با خطا روبه‌رو شد'),
  getMyReceivedRatingStats: (role = 'provider') =>
    unwrap(api.get('/dropshipping/ratings/me', { params: { role } }), 'دریافت امتیازها با خطا روبه‌رو شد'),

  // Agreements / verification
  createAgreement: (data) =>
    unwrap(api.post('/dropshipping/agreements', data), 'ثبت درخواست تایید با خطا روبه‌رو شد'),
  getMyAgreement: (role) =>
    unwrap(api.get('/dropshipping/agreements/me', { params: role ? { role } : {} }), 'دریافت وضعیت تایید با خطا روبه‌رو شد'),
  updateAgreement: (data) =>
    unwrap(api.put('/dropshipping/agreements/me', data), 'به‌روزرسانی اطلاعات تایید با خطا روبه‌رو شد'),
  submitVerification: (data) =>
    unwrap(api.post('/dropshipping/verification', data), 'ارسال اطلاعات تایید با خطا روبه‌رو شد'),

  // Finance
  getProviderFinance: (params = {}) =>
    unwrap(api.get('/dropshipping/provider/finance/ledger', { params }), 'دریافت اطلاعات مالی تامین‌کننده با خطا روبه‌رو شد'),
  getDropshipperFinance: (params = {}) =>
    unwrap(api.get('/wallet-ledger/dropshipping/dropshipper', { params }), 'دریافت اطلاعات مالی دراپ‌شیپر با خطا روبه‌رو شد'),
};

export { normalizeApiError };
export default dropshippingService;