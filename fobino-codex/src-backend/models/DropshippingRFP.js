
const mongoose = require('mongoose');

const ACTIVE_PRODUCT_BLOCKING_STATUSES = [
  'approved',
  'payment_pending',
  'payment_completed',
  'shipment_deadline_passed',
  'late_ticket_created',
  'shipped',
  'delivered_pending_confirmation'
];

const timelineSchema = new mongoose.Schema(
  {
    event: String,
    timestamp: { type: Date, default: Date.now },
    actor: String,
    details: mongoose.Schema.Types.Mixed
  },
  { _id: false }
);

const lateFlowSchema = new mongoose.Schema(
  {
    isLate: { type: Boolean, default: false },
    lateMarkedAt: Date,
    lateReason: String,
    lateTicketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket'
    },
    lateTicketCreatedAt: Date,
    lateTicketEscalationDeadline: Date,
    autoRefundedAt: Date,
    autoRefundReason: String,
    providerSuspendedAt: Date,
    providerSuspendedReason: String
  },
  { _id: false }
);

const ratingFlagsSchema = new mongoose.Schema(
  {
    providerSubmitted: { type: Boolean, default: false },
    dropshipperSubmitted: { type: Boolean, default: false },
    providerRatingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DropshippingRating'
    },
    dropshipperRatingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DropshippingRating'
    }
  },
  { _id: false }
);

