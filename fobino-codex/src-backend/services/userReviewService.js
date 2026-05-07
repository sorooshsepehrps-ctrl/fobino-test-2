/* backend/src/services/userReviewService.js */
const mongoose = require('mongoose');
const UserReview = require('../models/UserReview');
const Deal = require('../models/Deal');
const { AppError, NotFoundError, ForbiddenError, ConflictError, ValidationError } = require('../middleware/errorHandler');
const reviewStatsService = require('./reviewStatsService');

const COMPLETED_DEAL_STATUSES = ['confirmed', 'completed'];

/**
 * Safely compare two MongoDB IDs regardless of type (ObjectId, string, or populated object)
 */
function isSameId(a, b) {
  if (!a || !b) return false;
  
  try {
    // Handle populated objects
    const aId = a._id ? a._id : a;
    const bId = b._id ? b._id : b;
    
    // Convert both to strings for reliable comparison
    const aStr = aId.toString();
    const bStr = bId.toString();
    
    return aStr === bStr;
  } catch (error) {
    console.error('Error comparing IDs:', error, { a, b });
    return false;
  }
}

/**
 * Check if a deal is completed and can be reviewed
 */
function isCompletedDeal(deal) {
  if (!deal) return false;
  if (typeof deal.isReviewable === 'function') return deal.isReviewable();
  return COMPLETED_DEAL_STATUSES.includes(deal.status) || Boolean(deal.completedAt);
}

/**
 * Validate review input data
 */
function validateReviewInput({ dealId, reviewerId, rating, text }) {
  if (!mongoose.Types.ObjectId.isValid(dealId)) {
    throw new ValidationError('شناسه معامله نامعتبر است', [{ field: 'dealId', message: 'Invalid deal id' }]);
  }

  if (!mongoose.Types.ObjectId.isValid(reviewerId)) {
    throw new ValidationError('شناسه کاربر نامعتبر است', [{ field: 'reviewerId', message: 'Invalid reviewer id' }]);
  }

  if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
    throw new ValidationError('امتیاز باید عددی بین ۱ تا ۵ باشد', [{ field: 'rating', message: 'Rating must be between 1 and 5' }]);
  }

  if (!text || typeof text !== 'string' || text.trim().length < 3 || text.trim().length > 1000) {
    throw new ValidationError('متن نظر باید بین ۳ تا ۱۰۰۰ کاراکتر باشد', [{ field: 'text', message: 'Review text length is invalid' }]);
  }
}

/**
 * Get effective buyer and seller for a deal considering deal-specific roles
 * Priority: dealRoles (if exists) > main buyer/seller fields
 */
function getEffectiveBuyerSeller(deal) {
  // Case 1: Deal has explicit dealRoles (created without chat roles)
  if (deal.dealRoles && deal.dealRoles.explicitlySet === true) {
    return {
      buyer: deal.dealRoles.buyer,
      seller: deal.dealRoles.seller,
      usedDealRoles: true,
      source: 'explicit_deal_roles'
    };
  }
  
  // Case 2: Deal has dealRoles but not explicitly set (should still use them)
  if (deal.dealRoles && deal.dealRoles.buyer && deal.dealRoles.seller) {
    return {
      buyer: deal.dealRoles.buyer,
      seller: deal.dealRoles.seller,
      usedDealRoles: true,
      source: 'implicit_deal_roles'
    };
  }
  
  // Case 3: Fallback to main buyer/seller fields
  return {
    buyer: deal.buyer,
    seller: deal.seller,
    usedDealRoles: false,
    source: 'main_fields'
  };
}

/**
 * Resolve the roles for a review based on who is reviewing
 */
function resolveReviewRoles(deal, reviewerId) {
  const { buyer, seller, usedDealRoles, source } = getEffectiveBuyerSeller(deal);
  
  // Debug logging to help troubleshoot
  console.log('Resolving review roles:', {
    dealId: deal._id?.toString(),
    reviewerId: reviewerId?.toString(),
    buyerId: buyer?._id?.toString() || buyer?.toString(),
    sellerId: seller?._id?.toString() || seller?.toString(),
    usedDealRoles,
    source,
    dealStatus: deal.status,
    completedAt: deal.completedAt
  });
  
  // Check if reviewer is the effective buyer
  if (isSameId(buyer, reviewerId)) {
    return {
      reviewerRole: 'buyer',
      revieweeRole: 'seller',
      reviewee: seller,
      usedDealRoles
    };
  }

  // Check if reviewer is the effective seller
  if (isSameId(seller, reviewerId)) {
    return {
      reviewerRole: 'seller',
      revieweeRole: 'buyer',
      reviewee: buyer,
      usedDealRoles
    };
  }

  // User is not a participant in this deal
  throw new ForbiddenError('فقط خریدار یا فروشنده همین معامله می‌تواند نظر ثبت کند');
}

