const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Plan Information
  plan: {
    type: String,
    enum: ['free', 'silver', 'gold', 'vip', 'producer'],
    required: true
  },
  planDetails: {
    duration: Number,
    sellPosts: Number,        // -1 for unlimited
    buyPosts: Number,         // -1 for unlimited
    accessToBuyPosts: Number, // -1 for unlimited
    maxOffersVisible: Number,
    maxChatsPerPost: Number,
    consultationOnlineIncludedMinutes: { type: Number, default: 0 },
    consultationInPersonEligible: { type: Boolean, default: false },
    badge: String,
    features: [String]
  },

  // Consultation quota is reserved first to avoid double-spending free hours.
  consultationQuota: {
    onlineIncludedMinutes: { type: Number, default: 0 },
    onlineReservedMinutes: { type: Number, default: 0 },
    onlineConsumedMinutes: { type: Number, default: 0 },
    onlineReleasedMinutes: { type: Number, default: 0 },
    inPersonEligible: { type: Boolean, default: false }
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending', 'failed'],
    default: 'pending'
  },
  startDate: Date,
  endDate: Date,
  autoRenew: {
    type: Boolean,
    default: false
  },
  
  // Payment
  payment: {
    amount: Number,
    currency: {
      type: String,
      enum: ['IRR', 'USD', 'EUR'],
      default: 'IRR'
    },
    transactionId: String,
    paidAt: Date,
    paymentMethod: {
      type: String,
      enum: ['wallet', 'zarinpal', 'free', 'bank_transfer']
    },
    authority: String,
    refId: String,
    gateway: String
  },
  
  // Usage Tracking
  usage: {
    sellPostsUsed: { type: Number, default: 0 },
    buyPostsUsed: { type: Number, default: 0 },
    accessToBuyPostsUsed: { type: Number, default: 0 },
    lastResetDate: Date
  },
  
  // Extra quotas purchased
  extras: [{
    type: {
      type: String,
      enum: ['sell_posts', 'buy_posts', 'access_posts']
    },
    amount: Number,
    purchasedAt: Date,
    transactionId: String
  }],
  
  // History
  previousPlans: [{
    plan: String,
    startDate: Date,
    endDate: Date,
    cancelledAt: Date
  }],
  
  // Notifications
  notificationsSent: {
    expiryWarning7Days: { type: Boolean, default: false },
    expiryWarning3Days: { type: Boolean, default: false },
    expiryWarning1Day: { type: Boolean, default: false },
    expired: { type: Boolean, default: false }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ plan: 1 });
subscriptionSchema.index({ user: 1, status: 1, endDate: -1 });

