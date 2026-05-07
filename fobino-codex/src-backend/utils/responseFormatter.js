const success = (res, data = null, message = 'عملیات با موفقیت انجام شد', statusCode = 200) => {
  const payload = {
    success: true,
    message,
  };

  if (data !== null) {
    payload.data = data;
  }

  return res.status(statusCode).json(payload);
};

const created = (res, data = null, message = 'با موفقیت ایجاد شد') => {
  return success(res, data, message, 201);
};

const error = (res, message = 'خطایی رخ داد', statusCode = 400, code = null, errors = null) => {
  const payload = {
    success: false,
    message,
  };

  if (code) payload.code = code;
  if (errors) payload.errors = errors;

  return res.status(statusCode).json(payload);
};

const notFound = (res, message = 'منبع مورد نظر یافت نشد') => {
  return error(res, message, 404, 'NOT_FOUND');
};

const unauthorized = (res, message = 'برای دسترسی به این بخش باید وارد شوید') => {
  return error(res, message, 401, 'UNAUTHORIZED');
};

const forbidden = (res, message = 'شما دسترسی لازم را ندارید') => {
  return error(res, message, 403, 'FORBIDDEN');
};

const validationError = (res, errors, message = 'داده‌های ورودی نامعتبر است') => {
  return error(res, message, 400, 'VALIDATION_ERROR', errors);
};

const serverError = (res, message = 'خطای سرور') => {
  return error(res, message, 500, 'SERVER_ERROR');
};

const conflict = (res, message = 'تداخل در داده‌ها') => {
  return error(res, message, 409, 'CONFLICT');
};

const rateLimit = (res, message = 'تعداد درخواست‌ها بیش از حد مجاز است') => {
  return error(res, message, 429, 'RATE_LIMIT');
};

const paginated = (res, data, pagination, message = 'عملیات با موفقیت انجام شد') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};

const ledgerSummary = (res, summary, message = 'خلاصه کیف پول دریافت شد') => {
  return res.status(200).json({
    success: true,
    message,
    data: summary,
  });
};

const ledgerResponse = (res, payload, pagination, message = 'لجر کیف پول دریافت شد') => {
  return res.status(200).json({
    success: true,
    message,
    data: payload,
    pagination,
  });
};

const custom = (res, statusCode, data) => {
  return res.status(statusCode).json(data);
};

module.exports = {
  success,
  created,
  error,
  notFound,
  unauthorized,
  forbidden,
  validationError,
  serverError,
  conflict,
  rateLimit,
  paginated,
  ledgerSummary,
  ledgerResponse,
  custom,
};  