// async function ensureService (){
// 
// }
/**
 * Ensure that a user can review a deal
 * Returns the resolved roles if allowed, throws error otherwise
 */
async function ensureCanReview(deal, reviewerId) {
  if (!deal) {
    throw new NotFoundError('معامله یافت نشد');
  }

  if (!isCompletedDeal(deal)) {
    throw new AppError('ثبت نظر فقط پس از تکمیل معامله امکان‌پذیر است', 400, 'DEAL_NOT_COMPLETED');
  }

  try {
    const roles = resolveReviewRoles(deal, reviewerId);
    
    // Check if user already reviewed this deal
    const existingReview = await UserReview.findOne({
      deal: deal._id,
      reviewer: reviewerId
    }).select('_id');

    if (existingReview) {
      throw new ConflictError('شما قبلاً برای این معامله نظر ثبت کرده‌اید');
    }
    
    return roles;
  } catch (error) {
    // Add more context for debugging if it's a ForbiddenError
    if (error instanceof ForbiddenError) {
      const effectiveRoles = getEffectiveBuyerSeller(deal);
      console.error('Review eligibility check failed:', {
        error: error.message,
        reviewerId: reviewerId?.toString(),
        effectiveBuyerId: effectiveRoles.buyer?._id?.toString() || effectiveRoles.buyer?.toString(),
        effectiveSellerId: effectiveRoles.seller?._id?.toString() || effectiveRoles.seller?.toString(),
        usedDealRoles: effectiveRoles.usedDealRoles,
        source: effectiveRoles.source,
        dealStatus: deal.status,
        dealCompletedAt: deal.completedAt,
        dealId: deal._id?.toString()
      });
    }
    throw error;
  }
}

/**
 * Create a new review for a deal
 */
async function createReview({ dealId, reviewerId, rating, text }) {
  validateReviewInput({ dealId, reviewerId, rating, text });

  const deal = await Deal.findById(dealId)
    .populate('buyer')
    .populate('seller')
    .populate('dealRoles.buyer')
    .populate('dealRoles.seller');
    
  const roles = await ensureCanReview(deal, reviewerId);
  const { buyer, seller } = getEffectiveBuyerSeller(deal);

  const review = await UserReview.create({
    buyer: buyer,
    seller: seller,
    reviewer: reviewerId,
    reviewee: roles.reviewee,
    reviewerRole: roles.reviewerRole,
    revieweeRole: roles.revieweeRole,
    text: text.trim(),
    rating: Number(rating),
    deal: deal._id,
    shipment: deal.shipping || null
  });

  // Recalculate stats for the reviewee
  await reviewStatsService.recalculateUserReviewStats(roles.reviewee);

  // Return populated review
  return UserReview.findById(review._id)
    .populate('reviewer', 'firstName lastName profileImage publicSlug publicProfile')
    .populate('reviewee', 'firstName lastName profileImage publicSlug publicProfile')
    .populate('deal', 'dealNumber title status completedAt');
}

/**
 * Get all reviews for a specific user
 */
async function getUserReviews({ userId, page = 1, limit = 10, rating }) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ValidationError('شناسه کاربر نامعتبر است', [{ field: 'userId', message: 'Invalid user id' }]);
  }

  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
  
  const query = {
    reviewee: userId,
    isVisible: true
  };

  if (rating) {
    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      throw new ValidationError('فیلتر امتیاز نامعتبر است', [{ field: 'rating', message: 'Rating filter must be between 1 and 5' }]);
    }
    query.rating = parsedRating;
  }

  const [total, reviews] = await Promise.all([
    UserReview.countDocuments(query),
    UserReview.find(query)
      .sort({ createdAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit)
      .populate('reviewer', 'firstName lastName profileImage publicSlug publicProfile')
      .populate('deal', 'dealNumber title status completedAt')
      .lean()
  ]);

  return {
    reviews,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.ceil(total / parsedLimit),
      hasNext: parsedPage < Math.ceil(total / parsedLimit),
      hasPrev: parsedPage > 1
    }
  };
}

