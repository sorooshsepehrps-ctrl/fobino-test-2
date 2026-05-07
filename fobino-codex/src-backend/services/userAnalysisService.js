const mongoose = require('mongoose');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Deal = require('../models/Deal');
const responseTimeService = require('./responseTimeService');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { presentPublicUser } = require('../utils/presenters/publicUserPresenter');

const MAX_SCORE = 65;

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function normalizeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function makeCriterion({ key, title, maxScore, passed, description, actionHint, earnedDescription }) {
  return {
    key,
    title,
    score: passed ? maxScore : 0,
    maxScore,
    passed: Boolean(passed),
    description: passed && earnedDescription ? earnedDescription : description,
    actionHint: passed ? null : actionHint,
    percentage: passed ? 100 : 0,
  };
}

function resolveGrade(score) {
  const normalized = normalizeNumber(score);
  if (normalized >= 65) return 'A+';
  if (normalized >= 45) return 'A';
  if (normalized >= 30) return 'B';
  if (normalized >= 20) return 'C';
  return 'D';
}

function getGradeMeta(grade) {
  const meta = {
    'A+': {
      label: 'عالی',
      color: 'emerald',
      description: 'این کاربر بیشترین سطح اعتماد فعلی فوبینو را دارد.',
    },
    A: {
      label: 'قابل اعتماد',
      color: 'green',
      description: 'این کاربر از نظر شاخص‌های اصلی وضعیت بسیار خوبی دارد.',
    },
    B: {
      label: 'خوب',
      color: 'blue',
      description: 'این کاربر بخشی از شاخص‌های اعتماد را کامل کرده است.',
    },
    C: {
      label: 'نیازمند تکمیل',
      color: 'orange',
      description: 'برای اعتمادپذیری بهتر، چند شاخص مهم باید تکمیل شود.',
    },
    D: {
      label: 'ابتدایی',
      color: 'rose',
      description: 'اطلاعات کافی برای ارزیابی قوی این کاربر وجود ندارد.',
    },
  };
  return meta[grade] || meta.D;
}

function buildSuggestions(breakdown, totalScore = 0) {
  const suggestions = breakdown
    .filter((item) => !item.passed && item.actionHint)
    .map((item) => ({
      key: item.key,
      title: item.title,
      description: item.actionHint,
      potentialScore: item.maxScore,
    }))
    .sort((a, b) => b.potentialScore - a.potentialScore);

  const grade = resolveGrade(totalScore);
  if (grade !== 'A+' && suggestions.length) {
    const nextGrade = totalScore < 20 ? 'C' : totalScore < 30 ? 'B' : totalScore < 45 ? 'A' : 'A+';
    suggestions.unshift({
      key: 'next_grade',
      title: `رسیدن به Grade ${nextGrade}`,
      description: 'با تکمیل موارد پیشنهادی زیر، امتیاز اعتماد کاربر مرحله به مرحله افزایش پیدا می‌کند.',
      potentialScore: null,
    });
  }

  return suggestions;
}

async function getActiveSubscriptionForUser(userId) {
  if (!isValidObjectId(userId)) return null;
  if (typeof Subscription.getActiveForUser === 'function') {
    const query = Subscription.getActiveForUser(userId);
    return typeof query?.lean === 'function' ? query.lean() : query;
  }

  const now = new Date();
  return Subscription.findOne({
    user: userId,
    status: 'active',
    $or: [
      { endDate: { $gt: now } },
      { expiresAt: { $gt: now } },
      { validUntil: { $gt: now } },
    ],
  }).sort({ endDate: -1, expiresAt: -1, validUntil: -1 }).lean();
}

async function hasActiveProducerSubscription(userId) {
  if (!isValidObjectId(userId)) return false;
  if (typeof Subscription.hasActiveProducerSubscription === 'function') {
    return Subscription.hasActiveProducerSubscription(userId);
  }

  const now = new Date();
  const subscription = await Subscription.findOne({
    user: userId,
    status: 'active',
    $and: [
      { $or: [{ plan: 'producer' }, { planType: 'producer' }, { type: 'producer' }] },
      { $or: [{ endDate: { $gt: now } }, { expiresAt: { $gt: now } }, { validUntil: { $gt: now } }] },
    ],
  }).select('_id').lean();
  return Boolean(subscription);
}

