const { asyncHandler } = require('../middleware/errorHandler');
const response = require('../utils/responseFormatter');
const userReviewService = require('../services/userReviewService');
const reviewPresenter = require('../utils/presenters/reviewPresenter');

exports.createReview = asyncHandler(async (req, res) => {
  const review = await userReviewService.createReview({
    dealId: req.body.dealId,
    reviewerId: req.user._id,
    rating: req.body.rating,
    text: req.body.text
  });

  return response.created(
    res,
    { review: reviewPresenter.presentReview(review) },
    'نظر با موفقیت ثبت شد'
  );
});

exports.getUserReviews = asyncHandler(async (req, res) => {
  const { reviews, pagination } = await userReviewService.getUserReviews({
    userId: req.params.userId,
    page: req.query.page,
    limit: req.query.limit,
    rating: req.query.rating
  });

  return response.paginated(
    res,
    reviewPresenter.presentReviewList(reviews),
    pagination,
    'نظرهای کاربر دریافت شد'
  );
});

exports.getDealReviewEligibility = asyncHandler(async (req, res) => {
  const eligibility = await userReviewService.getDealReviewEligibility({
    dealId: req.params.dealId,
    userId: req.user._id
  });

  return response.success(
    res,
    reviewPresenter.presentEligibility(eligibility),
    'وضعیت امکان ثبت نظر دریافت شد'
  );
});
