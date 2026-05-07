const mongoose = require('mongoose');
const User = require('../models/User');
const userReviewService = require('./userReviewService');
const userAnalysisService = require('./userAnalysisService');
const qrCodeService = require('./qrCodeService');
const { NotFoundError } = require('../middleware/errorHandler');
const { presentPublicUser, presentPublicSubscription, fullName, avatarOf } = require('../utils/presenters/publicUserPresenter');
const reviewPresenter = require('../utils/presenters/reviewPresenter');

function buildPublicProfileUrl(user) {
  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
  const identifier = user.publicSlug || user._id || user.id;
  return `${frontendUrl.replace(/\/$/, '')}/users/${identifier}`;
}

async function findUserByIdentifier(identifier) {
  const query = mongoose.Types.ObjectId.isValid(identifier)
    ? { $or: [{ _id: identifier }, { publicSlug: identifier }] }
    : { publicSlug: String(identifier).toLowerCase() };

  const user = await User.findOne(query).select('-password -refreshToken -phoneVerification').lean({ virtuals: true });
  if (!user || user.publicProfile?.isPublic === false) throw new NotFoundError('پروفایل عمومی کاربر یافت نشد');
  return user;
}

async function getPublicProfileByIdentifier(identifier, viewerUserId = null) {
  const user = await findUserByIdentifier(identifier);
  const publicProfileUrl = buildPublicProfileUrl(user);
  const [subscription, reviewSummary, reviewsPayload, analysis] = await Promise.all([
    userAnalysisService.getActiveSubscriptionForUser(user._id),
    userReviewService.getReviewSummary(user._id),
    userReviewService.getUserReviews({ userId: user._id, page: 1, limit: 6 }),
    userAnalysisService.getUserAnalysis(user._id)
  ]);

  const qrCodeDataUrl = await qrCodeService.generateQrDataUrl(publicProfileUrl);
  return {
    user: presentPublicUser(user),
    subscription: presentPublicSubscription(subscription),
    reviewSummary,
    recentReviews: reviewPresenter.presentReviewList(reviewsPayload.reviews),
    analysisSummary: { totalScore: analysis.totalScore, maxScore: analysis.maxScore, grade: analysis.grade },
    publicProfileUrl,
    qrCodeDataUrl,
    viewer: { isSelf: viewerUserId ? viewerUserId.toString() === user._id.toString() : false }
  };
}

async function getBusinessCardPayload(identifier) {
  const user = await findUserByIdentifier(identifier);
  const publicProfileUrl = buildPublicProfileUrl(user);
  const [subscription, analysis] = await Promise.all([
    userAnalysisService.getActiveSubscriptionForUser(user._id),
    userAnalysisService.getUserAnalysis(user._id)
  ]);
  const qrCodeDataUrl = await qrCodeService.generateQrDataUrl(publicProfileUrl);
  return {
    fullName: fullName(user),
    businessName: user.publicProfile?.businessName || user.companyInfo?.companyName || null,
    avatar: avatarOf(user),
    grade: analysis.grade,
    averageRating: user.reviewStats?.averageRating || 0,
    reviewsCount: user.reviewStats?.reviewsCount || 0,
    subscription: presentPublicSubscription(subscription),
    publicProfileUrl,
    qrCodeDataUrl
  };
}

module.exports = { getPublicProfileByIdentifier, getBusinessCardPayload, buildPublicProfileUrl };
