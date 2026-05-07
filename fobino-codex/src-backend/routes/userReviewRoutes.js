const express = require('express');
const router = express.Router();
const userReviewController = require('../controllers/userReviewController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const {
  createReviewValidator,
  userReviewsValidator,
  dealReviewEligibilityValidator
} = require('../validators/userReviewValidator');

router.post('/reviews', protect, createReviewValidator, validate, userReviewController.createReview);
router.get('/users/:userId/reviews', userReviewsValidator, validate, userReviewController.getUserReviews);
router.get(
  '/deals/:dealId/review-eligibility',
  protect,
  dealReviewEligibilityValidator,
  validate,
  userReviewController.getDealReviewEligibility
);

module.exports = router;