// Virtual for remaining days
subscriptionSchema.virtual('remainingDays').get(function() {
  if (!this.endDate) return 0;
  const diff = this.endDate - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Virtual for remaining online consultation minutes
subscriptionSchema.virtual('remainingOnlineConsultationMinutes').get(function() {
  const quota = this.consultationQuota || {};
  const included = quota.onlineIncludedMinutes || 0;
  const reserved = quota.onlineReservedMinutes || 0;
  const consumed = quota.onlineConsumedMinutes || 0;
  const released = quota.onlineReleasedMinutes || 0;
  return Math.max(0, included - reserved - consumed + released);
});

// Virtual for remaining whole online consultation hours
subscriptionSchema.virtual('remainingOnlineConsultationHours').get(function() {
  return Math.floor(this.remainingOnlineConsultationMinutes / 60);
});

// Virtual for remaining sell posts
subscriptionSchema.virtual('remainingSellPosts').get(function() {
  if (this.planDetails.sellPosts === -1) return -1; // unlimited
  const base = this.planDetails.sellPosts - this.usage.sellPostsUsed;
  const extras = this.extras
    .filter(e => e.type === 'sell_posts')
    .reduce((sum, e) => sum + e.amount, 0);
  return Math.max(0, base + extras);
});

// Virtual for remaining access to buy posts
subscriptionSchema.virtual('remainingAccessToBuyPosts').get(function() {
  if (this.planDetails.accessToBuyPosts === -1) return -1; // unlimited
  const base = this.planDetails.accessToBuyPosts - this.usage.accessToBuyPostsUsed;
  const extras = this.extras
    .filter(e => e.type === 'access_posts')
    .reduce((sum, e) => sum + e.amount, 0);
  return Math.max(0, base + extras);
});

// Check if subscription is active
subscriptionSchema.methods.isActive = function() {
  return this.status === 'active' && (!this.endDate || this.endDate > new Date());
};

subscriptionSchema.methods.isProducerPlan = function() {
  return this.plan === 'producer';
};

subscriptionSchema.statics.getActiveForUser = function(userId) {
  return this.findOne({
    user: userId,
    status: 'active',
    $or: [{ endDate: { $gt: new Date() } }, { endDate: null }]
  }).sort({ endDate: -1, createdAt: -1 });
};

subscriptionSchema.statics.hasActiveProducerSubscription = async function(userId) {
  const subscription = await this.findOne({
    user: userId,
    plan: 'producer',
    status: 'active',
    $or: [{ endDate: { $gt: new Date() } }, { endDate: null }]
  }).select('_id');

  return Boolean(subscription);
};

// Check if can create sell post
subscriptionSchema.methods.canCreateSellPost = function() {
  if (!this.isActive()) return false;
  if (this.planDetails.sellPosts === -1) return true;
  return this.remainingSellPosts > 0;
};

// Check if can access buy posts
subscriptionSchema.methods.canAccessBuyPosts = function() {
  if (!this.isActive()) return false;
  if (this.planDetails.accessToBuyPosts === -1) return true;
  return this.remainingAccessToBuyPosts > 0;
};

// Use a sell post quota
subscriptionSchema.methods.useSellPostQuota = async function() {
  if (!this.canCreateSellPost()) {
    throw new Error('سهمیه آگهی فروش شما به پایان رسیده است');
  }
  this.usage.sellPostsUsed += 1;
  await this.save();
};

// Use access to buy posts quota
subscriptionSchema.methods.useAccessToBuyPostsQuota = async function() {
  if (!this.canAccessBuyPosts()) {
    throw new Error('سهمیه دسترسی به آگهی خرید دیگران به پایان رسیده است');
  }
  this.usage.accessToBuyPostsUsed += 1;
  await this.save();
};

// Check if has feature
subscriptionSchema.methods.hasFeature = function(feature) {
  return this.planDetails.features && this.planDetails.features.includes(feature);
};

// Static method to create free subscription
subscriptionSchema.statics.createFreeSubscription = async function(userId) {
  const { SUBSCRIPTION_PLANS } = require('../config/constants');
  const plan = SUBSCRIPTION_PLANS.FREE;
  
  const subscription = new this({
    user: userId,
    plan: 'free',
    planDetails: {
      duration: plan.duration,
      sellPosts: plan.sellPosts,
      buyPosts: plan.buyPosts,
      accessToBuyPosts: plan.accessToBuyPosts,
      maxOffersVisible: plan.maxOffersVisible,
      maxChatsPerPost: plan.maxChatsPerPost,
      consultationOnlineIncludedMinutes: plan.consultationOnlineIncludedMinutes || 0,
      consultationInPersonEligible: Boolean(plan.consultationInPersonEligible),
      badge: plan.badge,
      features: plan.features
    },
    consultationQuota: {
      onlineIncludedMinutes: plan.consultationOnlineIncludedMinutes || 0,
      onlineReservedMinutes: 0,
      onlineConsumedMinutes: 0,
      onlineReleasedMinutes: 0,
      inPersonEligible: Boolean(plan.consultationInPersonEligible)
    },
    status: 'active',
    startDate: new Date(),
    endDate: plan.duration === 0 ? null : new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000),
    payment: {
      amount: 0,
      currency: 'IRR',
      paidAt: new Date(),
      paymentMethod: 'free'
    },
    usage: {
      lastResetDate: new Date()
    }
  });
  
  return subscription.save();
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
