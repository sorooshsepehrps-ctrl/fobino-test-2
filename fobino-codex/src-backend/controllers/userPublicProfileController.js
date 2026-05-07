const { asyncHandler } = require('../middleware/errorHandler');
const response = require('../utils/responseFormatter');
const userPublicProfileService = require('../services/userPublicProfileService');

exports.getPublicProfile = asyncHandler(async (req, res) => {
  const data = await userPublicProfileService.getPublicProfileByIdentifier(
    req.params.identifier,
    req.user?._id
  );
  return response.success(res, data, 'پروفایل عمومی کاربر دریافت شد');
});

exports.getBusinessCard = asyncHandler(async (req, res) => {
  const data = await userPublicProfileService.getBusinessCardPayload(req.params.identifier);
  return response.success(res, data, 'اطلاعات کارت ویزیت دریافت شد');
});
