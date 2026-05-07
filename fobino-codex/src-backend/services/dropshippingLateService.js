

const DropshippingRFP = require('../models/DropshippingRFP');
const DropshippingProduct = require('../models/DropshippingProduct');
const DropshippingAgreement = require('../models/DropshippingAgreement');
const Wallet = require('../models/Wallet');
const ledgerService = require('./transactionLedgerService');
const ticketService = require('./dropshippingTicketService');

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

async function processShipmentDeadlineOverdues() {
  const now = new Date();

  const rfps = await DropshippingRFP.find({
    status: { $in: ['approved', 'payment_completed'] },
    agreedShipmentDate: { $ne: null, $lt: now },
    'delivery.trackingCode': { $in: [null, ''] },
    'lateFlow.lateTicketId': { $exists: false }
  }).populate('product');

  const results = {
    scanned: rfps.length,
    markedLate: 0,
    ticketsCreated: 0
  };

  for (const rfp of rfps) {
    if (!rfp.lateFlow?.isLate) {
      await rfp.markLate('shipment_deadline_passed');
      results.markedLate += 1;
    }

    const ticket = await ticketService.createLateTrackingTicket({
      userId: rfp.provider,
      rfp,
      product: rfp.product
    });

    const escalationDeadline = new Date(Date.now() + FIVE_DAYS_MS);
    await rfp.attachLateTicket(ticket._id, escalationDeadline);
    results.ticketsCreated += 1;
  }

  return results;
}

async function processLateTicketEscalations() {
  const now = new Date();

  const rfps = await DropshippingRFP.find({
    status: { $in: ['shipment_deadline_passed', 'late_ticket_created'] },
    'lateFlow.lateTicketId': { $exists: true, $ne: null },
    'lateFlow.autoRefundedAt': { $exists: false },
    'lateFlow.lateTicketCreatedAt': { $lt: new Date(now.getTime() - FIVE_DAYS_MS) },
    'delivery.trackingCode': { $in: [null, ''] }
  }).populate('product');

  const results = {
    scanned: rfps.length,
    refunded: 0,
    suspendedProviders: 0
  };

  for (const rfp of rfps) {
    const amount = Math.abs(rfp.payment?.amount || rfp.totalAmount || 0);
    const hasBlockedFunds = amount > 0 && rfp.paymentStatus === 'blocked';

    if (hasBlockedFunds) {
      const dropshipperWallet = await Wallet.getOrCreateWallet(rfp.dropshipper);

      await dropshipperWallet.unblockAmount(amount, 'IRR');

      await ledgerService.recordDropshippingRefunded({
        dropshipperId: rfp.dropshipper,
        dropshipperWalletId: dropshipperWallet._id,
        providerId: rfp.provider,
        amount,
        dropshippingRFPId: rfp._id,
        rfpCode: rfp.rfpCode,
        productName: rfp.product?.productName,
        reason: 'عدم ثبت کد رهگیری تا ۵ روز پس از تیکت سیستمی',
        metadata: {
          source: 'dropshippingLateService.processLateTicketEscalations'
        }
      });

      await ledgerService.markDropshippingPendingIncomingResolved({
        dropshippingRFPId: rfp._id,
        providerId: rfp.provider,
        finalStatus: 'refunded',
        explainer: 'به دلیل عدم ثبت کد رهگیری در بازه مقرر، مبلغ این RFP به دراپ‌شیپر بازگشت داده شد.',
        badge: 'danger'
      });

      await rfp.markRefunded('عدم ثبت کد رهگیری تا ۵ روز پس از تیکت سیستمی');
      results.refunded += 1;
    }

    const providerAgreement = await DropshippingAgreement.findOne({
      user: rfp.provider,
      role: 'provider'
    });

    if (providerAgreement && providerAgreement.status !== 'suspended') {
      providerAgreement.status = 'suspended';
      providerAgreement.suspensionReason = 'عدم ثبت کد رهگیری برای RFP دراپ‌شیپینگ در مهلت مقرر';
      providerAgreement.suspendedAt = new Date();
      providerAgreement.notes.push({
        note: `تعلیق خودکار به دلیل عدم ثبت کد رهگیری برای ${rfp.rfpCode}`,
        timestamp: new Date()
      });
      await providerAgreement.save();
      results.suspendedProviders += 1;
    }

    await rfp.markProviderSuspended('عدم ثبت کد رهگیری برای RFP دراپ‌شیپینگ در مهلت مقرر');
  }

  return results;
}

module.exports = {
  processShipmentDeadlineOverdues,
  processLateTicketEscalations
};