const ProducerVerification = require('../models/ProducerVerification');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const fileUploadService = require('./fileUploadService');

const LEVEL_MAP = { 1: 'level1', 2: 'level2', 3: 'level3' };

function normalizeAddress(address = {}) {
  return {
    province: address.province || '',
    city: address.city || '',
    street: address.street || address.address || '',
    postalCode: address.postalCode || '',
    coordinates: address.coordinates || {},
  };
}

function normalizeProduction(payload = {}) {
  return {
    name: payload.name || payload.productionName || '',
    phone: payload.phone || payload.productionPhone || '',
    description: payload.description || '',
    address: normalizeAddress(payload.address || payload),
  };
}

async function findActiveProducerSubscription(userId) {
  return Subscription.findOne({
    user: userId,
    plan: 'producer',
    status: 'active',
    $or: [{ endDate: { $gt: new Date() } }, { endDate: null }],
  }).sort({ endDate: -1 });
}

async function getOrCreateVerification(userId) {
  let verification = await ProducerVerification.findOne({ user: userId });
  if (!verification) {
    const activeSubscription = await findActiveProducerSubscription(userId);
    verification = await ProducerVerification.create({
      user: userId,
      activeSubscription: activeSubscription?._id || null,
    });
  }
  return verification;
}

function assertProducerSubscriptionForSubmit(verification) {
  if (!verification.activeSubscription) {
    const error = new Error('برای ارسال احراز تولیدکننده، ابتدا اشتراک تولیدکننده را تهیه کنید');
    error.statusCode = 403;
    throw error;
  }
}

async function refreshSubscription(verification) {
  const activeSubscription = await findActiveProducerSubscription(verification.user);
  verification.activeSubscription = activeSubscription?._id || null;
  return verification;
}

function validateLevel1(verification) {
  const production = verification.production || {};
  const address = production.address || {};
  if (!production.name || !address.province || !address.city || !address.street || !production.phone) {
    throw new Error('نام تولیدی، استان، شهر، آدرس کامل و شماره تماس برای سطح ۱ الزامی است');
  }
  if ((verification.levels?.level1?.photos || []).length < 3) {
    throw new Error('برای سطح ۱ حداقل ۳ عکس تولیدی لازم است');
  }
}

function validateLevel2(verification) {
  if (verification.levels.level1.status !== 'approved') throw new Error('سطح ۲ فقط پس از تایید سطح ۱ فعال می‌شود');
  if ((verification.levels?.level2?.documents || []).length < 1) throw new Error('برای سطح ۲ حداقل یک مدرک تولیدی لازم است');
}

function validateLevel3(verification) {
  if (verification.levels.level1.status !== 'approved' || verification.levels.level2.status !== 'approved') {
    throw new Error('درخواست بازدید حضوری فقط پس از تایید سطح ۱ و ۲ امکان‌پذیر است');
  }
}

async function updateUserProducerStatus(verification) {
  await User.findByIdAndUpdate(verification.user, {
    producerVerificationStatus: verification.publicLevel > 0 ? 'verified' : verification.overallStatus === 'pending_review' ? 'pending' : 'none',
  });
}

class ProducerVerificationService {
  async getMine(userId) {
    const verification = await getOrCreateVerification(userId);
    await refreshSubscription(verification);
    await verification.save();
    return verification.populate('activeSubscription', 'plan status endDate');
  }

  async saveLevel1Draft(userId, payload) {
    const verification = await getOrCreateVerification(userId);
    await refreshSubscription(verification);
    verification.production = { ...(verification.production || {}), ...normalizeProduction(payload.production || payload) };
    if (verification.levels.level1.status === 'not_started') verification.levels.level1.status = 'draft';
    verification.recalculatePublicLevel();
    await verification.save();
    return verification;
  }

  async uploadLevel1Photos(userId, files = []) {
    const verification = await getOrCreateVerification(userId);
    const uploaded = [];
    for (const file of files) {
      const result = await fileUploadService.uploadFile(file, `fobino/producer-verifications/${userId}/level1`, 'auto');
      uploaded.push({ url: result.url, publicId: result.publicId, mimeType: file.mimetype, caption: file.originalname });
    }
    verification.levels.level1.photos.push(...uploaded);
    if (verification.levels.level1.status === 'not_started') verification.levels.level1.status = 'draft';
    await verification.save();
    return verification;
  }

  async submitLevel1(userId) {
    const verification = await getOrCreateVerification(userId);
    await refreshSubscription(verification);
    assertProducerSubscriptionForSubmit(verification);
    validateLevel1(verification);
    verification.levels.level1.status = verification.publicLevel >= 1 ? 'revision_pending' : 'pending';
    verification.levels.level1.submittedAt = new Date();
    verification.overallStatus = 'pending_review';
    await verification.save();
    await updateUserProducerStatus(verification);
    return verification;
  }

