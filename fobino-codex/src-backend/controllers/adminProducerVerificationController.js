const producerVerificationService = require('../services/producerVerificationService');
const { asyncHandler } = require('../middleware/errorHandler');
const response = require('../utils/responseFormatter');

exports.list = asyncHandler(async (req, res) => {
  const items = await producerVerificationService.listForAdmin(req.query);
  return response.success(res, { items });
});

exports.getOne = asyncHandler(async (req, res) => {
  const verification = await producerVerificationService.getForAdmin(req.params.id);
  if (!verification) return response.notFound(res, 'درخواست احراز یافت نشد');
  return response.success(res, { verification });
});

exports.approveLevel = asyncHandler(async (req, res) => {
  const verification = await producerVerificationService.reviewLevel({
    id: req.params.id,
    level: Number(req.params.level),
    action: 'approve',
    adminId: req.user._id,
  });
  return response.success(res, { verification }, 'سطح احراز تایید شد');
});

exports.rejectLevel = asyncHandler(async (req, res) => {
  const verification = await producerVerificationService.reviewLevel({
    id: req.params.id,
    level: Number(req.params.level),
    action: 'reject',
    adminId: req.user._id,
    reason: req.body?.reason,
  });
  return response.success(res, { verification }, 'سطح احراز رد شد');
});

exports.requestResubmit = asyncHandler(async (req, res) => {
  const verification = await producerVerificationService.reviewLevel({
    id: req.params.id,
    level: Number(req.params.level),
    action: 'request_resubmit',
    adminId: req.user._id,
    reason: req.body?.reason,
  });
  return response.success(res, { verification }, 'درخواست اصلاح ثبت شد');
});

exports.scheduleVisit = asyncHandler(async (req, res) => {
  const verification = await producerVerificationService.reviewLevel({
    id: req.params.id,
    level: 3,
    action: 'schedule',
    adminId: req.user._id,
    scheduledAt: req.body?.scheduledAt,
  });
  return response.success(res, { verification }, 'زمان بازدید ثبت شد');
});

exports.markVisited = asyncHandler(async (req, res) => {
  const verification = await producerVerificationService.reviewLevel({
    id: req.params.id,
    level: 3,
    action: 'mark_visited',
    adminId: req.user._id,
    adminVisitNotes: req.body?.adminVisitNotes,
  });
  return response.success(res, { verification }, 'بازدید حضوری ثبت شد');
});

exports.addNote = asyncHandler(async (req, res) => {
  const verification = await producerVerificationService.addAdminNote(req.params.id, req.user._id, req.body?.note || '');
  return response.success(res, { verification }, 'یادداشت ادمین ثبت شد');
});
