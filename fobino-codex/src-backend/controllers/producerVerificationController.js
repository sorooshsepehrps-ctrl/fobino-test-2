const producerVerificationService = require('../services/producerVerificationService');
const { asyncHandler } = require('../middleware/errorHandler');
const response = require('../utils/responseFormatter');

function filesFromRequest(req) {
  if (Array.isArray(req.files)) return req.files;
  if (!req.files || typeof req.files !== 'object') return [];
  return Object.values(req.files).flat();
}

function parseJsonBody(req) {
  const body = { ...(req.body || {}) };
  for (const key of ['production', 'address', 'preferredDates']) {
    if (typeof body[key] === 'string') {
      try { body[key] = JSON.parse(body[key]); } catch (error) {}
    }
  }
  return body;
}

exports.getMine = asyncHandler(async (req, res) => {
  const verification = await producerVerificationService.getMine(req.user._id);
  return response.success(res, { verification });
});

exports.saveLevel1Draft = asyncHandler(async (req, res) => {
  const verification = await producerVerificationService.saveLevel1Draft(req.user._id, parseJsonBody(req));
  return response.success(res, { verification }, 'پیش‌نویس سطح ۱ ذخیره شد');
});

exports.uploadLevel1Photos = asyncHandler(async (req, res) => {
  const verification = await producerVerificationService.uploadLevel1Photos(req.user._id, filesFromRequest(req));
  return response.success(res, { verification }, 'عکس‌های تولیدی بارگذاری شد');
});

exports.submitLevel1 = asyncHandler(async (req, res) => {
  const verification = await producerVerificationService.submitLevel1(req.user._id);
  return response.success(res, { verification }, 'سطح ۱ برای بررسی ارسال شد');
});

exports.uploadLevel2Documents = asyncHandler(async (req, res) => {
  const verification = await producerVerificationService.uploadLevel2Documents(req.user._id, filesFromRequest(req));
  return response.success(res, { verification }, 'مدارک تولیدی بارگذاری شد');
});

exports.submitLevel2 = asyncHandler(async (req, res) => {
  const verification = await producerVerificationService.submitLevel2(req.user._id);
  return response.success(res, { verification }, 'سطح ۲ برای بررسی ارسال شد');
});

exports.requestLevel3Visit = asyncHandler(async (req, res) => {
  const verification = await producerVerificationService.requestLevel3Visit(req.user._id, parseJsonBody(req));
  return response.success(res, { verification }, 'درخواست بازدید حضوری ثبت شد');
});