  async uploadLevel2Documents(userId, files = []) {
    const verification = await getOrCreateVerification(userId);
    if (verification.levels.level1.status !== 'approved') throw new Error('سطح ۲ فقط پس از تایید سطح ۱ فعال می‌شود');
    const uploaded = [];
    for (const file of files) {
      const result = await fileUploadService.uploadFile(file, `fobino/producer-verifications/${userId}/level2`, 'auto', { access_mode: 'authenticated' });
      uploaded.push({ url: result.url, publicId: result.publicId, mimeType: file.mimetype, title: file.originalname, type: file.fieldname });
    }
    verification.levels.level2.documents.push(...uploaded);
    if (verification.levels.level2.status === 'not_started' || verification.levels.level2.status === 'locked') verification.levels.level2.status = 'draft';
    await verification.save();
    return verification;
  }

  async submitLevel2(userId) {
    const verification = await getOrCreateVerification(userId);
    await refreshSubscription(verification);
    assertProducerSubscriptionForSubmit(verification);
    validateLevel2(verification);
    verification.levels.level2.status = verification.publicLevel >= 2 ? 'revision_pending' : 'pending';
    verification.levels.level2.submittedAt = new Date();
    verification.overallStatus = 'pending_review';
    await verification.save();
    await updateUserProducerStatus(verification);
    return verification;
  }

  async requestLevel3Visit(userId, payload) {
    const verification = await getOrCreateVerification(userId);
    await refreshSubscription(verification);
    assertProducerSubscriptionForSubmit(verification);
    validateLevel3(verification);
    verification.levels.level3.status = 'pending';
    verification.levels.level3.submittedAt = new Date();
    verification.levels.level3.visitRequest = {
      productionName: payload.productionName || verification.production?.name,
      address: normalizeAddress(payload.address || verification.production?.address || {}),
      coordinatorName: payload.coordinatorName || '',
      coordinatorPhone: payload.coordinatorPhone || '',
      preferredDates: (payload.preferredDates || []).map((date) => new Date(date)).filter((date) => !Number.isNaN(date.getTime())),
      workingHours: payload.workingHours || '',
      notes: payload.notes || '',
    };
    verification.overallStatus = 'pending_review';
    await verification.save();
    await updateUserProducerStatus(verification);
    return verification;
  }

  async listForAdmin(query = {}) {
    const filter = {};
    if (query.status) filter.overallStatus = query.status;
    if (query.level) filter.publicLevel = Number(query.level);
    return ProducerVerification.find(filter)
      .sort({ updatedAt: -1 })
      .limit(Math.min(Number(query.limit) || 50, 100))
      .populate('user', 'firstName lastName phone profileImage producerVerificationStatus')
      .populate('activeSubscription', 'plan status endDate')
      .lean();
  }

  async getForAdmin(id) {
    return ProducerVerification.findById(id)
      .populate('user', 'firstName lastName phone email profileImage producerVerificationStatus')
      .populate('activeSubscription', 'plan status endDate');
  }

  async reviewLevel({ id, level, action, adminId, reason, scheduledAt, adminVisitNotes }) {
    const verification = await ProducerVerification.findById(id);
    if (!verification) throw new Error('درخواست احراز یافت نشد');
    const key = LEVEL_MAP[level];
    if (!key) throw new Error('سطح احراز نامعتبر است');
    const target = verification.levels[key];

    if (action === 'approve') {
      target.status = 'approved';
      target.reviewedAt = new Date();
      target.reviewedBy = adminId;
      target.rejectionReason = '';
      if (level === 1 && verification.levels.level2.status === 'locked') verification.levels.level2.status = 'not_started';
      if (level === 2 && verification.levels.level3.status === 'locked') verification.levels.level3.status = 'not_started';
    } else if (action === 'reject') {
      target.status = 'rejected';
      target.reviewedAt = new Date();
      target.reviewedBy = adminId;
      target.rejectionReason = reason || 'رد شده توسط ادمین';
    } else if (action === 'request_resubmit') {
      target.status = 'requires_resubmit';
      target.reviewedAt = new Date();
      target.reviewedBy = adminId;
      target.resubmitReason = reason || 'نیازمند اصلاح اطلاعات';
    } else if (action === 'schedule' && level === 3) {
      target.status = 'scheduled';
      target.scheduledAt = scheduledAt ? new Date(scheduledAt) : new Date();
      target.reviewedBy = adminId;
    } else if (action === 'mark_visited' && level === 3) {
      target.status = 'visited';
      target.visitedAt = new Date();
      target.adminVisitNotes = adminVisitNotes || '';
      target.reviewedBy = adminId;
    } else {
      throw new Error('عملیات بررسی نامعتبر است');
    }

    verification.recalculatePublicLevel();
    await verification.save();
    await updateUserProducerStatus(verification);
    return verification;
  }

  async addAdminNote(id, adminId, note) {
    const verification = await ProducerVerification.findById(id);
    if (!verification) throw new Error('درخواست احراز یافت نشد');
    verification.adminNotes.push({ note, addedBy: adminId });
    await verification.save();
    return verification;
  }
}

module.exports = new ProducerVerificationService();
