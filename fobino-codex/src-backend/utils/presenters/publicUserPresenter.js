function fullName(user = {}) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.publicProfile?.businessName || user.companyInfo?.companyName || 'کاربر فوبینو';
}

function avatarOf(user = {}) {
  const avatar = user.publicProfile?.avatar?.url || user.profileImage || null;
  return typeof avatar === 'string' && avatar.trim() ? avatar : null;
}

function cleanString(value, max = 500) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function safeWebsite(value) {
  const website = cleanString(value, 300);
  if (!website) return null;
  if (/^https?:\/\//i.test(website)) return website;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(website)) return `https://${website}`;
  return null;
}

function safeSocialLinks(links = {}) {
  if (!links || typeof links !== 'object' || Array.isArray(links)) return {};
  const allowedKeys = ['instagram', 'linkedin', 'telegram', 'website', 'x', 'twitter'];
  return allowedKeys.reduce((acc, key) => {
    const value = cleanString(links[key], 300);
    if (!value) return acc;
    acc[key] = key === 'website' ? safeWebsite(value) : value;
    return acc;
  }, {});
}

function presentPublicUser(user) {
  if (!user) return null;
  const reviewStats = user.reviewStats || {};
  return {
    id: String(user._id || user.id),
    publicSlug: user.publicSlug || null,
    fullName: fullName(user),
    businessName: cleanString(user.publicProfile?.businessName || user.companyInfo?.companyName, 120),
    avatar: avatarOf(user),
    bio: cleanString(user.publicProfile?.bio || user.about, 1000),
    city: cleanString(user.publicProfile?.city, 80),
    province: cleanString(user.publicProfile?.province, 80),
    website: safeWebsite(user.publicProfile?.website || user.website),
    socialLinks: safeSocialLinks(user.publicProfile?.socialLinks),
    isIdentityVerified: user.identityVerificationStatus === 'verified' || Number(user.level || 0) >= 2,
    isProducerVerified: user.producerVerificationStatus === 'verified',
    profileCompletionPercent: Math.max(0, Math.min(100, Number(user.profileCompletionPercent || 0))),
    reviewStats: {
      averageRating: Number(reviewStats.averageRating || 0),
      reviewsCount: Number(reviewStats.reviewsCount || 0),
      fiveStarsCount: Number(reviewStats.fiveStarsCount || 0),
      fourStarsCount: Number(reviewStats.fourStarsCount || 0),
      threeStarsCount: Number(reviewStats.threeStarsCount || 0),
      twoStarsCount: Number(reviewStats.twoStarsCount || 0),
      oneStarCount: Number(reviewStats.oneStarCount || 0),
    },
    createdAt: user.createdAt || null
  };
}

function presentPublicSubscription(subscription) {
  if (!subscription) {
    return { hasActiveSubscription: false, planName: null, planType: null, expiresAt: null, remainingDays: 0 };
  }
  const expiresAt = subscription.expiresAt || subscription.endDate || subscription.validUntil || null;
  return {
    hasActiveSubscription: true,
    planName: subscription.planName || subscription.plan || subscription.planType || 'active',
    planType: subscription.planType || subscription.plan || null,
    expiresAt,
    remainingDays: subscription.remainingDays || (expiresAt ? Math.max(0, Math.ceil((new Date(expiresAt) - new Date()) / 86400000)) : null)
  };
}

function presentPublicProfile(user, extra = {}) {
  return { user: presentPublicUser(user), ...extra };
}

module.exports = { presentPublicUser, presentPublicProfile, presentPublicSubscription, fullName, avatarOf, safeWebsite, safeSocialLinks };