/**
 * Get review summary/stats for a user
 */
async function getReviewSummary(userId) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ValidationError('شناسه کاربر نامعتبر است', [{ field: 'userId', message: 'Invalid user id' }]);
  }

  const stats = await reviewStatsService.getUserReviewStats(userId);

  return {
    averageRating: stats.averageRating,
    reviewsCount: stats.reviewsCount,
    distribution: {
      5: stats.fiveStarsCount,
      4: stats.fourStarsCount,
      3: stats.threeStarsCount,
      2: stats.twoStarsCount,
      1: stats.oneStarCount
    }
  };
}

/**
 * Check if a user is eligible to review a specific deal
 * Returns detailed eligibility information
 */
async function getDealReviewEligibility({ dealId, userId }) {
  if (!mongoose.Types.ObjectId.isValid(dealId)) {
    throw new ValidationError('شناسه معامله نامعتبر است', [{ field: 'dealId', message: 'Invalid deal id' }]);
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ValidationError('شناسه کاربر نامعتبر است', [{ field: 'userId', message: 'Invalid user id' }]);
  }

  const deal = await Deal.findById(dealId)
    .populate('buyer', 'firstName lastName profileImage publicSlug publicProfile')
    .populate('seller', 'firstName lastName profileImage publicSlug publicProfile')
    .populate('dealRoles.buyer', 'firstName lastName profileImage publicSlug publicProfile')
    .populate('dealRoles.seller', 'firstName lastName profileImage publicSlug publicProfile')
    .lean();

  if (!deal) {
    throw new NotFoundError('معامله یافت نشد');
  }

  // Prepare debug info
  const { buyer, seller, usedDealRoles, source } = getEffectiveBuyerSeller(deal);
  const buyerId = buyer?._id?.toString() || buyer?.toString();
  const sellerId = seller?._id?.toString() || seller?.toString();
  const reviewerId = userId?.toString();

  // Check if user is a participant
  let roles = null;
  let isParticipant = false;
  
  try {
    roles = resolveReviewRoles(deal, userId);
    isParticipant = true;
  } catch (error) {
    // User is not a participant
    isParticipant = false;
  }

  // Check if already reviewed
  const existingReview = await UserReview.findOne({
    deal: deal._id,
    reviewer: userId
  }).select('_id').lean();

  const alreadyReviewed = Boolean(existingReview);
  const isCompleted = isCompletedDeal(deal);

  // Build eligibility response
  const eligibility = {
    canReview: false,
    alreadyReviewed,
    reason: null,
    reviewee: null,
    reviewerRole: null,
    revieweeRole: null,
    // Debug info (optional, can be removed in production)
    _debug: {
      userId: reviewerId,
      buyerId,
      sellerId,
      usedDealRoles,
      roleSource: source,
      dealStatus: deal.status,
      dealCompletedAt: deal.completedAt,
      hasDealRoles: !!(deal.dealRoles && deal.dealRoles.explicitlySet),
      isParticipant
    }
  };

  // Determine eligibility
  if (!isCompleted) {
    eligibility.reason = 'deal_not_completed';
    eligibility.canReview = false;
  } else if (alreadyReviewed) {
    eligibility.reason = 'already_reviewed';
    eligibility.canReview = false;
  } else if (!isParticipant) {
    eligibility.reason = 'not_deal_participant';
    eligibility.canReview = false;
  } else {
    eligibility.canReview = true;
    eligibility.reason = null;
    eligibility.reviewee = roles.reviewee;
    eligibility.reviewerRole = roles.reviewerRole;
    eligibility.revieweeRole = roles.revieweeRole;
  }

  // Remove debug info for production (keep if you want for troubleshooting)
  // delete eligibility._debug;

  return eligibility;
}

module.exports = {
  createReview,
  getUserReviews,
  getReviewSummary,
  getDealReviewEligibility,
  resolveReviewRoles,
  ensureCanReview,
  // Export helpers for testing/debugging
  _helpers: {
    isSameId,
    isCompletedDeal,
    getEffectiveBuyerSeller
  }
};