function calculateProfileCompletionScore(user) {
  const percent = normalizeNumber(user?.profileCompletionPercent || user?.profileCompletion);
  const passed = percent >= 100;
  return makeCriterion({
    key: 'profile_completion',
    title: 'تکمیل پروفایل',
    maxScore: 5,
    passed,
    earnedDescription: 'پروفایل کاربر کامل است.',
    description: `درصد تکمیل پروفایل: ${Math.min(100, Math.max(0, percent))}٪`,
    actionHint: 'با تکمیل نام، تصویر، شهر، معرفی، اطلاعات کسب‌وکار و راه‌های ارتباطی عمومی، ۵ امتیاز دریافت می‌شود.',
  });
}

function calculateIdentityVerificationScore(user) {
  const passed = user?.identityVerificationStatus === 'verified' || normalizeNumber(user?.level) >= 1 || Boolean(user?.verifications?.identity);
  return makeCriterion({
    key: 'identity_verification',
    title: 'احراز هویت کاربری',
    maxScore: 5,
    passed,
    earnedDescription: 'احراز هویت کاربر تایید شده است.',
    description: 'احراز هویت کاربری هنوز تایید نشده است.',
    actionHint: 'با تکمیل و تایید احراز هویت، ۵ امتیاز اعتماد اضافه می‌شود.',
  });
}

async function calculateSubscriptionScore(userId) {
  const subscription = await getActiveSubscriptionForUser(userId);
  return {
    subscription,
    criterion: makeCriterion({
      key: 'active_subscription',
      title: 'اشتراک فعال',
      maxScore: 15,
      passed: Boolean(subscription),
      earnedDescription: `کاربر اشتراک فعال ${subscription?.plan || ''} دارد.`.trim(),
      description: 'اشتراک فعالی برای کاربر ثبت نشده است.',
      actionHint: 'با تهیه اشتراک فعال، ۱۵ امتیاز اعتماد دریافت می‌شود.',
    }),
  };
}

async function calculateResponseSpeedScore(userId) {
  const avgResponseMinutes = await responseTimeService.getAverageResponseTimeInMinutes(userId);
  const passed = avgResponseMinutes !== null && avgResponseMinutes < 120;
  return {
    avgResponseMinutes,
    criterion: makeCriterion({
      key: 'response_speed',
      title: 'سرعت پاسخگویی',
      maxScore: 10,
      passed,
      earnedDescription: `میانگین پاسخگویی حدود ${avgResponseMinutes} دقیقه است.`,
      description: avgResponseMinutes === null
        ? 'هنوز داده کافی برای محاسبه سرعت پاسخگویی وجود ندارد.'
        : `میانگین پاسخگویی حدود ${avgResponseMinutes} دقیقه است؛ حد مطلوب کمتر از ۱۲۰ دقیقه است.`,
      actionHint: 'پاسخگویی میانگین زیر ۲ ساعت باعث دریافت ۱۰ امتیاز می‌شود.',
    }),
  };
}

async function calculateCompletedDealsScore(userId) {
  const completedDealsCount = await Deal.countDocuments({
    $and: [
      { $or: [{ buyer: userId }, { seller: userId }] },
      { $or: [{ status: { $in: ['confirmed', 'completed'] } }, { completedAt: { $exists: true, $ne: null } }] },
    ],
  });

  return {
    completedDealsCount,
    criterion: makeCriterion({
      key: 'completed_deal',
      title: 'معامله موفق',
      maxScore: 10,
      passed: completedDealsCount > 0,
      earnedDescription: `${completedDealsCount} معامله موفق برای کاربر ثبت شده است.`,
      description: 'هنوز معامله موفقی برای کاربر ثبت نشده است.',
      actionHint: 'با تکمیل حداقل یک معامله، ۱۰ امتیاز اعتماد دریافت می‌شود.',
    }),
  };
}

