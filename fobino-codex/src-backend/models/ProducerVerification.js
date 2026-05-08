const mongoose = require('mongoose');

const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const addressSchema = new Schema({
  province: String,
  city: String,
  street: String,
  postalCode: String,
  coordinates: {
    lat: Number,
    lng: Number,
  },
}, { _id: false });

const fileSchema = new Schema({
  url: String,
  publicId: String,
  caption: String,
  title: String,
  type: String,
  mimeType: String,
  uploadedAt: { type: Date, default: Date.now },
}, { _id: true });

const reviewFields = {
  submittedAt: Date,
  reviewedAt: Date,
  reviewedBy: { type: ObjectId, ref: 'User' },
  rejectionReason: String,
  resubmitReason: String,
};

const producerVerificationSchema = new Schema({
  user: { type: ObjectId, ref: 'User', required: true, unique: true, index: true },
  activeSubscription: { type: ObjectId, ref: 'Subscription' },

  publicLevel: { type: Number, enum: [0, 1, 2, 3], default: 0, index: true },
  overallStatus: {
    type: String,
    enum: ['not_started', 'in_progress', 'pending_review', 'verified_level_1', 'verified_level_2', 'verified_level_3', 'rejected', 'suspended'],
    default: 'not_started',
    index: true,
  },

  production: {
    name: String,
    address: addressSchema,
    phone: String,
    description: String,
  },

  levels: {
    level1: {
      status: { type: String, enum: ['not_started', 'draft', 'pending', 'approved', 'rejected', 'requires_resubmit', 'revision_pending'], default: 'not_started', index: true },
      photos: [fileSchema],
      revision: Schema.Types.Mixed,
      ...reviewFields,
    },
    level2: {
      status: { type: String, enum: ['locked', 'not_started', 'draft', 'pending', 'approved', 'rejected', 'requires_resubmit', 'revision_pending'], default: 'locked', index: true },
      documents: [fileSchema],
      revision: Schema.Types.Mixed,
      ...reviewFields,
    },
    level3: {
      status: { type: String, enum: ['locked', 'not_started', 'pending', 'scheduled', 'visited', 'approved', 'rejected', 'cancelled'], default: 'locked', index: true },
      visitRequest: {
        productionName: String,
        address: addressSchema,
        coordinatorName: String,
        coordinatorPhone: String,
        preferredDates: [Date],
        workingHours: String,
        notes: String,
      },
      scheduledAt: Date,
      visitedAt: Date,
      adminVisitNotes: String,
      ...reviewFields,
    },
  },

  adminNotes: [{
    note: String,
    addedBy: { type: ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

producerVerificationSchema.index({ overallStatus: 1, updatedAt: -1 });
producerVerificationSchema.index({ publicLevel: -1, updatedAt: -1 });

producerVerificationSchema.methods.recalculatePublicLevel = function recalculatePublicLevel() {
  const l1 = this.levels?.level1?.status === 'approved';
  const l2 = this.levels?.level2?.status === 'approved';
  const l3 = this.levels?.level3?.status === 'approved';

  this.publicLevel = l3 ? 3 : l2 ? 2 : l1 ? 1 : 0;

  if (this.publicLevel === 3) this.overallStatus = 'verified_level_3';
  else if (this.publicLevel === 2) this.overallStatus = 'verified_level_2';
  else if (this.publicLevel === 1) this.overallStatus = 'verified_level_1';
  else if (['pending', 'revision_pending'].includes(this.levels?.level1?.status)) this.overallStatus = 'pending_review';
  else if (this.levels?.level1?.status && this.levels.level1.status !== 'not_started') this.overallStatus = 'in_progress';
  else this.overallStatus = 'not_started';

  if (this.publicLevel >= 1 && this.levels.level2.status === 'locked') this.levels.level2.status = 'not_started';
  if (this.publicLevel >= 2 && this.levels.level3.status === 'locked') this.levels.level3.status = 'not_started';

  return this;
};

module.exports = mongoose.model('ProducerVerification', producerVerificationSchema);
