const mongoose = require('mongoose');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const response = require('../utils/responseFormatter');
const User = require('../models/User');
const userAnalysisService = require('../services/userAnalysisService');
const { presentUserAnalysis } = require('../utils/presenters/userAnalysisPresenter');

async function resolveUserId(identifier) {
  if (mongoose.Types.ObjectId.isValid(identifier)) return identifier;
  const user = await User.findOne({ publicSlug: String(identifier).toLowerCase() }).select('_id').lean();
  if (!user) throw new ValidationError('شناسه یا آدرس عمومی کاربر نامعتبر است');
  return user._id;
}

exports.getUserAnalysis = asyncHandler(async (req, res) => {
  const identifier = req.params.userId || req.params.identifier;
  const userId = await resolveUserId(identifier);
  const data = await userAnalysisService.getUserAnalysis(userId);
  return response.success(res, presentUserAnalysis(data), 'تحلیل کاربر دریافت شد');
});
