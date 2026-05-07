

const DropshippingProduct = require('../models/DropshippingProduct');
const DropshippingRFP = require('../models/DropshippingRFP');
const DropshippingRating = require('../models/DropshippingRating');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const {
  pickProductCard,
  groupRfpsByStatus,
  calculateProductRfpCounts,
} = require('../utils/dropshippingPresenter');

const BLOCKING_STATUSES = DropshippingRFP.getActiveBlockingStatuses
  ? DropshippingRFP.getActiveBlockingStatuses()
  : ['approved', 'payment_completed', 'shipment_deadline_passed', 'late_ticket_created', 'shipped', 'delivered_pending_confirmation'];

async function hasBlockingRfp(productId) {
  const count = await DropshippingRFP.countDocuments({
    product: productId,
    status: { $in: BLOCKING_STATUSES },
  });

  return count > 0;
}

async function buildProviderRating(providerId) {
  if (!DropshippingRating?.calculateAverageForUser) {
    return { averageStars: 0, totalRatings: 0 };
  }

  return DropshippingRating.calculateAverageForUser(providerId, 'provider');
}

exports.createProduct = catchAsync(async (req, res) => {
  const product = await DropshippingProduct.create({
    ...req.body,
    provider: req.user._id,
  });

  res.status(201).json({
    status: 'success',
    data: product,
  });
});

exports.getProviderDashboardSummary = catchAsync(async (req, res) => {
  const providerId = req.user._id;

  const [products, rfps, rating] = await Promise.all([
    DropshippingProduct.find({ provider: providerId }).populate('rfps'),
    DropshippingRFP.find({ provider: providerId }).sort('-updatedAt').limit(6).populate('product'),
    buildProviderRating(providerId),
  ]);

  let totalProducts = products.length;
  let activeProducts = 0;
  let inactiveProducts = 0;
  let outOfStockProducts = 0;
  let totalActiveRfps = 0;
  let totalCompletedRfps = 0;
  let totalLateRfps = 0;

  const recentProducts = products.slice(0, 6).map((product) => {
    const counts = calculateProductRfpCounts(product.rfps || []);

    if (product.status === 'active') activeProducts += 1;
    if (product.status === 'inactive') inactiveProducts += 1;
    if (product.status === 'out_of_stock') outOfStockProducts += 1;

    totalActiveRfps += counts.active;
    totalCompletedRfps += counts.completed;
    totalLateRfps += counts.late;

    return pickProductCard(product, {
      rfpCounts: counts,
      mutationsLocked: counts.active > 0,
    });
  });

  res.json({
    status: 'success',
    data: {
      cards: {
        totalProducts,
        activeProducts,
        inactiveProducts,
        outOfStockProducts,
        totalActiveRfps,
        totalCompletedRfps,
        totalLateRfps,
        providerRating: rating,
      },
      recentProducts,
      recentRfps: rfps.map((rfp) => ({
        _id: rfp._id,
        rfpCode: rfp.rfpCode,
        status: rfp.status,
        totalAmount: rfp.totalAmount,
        agreedShipmentDate: rfp.agreedShipmentDate,
        agreedShipmentDateJalali: rfp.agreedShipmentDateJalali,
        product: rfp.product
          ? {
              _id: rfp.product._id,
              productName: rfp.product.productName,
              primaryImage: rfp.product.primaryImage || rfp.product.images?.[0] || null,
            }
          : null,
        updatedAt: rfp.updatedAt,
      })),
    },
  });
});

