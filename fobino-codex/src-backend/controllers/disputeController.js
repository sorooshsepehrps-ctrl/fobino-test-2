const Dispute = require('../models/Dispute');
const Deal = require('../models/Deal');
const { asyncHandler } = require('../middleware/errorHandler');
const response = require('../utils/responseFormatter');
const escrowService = require('../services/escrowService');
const notificationService = require('../services/notificationService');
const fileUploadService = require('../services/fileUploadService');
const { paginate, paginationResponse } = require('../utils/helpers');

exports.getDisputes = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = { $or: [{ buyer: req.user._id }, { seller: req.user._id }] };
  if (status) query.status = status;
  const total = await Dispute.countDocuments(query);
  const disputes = await Dispute.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit))
    .populate('deal', 'dealNumber agreedPrice status')
    .populate('buyer', 'firstName lastName')
    .populate('seller', 'firstName lastName');
  return response.paginated(res, disputes, paginationResponse(total, page, limit));
});

exports.getDispute = asyncHandler(async (req, res) => {
  const dispute = await Dispute.findById(req.params.id)
    .populate('deal').populate('buyer', 'firstName lastName profileImage')
    .populate('seller', 'firstName lastName profileImage')
    .populate('assignedTo', 'firstName lastName')
    .populate('responses.from', 'firstName lastName');
  if (!dispute) return response.notFound(res, 'اختلاف یافت نشد');
  const isParty = dispute.buyer._id.equals(req.user._id) || dispute.seller._id.equals(req.user._id);
  const isJudge = dispute.assignedTo?._id.equals(req.user._id);
  if (!isParty && !isJudge && !req.user.roles.includes('admin')) return response.forbidden(res);
  return response.success(res, { dispute });
});

exports.addResponse = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) return response.notFound(res, 'اختلاف یافت نشد');
  const isParty = dispute.buyer.equals(req.user._id) || dispute.seller.equals(req.user._id);
  if (!isParty) return response.forbidden(res);
  
  let evidence = [];
  if (req.files?.length) {
    for (const file of req.files) {
      const result = await fileUploadService.uploadDoc(file, `disputes/${dispute._id}`);
      evidence.push({ type: file.mimetype.startsWith('image/') ? 'image' : 'document', url: result.url, description: file.originalname });
    }
  }
  await dispute.addResponse(req.user._id, message, evidence);
  return response.success(res, { dispute }, 'پاسخ ثبت شد');
});

exports.uploadEvidence = asyncHandler(async (req, res) => {
  const { description } = req.body;
  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) return response.notFound(res, 'اختلاف یافت نشد');
  if (!req.file) return response.error(res, 'فایل الزامی است', 400);
  
  const result = await fileUploadService.uploadDoc(req.file, `disputes/${dispute._id}`);
  dispute.evidence.push({
    type: req.file.mimetype.startsWith('image/') ? 'image' : 'document',
    url: result.url, publicId: result.publicId, description,
    uploadedBy: req.user._id, uploadedAt: new Date()
  });
  await dispute.save();
  return response.success(res, { evidence: dispute.evidence }, 'مدرک آپلود شد');
});

// Judge actions
exports.assignJudge = asyncHandler(async (req, res) => {
  const { judgeId } = req.body;
  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) return response.notFound(res, 'اختلاف یافت نشد');
  await dispute.assignJudge(judgeId);
  return response.success(res, { dispute }, 'داور تخصیص یافت');
});

exports.issueVerdict = asyncHandler(async (req, res) => {
  const { decision, buyerShare, sellerShare, reason, details } = req.body;
  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) return response.notFound(res, 'اختلاف یافت نشد');
  if (!dispute.assignedTo?.equals(req.user._id) && !req.user.roles.includes('admin')) return response.forbidden(res);
  
  await dispute.issueVerdict(decision, buyerShare, sellerShare, reason, details, req.user._id);
  return response.success(res, { dispute }, 'رای صادر شد');
});

exports.executeVerdict = asyncHandler(async (req, res) => {
  const dispute = await Dispute.findById(req.params.id).populate('deal');
  if (!dispute || !dispute.verdict.decision) return response.error(res, 'رای صادر نشده', 400);
  
  const { buyerShare, sellerShare } = dispute.verdict;
  let result;
  if (buyerShare === 100) result = await escrowService.refund(dispute.deal._id, req.user._id, dispute.verdict.reason);
  else if (sellerShare === 100) result = await escrowService.release(dispute.deal._id, req.user._id);
  else result = await escrowService.split(dispute.deal._id, buyerShare, sellerShare, req.user._id, dispute.verdict.reason);
  
  await dispute.executeVerdict(result.buyerAmount || 0, result.sellerAmount || result.releasedAmount || 0, [], req.user._id);
  return response.success(res, { dispute, escrowResult: result }, 'رای اجرا شد');
});

exports.fileAppeal = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) return response.notFound(res, 'اختلاف یافت نشد');
  if (!dispute.buyer.equals(req.user._id) && !dispute.seller.equals(req.user._id)) return response.forbidden(res);
  await dispute.fileAppeal(req.user._id, reason);
  return response.success(res, { dispute }, 'درخواست تجدیدنظر ثبت شد');
});
