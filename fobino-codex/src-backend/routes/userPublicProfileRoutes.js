const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const userPublicProfileController = require('../controllers/userPublicProfileController');
const userAnalysisController = require('../controllers/userAnalysisController');
const userReviewController = require('../controllers/userReviewController');
const { userReviewsValidator } = require('../validators/userReviewValidator');
const { publicIdentifierValidator, userIdValidator } = require('../validators/publicProfileValidator');
const { validate } = require('../middleware/validation');

router.get('/users/public/:identifier', publicIdentifierValidator, validate, optionalAuth, userPublicProfileController.getPublicProfile);
router.get('/users/public/:identifier/business-card', publicIdentifierValidator, validate, optionalAuth, userPublicProfileController.getBusinessCard);
router.get('/users/:userId/analysis', userIdValidator, validate, optionalAuth, userAnalysisController.getUserAnalysis);
router.get('/users/public/:identifier/analysis', publicIdentifierValidator, validate, optionalAuth, userAnalysisController.getUserAnalysis);
router.get('/users/:userId/reviews', userReviewsValidator, validate, userReviewController.getUserReviews);

module.exports = router;
