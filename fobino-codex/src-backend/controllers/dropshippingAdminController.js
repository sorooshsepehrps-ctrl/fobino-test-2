
const DropshippingRFP = require('../models/DropshippingRFP');
const DropshippingAgreement = require('../models/DropshippingAgreement');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getLateRFPs = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const query = {
    status: {
      $in: [
        'shipment_deadline_passed',
        'late_ticket_created',
        'refunded_due_to_no_tracking',
        'provider_suspended_due_to_no_tracking'
      ]
    }
  };

  const total = await DropshippingRFP.countDocuments(query);
  const rfps = await DropshippingRFP.find(query)
    .populate('product')
    .sort('-updatedAt')
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.json({
    status: 'success',
    data: rfps.map((rfp) => ({
      _id: rfp._id,
      rfpCode: rfp.rfpCode,
      product: rfp.product
        ? {
            _id: rfp.product._id,
            productName: rfp.product.productName
          }
        : null,
      status: rfp.status,
      agreedShipmentDate: rfp.agreedShipmentDate,
      agreedShipmentDateJalali: rfp.agreedShipmentDateJalali,
      lateFlow: rfp.lateFlow,
      createdAt: rfp.createdAt,
      updatedAt: rfp.updatedAt
    })),
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      limit: Number(limit)
    }
  });
});

exports.unsuspendProvider = catchAsync(async (req, res, next) => {
  const agreement = await DropshippingAgreement.findById(req.params.id);

  if (!agreement) {
    return next(new AppError('قرارداد یافت نشد', 404));
  }

  if (agreement.role !== 'provider') {
    return next(new AppError('فقط قرارداد تامین‌کننده قابل رفع تعلیق است', 400));
  }

  agreement.status = 'active';
  agreement.suspensionReason = undefined;
  agreement.suspendedAt = undefined;
  agreement.notes.push({
    addedBy: req.user._id,
    note: `رفع تعلیق توسط ادمین${req.body?.reason ? `: ${req.body.reason}` : ''}`,
    timestamp: new Date()
  });

  await agreement.save();

  res.json({
    status: 'success',
    data: agreement
  });
});