exports.getDropshipperDashboardSummary = catchAsync(async (req, res) => {
  const dropshipperId = req.user._id;

  const [rfps, recentProducts] = await Promise.all([
    DropshippingRFP.find({ dropshipper: dropshipperId }).populate('product').sort('-updatedAt'),
    DropshippingProduct.find({ status: 'active', stockQuantity: { $gt: 0 } }).sort('-createdAt').limit(6),
  ]);

  const acceptedProductIds = new Set();
  let totalActiveRfps = 0;
  let totalCompletedRfps = 0;
  let totalRefundedRfps = 0;
  let totalLateRfps = 0;

  for (const rfp of rfps) {
    if (rfp.product) acceptedProductIds.add(String(rfp.product._id || rfp.product));

    if (['approved', 'payment_completed', 'shipment_deadline_passed', 'late_ticket_created', 'shipped', 'delivered_pending_confirmation'].includes(rfp.status)) {
      totalActiveRfps += 1;
    }

    if (rfp.status === 'completed') totalCompletedRfps += 1;
    if (rfp.status === 'refunded_due_to_no_tracking') totalRefundedRfps += 1;
    if (['shipment_deadline_passed', 'late_ticket_created', 'provider_suspended_due_to_no_tracking'].includes(rfp.status)) {
      totalLateRfps += 1;
    }
  }

  const browseProducts = await Promise.all(
    recentProducts.map(async (product) =>
      pickProductCard(product, {
        providerRating: await buildProviderRating(product.provider),
      })
    )
  );

  res.json({
    status: 'success',
    data: {
      cards: {
        totalRfps: rfps.length,
        acceptedProductsCount: acceptedProductIds.size,
        totalActiveRfps,
        totalCompletedRfps,
        totalRefundedRfps,
        totalLateRfps,
      },
      recentRfps: rfps.slice(0, 6).map((rfp) => ({
        _id: rfp._id,
        rfpCode: rfp.rfpCode,
        status: rfp.status,
        totalAmount: rfp.totalAmount,
        agreedShipmentDate: rfp.agreedShipmentDate,
        agreedShipmentDateJalali: rfp.agreedShipmentDateJalali,
        product: rfp.product
          ? {
              _id: rfp.product._id,
              productName: rfp.product.productName,
              primaryImage: rfp.product.primaryImage || rfp.product.images?.[0] || null,
            }
          : null,
        updatedAt: rfp.updatedAt,
      })),
      browseProducts,
    },
  });
});

exports.getMyProducts = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;

  const query = { provider: req.user._id };

  if (status) query.status = status;
  if (search) query.$text = { $search: search };

  const total = await DropshippingProduct.countDocuments(query);
  const products = await DropshippingProduct.find(query)
    .sort('-createdAt')
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .populate('rfps');

  const data = products.map((product) => {
    const counts = calculateProductRfpCounts(product.rfps || []);
    return pickProductCard(product, {
      rfpCounts: counts,
      mutationsLocked: counts.active > 0,
      mutationLockReason: counts.active > 0 ? 'برای این محصول RFP فعال وجود دارد' : null,
    });
  });

  res.json({
    status: 'success',
    data,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      limit: Number(limit),
    },
  });
});

exports.getProductById = catchAsync(async (req, res, next) => {
  const product = await DropshippingProduct.findById(req.params.id)
    .populate({ path: 'rfps', options: { sort: { createdAt: -1 } } })
    .populate('provider', 'scores.rating scores.totalRatings');

  if (!product) {
    return next(new AppError('محصول یافت نشد', 404));
  }

  const isProviderOwner = String(product.provider?._id || product.provider) === String(req.user._id);
  const isAdmin = req.user.role === 'admin' || req.user.roles?.includes('admin');
  const isDropshipper = req.user.isDropshipper === true;

  if (!isProviderOwner && !isAdmin && !isDropshipper) {
    return next(new AppError('شما اجازه دسترسی به این محصول را ندارید', 403));
  }

  let visibleRfps = [];
  let viewerRole = 'provider';

  if (isProviderOwner || isAdmin) {
    visibleRfps = product.rfps || [];
    viewerRole = 'provider';
  } else {
    visibleRfps = (product.rfps || []).filter(
      (rfp) => String(rfp.dropshipper) === String(req.user._id)
    );
    viewerRole = 'dropshipper';
    await product.incrementViews();
  }

  const counts = calculateProductRfpCounts(product.rfps || []);
  const providerRating = await buildProviderRating(product.provider._id || product.provider);

  res.json({
    status: 'success',
    data: {
      ...pickProductCard(product, {
        rfpCounts: counts,
        providerRating,
        mutationsLocked: counts.active > 0,
      }),
      groupedRfps: groupRfpsByStatus(visibleRfps, viewerRole),
    },
  });
});

exports.getAllProductsForDropshippers = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, category, search, minPrice, maxPrice, province, city } = req.query;

  const query = { status: 'active', stockQuantity: { $gt: 0 } };

  if (category) query['categories.level3.id'] = category;
  if (search) query.$text = { $search: search };

  if (minPrice || maxPrice) {
    query.retailPrice = {};
    if (minPrice) query.retailPrice.$gte = Number(minPrice);
    if (maxPrice) query.retailPrice.$lte = Number(maxPrice);
  }

  if (province) query['location.province'] = province;
  if (city) query['location.city'] = city;

  const total = await DropshippingProduct.countDocuments(query);
  const products = await DropshippingProduct.find(query)
    .sort('-createdAt')
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const data = await Promise.all(
    products.map(async (product) =>
      pickProductCard(product, {
        providerRating: await buildProviderRating(product.provider),
      })
    )
  );

  res.json({
    status: 'success',
    data,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      limit: Number(limit),
    },
  });
});

