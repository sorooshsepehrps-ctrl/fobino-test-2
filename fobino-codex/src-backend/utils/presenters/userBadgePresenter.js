const Subscription = require('../../models/Subscription');
const Producer = require('../../models/Producer');
const ProducerVerification = require('../../models/ProducerVerification');

const ACTIVE_PAID_PLANS = ['vip', 'producer'];
const PRODUCER_BADGE_LEVELS = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 3,
};

function normalizeUserId(userOrId) {
  if (!userOrId) return null;
  const id = userOrId._id || userOrId.id || userOrId;
  return id ? String(id) : null;
}

function emptyBadges() {
  return {
    vip: {
      active: false,
      label: 'VIP',
      expiresAt: null,
    },
    producer: {
      active: false,
      verificationLevel: 0,
      stars: [false, false, false],
      label: 'تولیدکننده',
      status: 'not_started',
      expiresAt: null,
    },
  };
}

function isActiveSubscription(subscription) {
  if (!subscription || subscription.status !== 'active') return false;
  if (!ACTIVE_PAID_PLANS.includes(subscription.plan)) return false;
  return !subscription.endDate || new Date(subscription.endDate) > new Date();
}

function mapProducerLevel(producer, user = {}, producerVerification = null) {
  if (producerVerification?.publicLevel) return Math.max(0, Math.min(3, Number(producerVerification.publicLevel)));
  if (!producer && user.producerVerificationStatus !== 'verified') return 0;
  if (producer?.verificationLevel) return Math.max(0, Math.min(3, Number(producer.verificationLevel)));
  if (producer?.publicLevel) return Math.max(0, Math.min(3, Number(producer.publicLevel)));
  if (producer?.isVerified) return PRODUCER_BADGE_LEVELS[producer.badge] || 1;
  if (user.producerVerificationStatus === 'verified') return 1;
  return 0;
}

function mapProducerStatus(level, producer, user = {}, producerVerification = null) {
  if (producerVerification?.overallStatus === 'pending_review') return 'pending';
  if (level > 0) return 'approved';
  if (producer?.status === 'pending' || user.producerVerificationStatus === 'pending') return 'pending';
  if (producer?.status === 'suspended') return 'suspended';
  if (user.producerVerificationStatus === 'rejected') return 'rejected';
  return 'not_started';
}

function buildProducerLabel(level, active) {
  if (!active) return 'تولیدکننده';
  if (level <= 0) return 'تولیدکننده در انتظار احراز';
  return `تولیدکننده سطح ${level}`;
}

function buildBadges({ user, subscription, producer, producerVerification }) {
  const badges = emptyBadges();
  const activeSubscription = isActiveSubscription(subscription) ? subscription : null;

  if (activeSubscription?.plan === 'vip') {
    badges.vip = {
      active: true,
      label: 'VIP',
      expiresAt: activeSubscription.endDate || null,
    };
  }

  if (activeSubscription?.plan === 'producer') {
    const level = mapProducerLevel(producer, user, producerVerification);
    badges.producer = {
      active: true,
      verificationLevel: level,
      stars: [0, 1, 2].map((index) => index < level),
      label: buildProducerLabel(level, true),
      status: mapProducerStatus(level, producer, user, producerVerification),
      expiresAt: activeSubscription.endDate || null,
    };
  }

  return badges;
}

async function buildBadgesForUsers(usersOrIds = []) {
  const usersById = new Map();
  const ids = [];

  for (const item of usersOrIds) {
    const id = normalizeUserId(item);
    if (!id || usersById.has(id)) continue;
    usersById.set(id, typeof item === 'object' ? item : {});
    ids.push(id);
  }

  if (!ids.length) return {};

  const now = new Date();
  const [subscriptions, producers, producerVerifications] = await Promise.all([
    Subscription.find({
      user: { $in: ids },
      plan: { $in: ACTIVE_PAID_PLANS },
      status: 'active',
      $or: [{ endDate: { $gt: now } }, { endDate: null }],
    }).sort({ endDate: -1 }).lean(),
    Producer.find({ user: { $in: ids } })
      .select('user isVerified status badge verificationLevel publicLevel')
      .lean(),
    ProducerVerification.find({ user: { $in: ids } })
      .select('user publicLevel overallStatus levels.level1.status levels.level2.status levels.level3.status')
      .lean(),
  ]);

  const subscriptionsByUser = new Map();
  for (const subscription of subscriptions) {
    const userId = String(subscription.user);
    if (!subscriptionsByUser.has(userId)) subscriptionsByUser.set(userId, subscription);
  }

  const producersByUser = new Map();
  for (const producer of producers) {
    producersByUser.set(String(producer.user), producer);
  }

  const producerVerificationsByUser = new Map();
  for (const verification of producerVerifications) {
    producerVerificationsByUser.set(String(verification.user), verification);
  }

  return ids.reduce((acc, id) => {
    acc[id] = buildBadges({
      user: usersById.get(id),
      subscription: subscriptionsByUser.get(id),
      producer: producersByUser.get(id),
      producerVerification: producerVerificationsByUser.get(id),
    });
    return acc;
  }, {});
}

async function buildBadgesForUser(userOrId) {
  const id = normalizeUserId(userOrId);
  if (!id) return emptyBadges();
  const badgesByUser = await buildBadgesForUsers([userOrId]);
  return badgesByUser[id] || emptyBadges();
}

function attachBadgesToUser(user, badgesByUser = {}) {
  if (!user) return user;
  const id = normalizeUserId(user);
  return {
    ...user,
    badges: badgesByUser[id] || user.badges || emptyBadges(),
  };
}

module.exports = {
  buildBadgesForUser,
  buildBadgesForUsers,
  attachBadgesToUser,
  emptyBadges,
};