async function calculateProducerVerificationScore(userId, user) {
  const producerSubscription = await hasActiveProducerSubscription(userId);
  const producerVerified = user?.producerVerificationStatus === 'verified' || Boolean(user?.providerVerifiedAt);
  return {
    producerSubscription,
    producerVerified,
    criterion: makeCriterion({
      key: 'producer_verification',
      title: 'اشتراک و احراز تولیدکنندگی',
      maxScore: 20,
      passed: producerSubscription && producerVerified,
      earnedDescription: 'اشتراک تولیدکننده و احراز تولیدکنندگی هر دو تایید شده‌اند.',
      description: producerSubscription
        ? 'اشتراک تولیدکننده فعال است، اما احراز تولیدکنندگی کامل نیست.'
        : 'اشتراک تولیدکننده فعال یا احراز تولیدکنندگی کامل نیست.',
      actionHint: 'با داشتن اشتراک تولیدکننده و تایید احراز تولیدکنندگی، ۲۰ امتیاز اعتماد دریافت می‌شود.',
    }),
  };
}

function buildCharts({ breakdown, totalScore, avgResponseMinutes, completedDealsCount }) {
  return {
    radial: {
      value: totalScore,
      max: MAX_SCORE,
      percentage: Math.round((totalScore / MAX_SCORE) * 100),
    },
    bars: breakdown.map((item) => ({
      key: item.key,
      title: item.title,
      value: item.score,
      max: item.maxScore,
      passed: item.passed,
    })),
    responseTime: {
      minutes: avgResponseMinutes,
      thresholdMinutes: 120,
      passed: avgResponseMinutes !== null && avgResponseMinutes < 120,
    },
    completedDeals: {
      count: completedDealsCount,
      required: 1,
    },
  };
}

async function getUserAnalysis(userId) {
  if (!isValidObjectId(userId)) throw new ValidationError('شناسه کاربر نامعتبر است');

  const user = await User.findById(userId).lean({ virtuals: true });
  if (!user) throw new NotFoundError('کاربر یافت نشد');

  const profileCriterion = calculateProfileCompletionScore(user);
  const identityCriterion = calculateIdentityVerificationScore(user);

  const [subscriptionResult, responseResult, completedDealsResult, producerResult] = await Promise.all([
    calculateSubscriptionScore(userId),
    calculateResponseSpeedScore(userId),
    calculateCompletedDealsScore(userId),
    calculateProducerVerificationScore(userId, user),
  ]);

  const breakdown = [
    profileCriterion,
    identityCriterion,
    subscriptionResult.criterion,
    responseResult.criterion,
    completedDealsResult.criterion,
    producerResult.criterion,
  ];

  const totalScore = breakdown.reduce((sum, item) => sum + item.score, 0);
  const grade = resolveGrade(totalScore);

  return {
    user: presentPublicUser(user),
    totalScore,
    maxScore: MAX_SCORE,
    grade,
    gradeLabel: `Grade ${grade}`,
    gradeMeta: getGradeMeta(grade),
    breakdown,
    charts: buildCharts({
      breakdown,
      totalScore,
      avgResponseMinutes: responseResult.avgResponseMinutes,
      completedDealsCount: completedDealsResult.completedDealsCount,
    }),
    facts: {
      hasActiveSubscription: Boolean(subscriptionResult.subscription),
      subscriptionPlan: subscriptionResult.subscription?.plan || null,
      averageResponseTimeMinutes: responseResult.avgResponseMinutes,
      completedDealsCount: completedDealsResult.completedDealsCount,
      producerSubscription: producerResult.producerSubscription,
      producerVerified: producerResult.producerVerified,
    },
    suggestions: buildSuggestions(breakdown, totalScore),
  };
}

module.exports = {
  MAX_SCORE,
  getUserAnalysis,
  calculateProfileCompletionScore,
  calculateIdentityVerificationScore,
  calculateSubscriptionScore,
  calculateResponseSpeedScore,
  calculateCompletedDealsScore,
  calculateProducerVerificationScore,
  resolveGrade,
  getGradeMeta,
  buildSuggestions,
  getActiveSubscriptionForUser,
  hasActiveProducerSubscription,
};