const dropshippingRFPSchema = new mongoose.Schema(
  {
    rfpCode: {
      type: String,
      // required: true,
      unique: true,
      index: true
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DropshippingProduct',
      required: true,
      index: true
    },

    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    dropshipper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    },

    agreedPrice: {
      type: Number,
      required: true,
      min: 0
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    fobinoFee: {
      type: Number,
      required: true,
      min: 0
    },

    providerAmount: {
      type: Number,
      required: true,
      min: 0
    },

    paymentAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    feeAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    providerNetAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'blocked', 'released', 'refunded'],
      default: 'pending',
      index: true
    },

    settlementStatus: {
      type: String,
      enum: [
        'none',
        'blocked_for_future_release',
        'released_to_beneficiary',
        'refunded'
      ],
      default: 'none',
      index: true
    },

    productLocation: {
      province: { type: String, required: true },
      city: { type: String, required: true },
      address: { type: String, required: true },
      postalCode: String
    },

    shippingLocation: {
      province: { type: String, required: true },
      city: { type: String, required: true },
      address: { type: String, required: true },
      postalCode: String,
      recipientName: String,
      recipientPhone: String
    },

    proposedTerms: {
      deliveryTime: {
        value: Number,
        unit: String
      },
      specialRequests: String
    },

    agreedShipmentDate: {
      type: Date,
      index: true
    },

    agreedShipmentDateJalali: {
      type: String,
      trim: true
    },

    status: {
      type: String,
      enum: [
        'draft',
        'pending_provider_approval',
        'pending_dropshipper_approval',
        'provider_editing',
        'dropshipper_editing',
        'approved',
        'payment_pending',
        'payment_completed',
        'shipment_deadline_passed',
        'late_ticket_created',
        'shipped',
        'delivered_pending_confirmation',
        'completed',
        'rejected_by_provider',
        'rejected_by_dropshipper',
        'refunded_due_to_no_tracking',
        'provider_suspended_due_to_no_tracking',
        'cancelled'
      ],
      default: 'draft',
      index: true
    },

    negotiationHistory: [
      {
        editedBy: {
          type: String,
          enum: ['provider', 'dropshipper']
        },
        changes: mongoose.Schema.Types.Mixed,
        timestamp: { type: Date, default: Date.now },
        version: Number
      }
    ],

    currentVersion: {
      type: Number,
      default: 1
    },

    approvedByProvider: {
      type: Boolean,
      default: false
    },

    approvedByDropshipper: {
      type: Boolean,
      default: false
    },

    approvedAt: Date,
    rejectedAt: Date,
    rejectionReason: String,

    payment: {
      transactionId: String,
      ledgerTransactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
      },
      paidAt: Date,
      amount: Number,
      status: {
        type: String,
        enum: ['pending', 'blocked', 'released', 'refunded'],
        default: 'pending'
      }
    },

    delivery: {
      shippedAt: Date,
      trackingCode: String,
      providerConfirmedDelivery: { type: Boolean, default: false },
      dropshipperConfirmedDelivery: { type: Boolean, default: false },
      deliveredAt: Date
    },

    lateFlow: {
      type: lateFlowSchema,
      default: () => ({})
    },

    ratings: {
      type: ratingFlagsSchema,
      default: () => ({})
    },

    timeline: {
      type: [timelineSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

dropshippingRFPSchema.index({ provider: 1, status: 1 });
dropshippingRFPSchema.index({ dropshipper: 1, status: 1 });
dropshippingRFPSchema.index({ product: 1, status: 1 });
dropshippingRFPSchema.index({ status: 1, agreedShipmentDate: 1 });
dropshippingRFPSchema.index({ 'lateFlow.isLate': 1, 'lateFlow.lateTicketCreatedAt': 1 });

dropshippingRFPSchema.pre('save', async function (next) {
  if (this.isNew && !this.rfpCode) {
    const count = await this.constructor.countDocuments();
    this.rfpCode = `DS-RFP-${Date.now()}-${count + 1}`;
  }

  if (this.payment?.status && this.paymentStatus !== this.payment.status) {
    this.paymentStatus = this.payment.status;
  }

  next();
});

dropshippingRFPSchema.methods.addTimeline = function (event, actor, details = {}) {
  this.timeline.push({
    event,
    actor,
    details,
    timestamp: new Date()
  });
};

dropshippingRFPSchema.methods.addToHistory = function (editedBy, changes) {
  this.negotiationHistory.push({
    editedBy,
    changes,
    version: this.currentVersion,
    timestamp: new Date()
  });
  this.currentVersion += 1;
};

dropshippingRFPSchema.methods.submitForProviderApproval = function () {
  this.status = 'pending_provider_approval';
  this.approvedByDropshipper = true;
  this.addTimeline('submitted_for_provider_approval', 'dropshipper');
  return this.save();
};

dropshippingRFPSchema.methods.approveAsProvider = function () {
  if (this.approvedByDropshipper) {
    this.status = 'approved';
    this.approvedByProvider = true;
    this.approvedAt = new Date();
    this.addTimeline('fully_approved', 'provider', {
      agreedShipmentDate: this.agreedShipmentDate,
      agreedShipmentDateJalali: this.agreedShipmentDateJalali
    });
  } else {
    this.status = 'pending_dropshipper_approval';
    this.approvedByProvider = true;
    this.addTimeline('approved_by_provider', 'provider');
  }
  return this.save();
};

dropshippingRFPSchema.methods.approveAsDropshipper = function () {
  if (this.approvedByProvider) {
    this.status = 'approved';
    this.approvedByDropshipper = true;
    this.approvedAt = new Date();
    this.addTimeline('fully_approved', 'dropshipper', {
      agreedShipmentDate: this.agreedShipmentDate,
      agreedShipmentDateJalali: this.agreedShipmentDateJalali
    });
  } else {
    this.status = 'pending_provider_approval';
    this.approvedByDropshipper = true;
    this.addTimeline('approved_by_dropshipper', 'dropshipper');
  }
  return this.save();
};

dropshippingRFPSchema.methods.editAsProvider = function (changes) {
  this.addToHistory('provider', changes);
  this.status = 'provider_editing';
  this.approvedByDropshipper = false;
  Object.assign(this, changes);
  this.addTimeline('edited_by_provider', 'provider', changes);
  return this.save();
};

dropshippingRFPSchema.methods.editAsDropshipper = function (changes) {
  this.addToHistory('dropshipper', changes);
  this.status = 'dropshipper_editing';
  this.approvedByProvider = false;
  Object.assign(this, changes);
  this.addTimeline('edited_by_dropshipper', 'dropshipper', changes);
  return this.save();
};

dropshippingRFPSchema.methods.rejectAsProvider = function (reason) {
  this.status = 'rejected_by_provider';
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  this.addTimeline('rejected_by_provider', 'provider', { reason });
  return this.save();
};

dropshippingRFPSchema.methods.rejectAsDropshipper = function (reason) {
  this.status = 'rejected_by_dropshipper';
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  this.addTimeline('rejected_by_dropshipper', 'dropshipper', { reason });
  return this.save();
};

dropshippingRFPSchema.methods.processPayment = function (
  transactionId,
  amount,
  ledgerTransactionId = null
) {
  this.payment = {
    transactionId,
    ledgerTransactionId,
    paidAt: new Date(),
    amount,
    status: 'blocked'
  };
  this.paymentAmount = amount;
  this.paymentStatus = 'blocked';
  this.settlementStatus = 'blocked_for_future_release';
  this.status = 'payment_completed';
  this.addTimeline('payment_completed', 'dropshipper', {
    transactionId,
    ledgerTransactionId,
    amount
  });
  return this.save();
};

dropshippingRFPSchema.methods.markShipped = function (trackingCode) {
  this.delivery.shippedAt = new Date();
  this.delivery.trackingCode = trackingCode;
  this.status = 'shipped';
  this.lateFlow.isLate = false;
  this.addTimeline('shipped', 'provider', { trackingCode });
  return this.save();
};

dropshippingRFPSchema.methods.markLate = function (reason = 'shipment_deadline_passed') {
  this.status = 'shipment_deadline_passed';
  this.lateFlow.isLate = true;
  this.lateFlow.lateMarkedAt = new Date();
  this.lateFlow.lateReason = reason;
  this.addTimeline('shipment_deadline_passed', 'system', { reason });
  return this.save();
};

dropshippingRFPSchema.methods.attachLateTicket = function (ticketId, escalationDeadline) {
  this.status = 'late_ticket_created';
  this.lateFlow.lateTicketId = ticketId;
  this.lateFlow.lateTicketCreatedAt = new Date();
  this.lateFlow.lateTicketEscalationDeadline = escalationDeadline;
  this.addTimeline('late_ticket_created', 'system', {
    ticketId,
    escalationDeadline
  });
  return this.save();
};

dropshippingRFPSchema.methods.markRefunded = function (reason) {
  this.payment.status = 'refunded';
  this.paymentStatus = 'refunded';
  this.settlementStatus = 'refunded';
  this.status = 'refunded_due_to_no_tracking';
  this.lateFlow.autoRefundedAt = new Date();
  this.lateFlow.autoRefundReason = reason;
  this.addTimeline('auto_refunded', 'system', { reason });
  return this.save();
};

dropshippingRFPSchema.methods.markProviderSuspended = function (reason) {
  this.status = 'provider_suspended_due_to_no_tracking';
  this.lateFlow.providerSuspendedAt = new Date();
  this.lateFlow.providerSuspendedReason = reason;
  this.addTimeline('provider_suspended', 'system', { reason });
  return this.save();
};

dropshippingRFPSchema.methods.confirmDeliveryByProvider = function () {
  this.delivery.providerConfirmedDelivery = true;
  if (this.delivery.dropshipperConfirmedDelivery) {
    return this.completeOrder();
  }
  this.status = 'delivered_pending_confirmation';
  this.addTimeline('delivery_confirmed_by_provider', 'provider');
  return this.save();
};

dropshippingRFPSchema.methods.confirmDeliveryByDropshipper = function () {
  this.delivery.dropshipperConfirmedDelivery = true;
  if (this.delivery.providerConfirmedDelivery) {
    return this.completeOrder();
  }
  this.status = 'delivered_pending_confirmation';
  this.addTimeline('delivery_confirmed_by_dropshipper', 'dropshipper');
  return this.save();
};

dropshippingRFPSchema.methods.completeOrder = async function () {
  this.status = 'completed';
  this.delivery.deliveredAt = new Date();
  this.payment.status = 'released';
  this.paymentStatus = 'released';
  this.settlementStatus = 'released_to_beneficiary';
  this.addTimeline('order_completed', 'system', {
    deliveredAt: this.delivery.deliveredAt
  });

  const Product = mongoose.model('DropshippingProduct');
  await Product.findByIdAndUpdate(this.product, {
    $inc: { 'stats.completedOrders': 1 }
  });

  return this.save();
};

dropshippingRFPSchema.methods.canBlockProductMutation = function () {
  return ACTIVE_PRODUCT_BLOCKING_STATUSES.includes(this.status);
};

dropshippingRFPSchema.methods.canBeRatedBy = function (actor) {
  if (this.status !== 'completed') return false;
  if (actor === 'provider') return !this.ratings.providerSubmitted;
  if (actor === 'dropshipper') return !this.ratings.dropshipperSubmitted;
  return false;
};

dropshippingRFPSchema.statics.getActiveBlockingStatuses = function () {
  return [...ACTIVE_PRODUCT_BLOCKING_STATUSES];
};

module.exports = mongoose.model('DropshippingRFP', dropshippingRFPSchema);