exports.getAcceptedProductsForDropshipper = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;

  const acceptedRfps = await DropshippingRFP.find({
    dropshipper: req.user._id,
  }).select('product');

  const productIds = [...new Set(acceptedRfps.map((item) => String(item.product)).filter(Boolean))];

  const query = { _id: { $in: productIds } };
  if (search) query.$text = { $search: search };

  const total = await DropshippingProduct.countDocuments(query);
  const products = await DropshippingProduct.find(query)
    .sort('-updatedAt')
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .populate({
      path: 'rfps',
      match: { dropshipper: req.user._id },
      options: { sort: { createdAt: -1 } },
    });

  const data = await Promise.all(
    products.map(async (product) => {
      const counts = calculateProductRfpCounts(product.rfps || []);
      return pickProductCard(product, {
        rfpCounts: counts,
        providerRating: await buildProviderRating(product.provider),
      });
    })
  );

  res.json({
    status: 'success',
    data,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      limit: Number(limit),
    },
  });
});

exports.getAcceptedProductDetailForDropshipper = catchAsync(async (req, res, next) => {
  const product = await DropshippingProduct.findById(req.params.id).populate({
    path: 'rfps',
    match: { dropshipper: req.user._id },
    options: { sort: { createdAt: -1 } },
  });

  if (!product) {
    return next(new AppError('محصول یافت نشد', 404));
  }

  const ownRfps = product.rfps || [];
  if (!ownRfps.length) {
    return next(new AppError('شما RFPی روی این محصول ندارید', 403));
  }

  const counts = calculateProductRfpCounts(ownRfps);

  res.json({
    status: 'success',
    data: {
      ...pickProductCard(product, {
        rfpCounts: counts,
        providerRating: await buildProviderRating(product.provider),
      }),
      groupedRfps: groupRfpsByStatus(ownRfps, 'dropshipper'),
    },
  });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
  const product = await DropshippingProduct.findById(req.params.id);

  if (!product) return next(new AppError('محصول یافت نشد', 404));
  if (String(product.provider) !== String(req.user._id)) {
    return next(new AppError('شما اجازه ویرایش این محصول را ندارید', 403));
  }

  const blocked = await hasBlockingRfp(product._id);
  if (blocked) {
    return next(new AppError('برای این محصول RFP فعال وجود دارد و ویرایش آن مجاز نیست', 400));
  }

  Object.assign(product, req.body);
  await product.save();

  res.json({ status: 'success', data: product });
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  const product = await DropshippingProduct.findById(req.params.id);

  if (!product) return next(new AppError('محصول یافت نشد', 404));
  if (String(product.provider) !== String(req.user._id)) {
    return next(new AppError('شما اجازه حذف این محصول را ندارید', 403));
  }

  const blocked = await hasBlockingRfp(product._id);
  if (blocked) {
    return next(new AppError('نمی‌توانید محصولی با RFP فعال را حذف کنید', 400));
  }

  await product.deleteOne();

  res.json({ status: 'success', message: 'محصول با موفقیت حذف شد' });
});

exports.toggleProductStatus = catchAsync(async (req, res, next) => {
  const product = await DropshippingProduct.findById(req.params.id);

  if (!product) return next(new AppError('محصول یافت نشد', 404));
  if (String(product.provider) !== String(req.user._id)) {
    return next(new AppError('شما اجازه دسترسی ندارید', 403));
  }

  product.status = product.status === 'active' ? 'inactive' : 'active';
  await product.save();

  res.json({ status: 'success', data: product });
});

exports.updateStock = catchAsync(async (req, res, next) => {
  const { quantity } = req.body;
  const product = await DropshippingProduct.findById(req.params.id);

  if (!product) return next(new AppError('محصول یافت نشد', 404));
  if (String(product.provider) !== String(req.user._id)) {
    return next(new AppError('شما اجازه دسترسی ندارید', 403));
  }

  await product.updateStock(quantity);

  res.json({ status: 'success', data: product });
});

exports.getProductRFPs = catchAsync(async (req, res, next) => {
  const product = await DropshippingProduct.findById(req.params.id).populate({
    path: 'rfps',
    options: { sort: { createdAt: -1 } },
  });

  if (!product) return next(new AppError('محصول یافت نشد', 404));
  if (String(product.provider) !== String(req.user._id)) {
    return next(new AppError('شما اجازه دسترسی ندارید', 403));
  }

  res.json({
    status: 'success',
    data: groupRfpsByStatus(product.rfps || [], 'provider'),
  });
});
