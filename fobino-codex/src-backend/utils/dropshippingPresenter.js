
const ACTIVE_RFP_STATUSES = [
  'approved',
  'payment_pending',
  'payment_completed',
  'shipment_deadline_passed',
  'late_ticket_created',
  'shipped',
  'delivered_pending_confirmation'
];

function buildAnonymousCounterparty(role, rating = null) {
  return {
    role,
    label: role === 'provider' ? 'تامین‌کننده' : 'دراپ‌شیپر',
    rating
  };
}

function mapTimelineItem(item) {
  return {
    event: item.event,
    actor: item.actor,
    timestamp: item.timestamp,
    details: item.details || {}
  };
}

function pickProductCard(product, extra = {}) {
  return {
    _id: product._id,
    productName: product.productName,
    brand: product.brand,
    description: product.description,
    retailPrice: product.retailPrice,
    stockQuantity: product.stockQuantity,
    status: product.status,
    primaryImage: product.primaryImage || product.images?.[0] || null,
    images: product.images || [],
    categories: product.categories || {},
    shippingTime: product.shippingTime || null,
    stats: product.stats || {},
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    ...extra
  };
}

function pickRfpSummary(rfp, viewerRole = null) {
  const counterpartyRole = viewerRole === 'provider' ? 'dropshipper' : 'provider';

  return {
    _id: rfp._id,
    rfpCode: rfp.rfpCode,
    quantity: rfp.quantity,
    agreedPrice: rfp.agreedPrice,
    totalAmount: rfp.totalAmount,
    fobinoFee: rfp.fobinoFee,
    providerAmount: rfp.providerAmount,
    status: rfp.status,
    paymentStatus: rfp.paymentStatus,
    settlementStatus: rfp.settlementStatus,
    agreedShipmentDate: rfp.agreedShipmentDate,
    agreedShipmentDateJalali: rfp.agreedShipmentDateJalali,
    trackingCode: rfp.delivery?.trackingCode || null,
    shippedAt: rfp.delivery?.shippedAt || null,
    deliveredAt: rfp.delivery?.deliveredAt || null,
    lateFlow: rfp.lateFlow || {},
    ratings: rfp.ratings || {},
    createdAt: rfp.createdAt,
    updatedAt: rfp.updatedAt,
    counterparty: buildAnonymousCounterparty(counterpartyRole)
  };
}

function pickRfpDetail(rfp, viewerRole = null, product = null) {
  return {
    _id: rfp._id,
    rfpCode: rfp.rfpCode,
    quantity: rfp.quantity,
    agreedPrice: rfp.agreedPrice,
    totalAmount: rfp.totalAmount,
    fobinoFee: rfp.fobinoFee,
    providerAmount: rfp.providerAmount,
    paymentAmount: rfp.paymentAmount,
    feeAmount: rfp.feeAmount,
    providerNetAmount: rfp.providerNetAmount,
    status: rfp.status,
    paymentStatus: rfp.paymentStatus,
    settlementStatus: rfp.settlementStatus,
    shippingLocation: rfp.shippingLocation,
    productLocation: rfp.productLocation,
    proposedTerms: rfp.proposedTerms,
    agreedShipmentDate: rfp.agreedShipmentDate,
    agreedShipmentDateJalali: rfp.agreedShipmentDateJalali,
    payment: rfp.payment || {},
    delivery: rfp.delivery || {},
    lateFlow: rfp.lateFlow || {},
    ratings: rfp.ratings || {},
    timeline: (rfp.timeline || []).map(mapTimelineItem),
    product: product
      ? {
          _id: product._id,
          productName: product.productName,
          brand: product.brand,
          retailPrice: product.retailPrice,
          primaryImage: product.primaryImage || product.images?.[0] || null,
          status: product.status
        }
      : undefined,
    counterparty: buildAnonymousCounterparty(
      viewerRole === 'provider' ? 'dropshipper' : 'provider'
    ),
    createdAt: rfp.createdAt,
    updatedAt: rfp.updatedAt
  };
}

function groupRfpsByStatus(rfps = [], viewerRole = null) {
  const groups = {};
  for (const rfp of rfps) {
    if (!groups[rfp.status]) groups[rfp.status] = [];
    groups[rfp.status].push(pickRfpSummary(rfp, viewerRole));
  }
  return groups;
}

function calculateProductRfpCounts(rfps = []) {
  const counts = {
    total: rfps.length,
    completed: 0,
    active: 0,
    cancelled: 0,
    late: 0
  };

  for (const rfp of rfps) {
    if (rfp.status === 'completed') counts.completed += 1;
    if (ACTIVE_RFP_STATUSES.includes(rfp.status)) counts.active += 1;
    if (
      ['cancelled', 'rejected_by_provider', 'rejected_by_dropshipper', 'refunded_due_to_no_tracking'].includes(
        rfp.status
      )
    ) {
      counts.cancelled += 1;
    }
    if (['shipment_deadline_passed', 'late_ticket_created', 'provider_suspended_due_to_no_tracking'].includes(rfp.status)) {
      counts.late += 1;
    }
  }

  return counts;
}

module.exports = {
  ACTIVE_RFP_STATUSES,
  buildAnonymousCounterparty,
  pickProductCard,
  pickRfpSummary,
  pickRfpDetail,
  groupRfpsByStatus,
  calculateProductRfpCounts
};
