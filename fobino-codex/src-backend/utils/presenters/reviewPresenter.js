function presentUser(user) {
  if (!user) return null;

  const source = user.toObject ? user.toObject({ virtuals: true }) : user;
  const publicProfile = source.publicProfile || {};

  return {
    id: source._id || source.id,
    publicSlug: source.publicSlug,
    fullName: source.fullName || [source.firstName, source.lastName].filter(Boolean).join(' '),
    businessName: publicProfile.businessName || source.companyInfo?.companyName,
    avatar: publicProfile.avatar?.url ? publicProfile.avatar : { url: source.profileImage },
    city: publicProfile.city || source.location?.city,
    province: publicProfile.province || source.location?.province
  };
}

function presentDeal(deal) {
  if (!deal) return null;

  return {
    id: deal._id || deal.id,
    dealNumber: deal.dealNumber,
    title: deal.title,
    status: deal.status,
    completedAt: deal.completedAt
  };
}

function presentReview(review) {
  if (!review) return null;

  const source = review.toObject ? review.toObject({ virtuals: true }) : review;

  return {
    id: source._id || source.id,
    buyer: source.buyer,
    seller: source.seller,
    reviewer: presentUser(source.reviewer),
    reviewee: presentUser(source.reviewee),
    reviewerRole: source.reviewerRole,
    revieweeRole: source.revieweeRole,
    text: source.text,
    rating: source.rating,
    deal: presentDeal(source.deal),
    shipment: source.shipment,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt
  };
}

function presentReviewList(reviews = []) {
  return reviews.map(presentReview);
}

function presentReviewSummary(summary = {}) {
  return {
    averageRating: summary.averageRating || 0,
    reviewsCount: summary.reviewsCount || 0,
    distribution: {
      5: summary.distribution?.[5] || summary.fiveStarsCount || 0,
      4: summary.distribution?.[4] || summary.fourStarsCount || 0,
      3: summary.distribution?.[3] || summary.threeStarsCount || 0,
      2: summary.distribution?.[2] || summary.twoStarsCount || 0,
      1: summary.distribution?.[1] || summary.oneStarCount || 0
    }
  };
}

function presentEligibility(eligibility = {}) {
  return {
    canReview: Boolean(eligibility.canReview),
    reason: eligibility.reason || null,
    alreadyReviewed: Boolean(eligibility.alreadyReviewed),
    reviewee: presentUser(eligibility.reviewee),
    reviewerRole: eligibility.reviewerRole || null,
    revieweeRole: eligibility.revieweeRole || null
  };
}

module.exports = {
  presentReview,
  presentReviewList,
  presentReviewSummary,
  presentEligibility
};
