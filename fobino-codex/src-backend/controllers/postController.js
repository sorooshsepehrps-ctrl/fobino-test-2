const Post = require('../models/Post');
const Category = require('../models/Category');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { asyncHandler } = require('../middleware/errorHandler');
const response = require('../utils/responseFormatter');
const fileUploadService = require('../services/fileUploadService');
const subscriptionService = require('../services/subscriptionService');
const { paginate } = require('../utils/helpers');
const logger = require('../utils/logger');
const { buildBadgesForUser, buildBadgesForUsers } = require('../utils/presenters/userBadgePresenter');

// Constants
const NARDEBAN_PRICE = 100000; // 10,000 Toman = 100,000 Rials
const SPECIAL_PRICE = 50000;   // 5,000 Toman = 50,000 Rials

const postBasePopulate = [
  { path: 'user', select: 'firstName lastName profileImage scores verifications level producerVerificationStatus phone email' },
  { path: 'categoryLevel1', select: 'name slug' },
  { path: 'categoryLevel2', select: 'name slug' },
  { path: 'categoryLevel3', select: 'name slug' }
];

const buildPostResponseObject = async (postDoc, req) => {
  const post = postDoc.toObject ? postDoc.toObject() : { ...postDoc };

  post.displayPrice = post.type === 'sell'
    ? (
        post.minPricePerUnit === post.maxPricePerUnit
          ? `${post.minPricePerUnit?.toLocaleString()} ریال`
          : `${post.minPricePerUnit?.toLocaleString()} - ${post.maxPricePerUnit?.toLocaleString()} ریال`
      )
    : (post.maxBudget ? `تا ${post.maxBudget.toLocaleString()} ریال` : 'توافقی');

  const remainingMs = new Date(post.expiresAt) - new Date();
  post.remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

  post.isNardebanActive = !!(
    post.isNardeban &&
    (!post.nardebanExpiresAt || new Date(post.nardebanExpiresAt) > new Date())
  );

  post.isSpecialActive = !!(
    post.isSpecial &&
    (!post.specialExpiresAt || new Date(post.specialExpiresAt) > new Date())
  );

  if (post.user) {
    post.user.badges = await buildBadgesForUser(post.user);
  }

  if (post.type === 'buy') {
    if (req.user && post.user?._id?.toString() !== req.user._id.toString()) {
      const accessInfo = await subscriptionService.canAccessContact(req.user._id);
      post.canAccessContact = accessInfo.canAccess;
      post.remainingQuota = accessInfo.remaining;
      post.requiresContactAccess = true;

      if (!accessInfo.canAccess && post.user) {
        delete post.user.phone;
        delete post.user.email;
      }
    } else if (!req.user) {
      post.requiresLoginForContact = true;
      if (post.user) {
        delete post.user.phone;
        delete post.user.email;
      }
    }
  }

  return post;
};
// @desc    Create new post
// @route   POST /api/posts
// @access  Private

exports.createPost = asyncHandler(async (req, res) => {
  const {
    type, title, description, 
    categoryLevel1, categoryLevel2, categoryLevel3,
    // For Sell Posts
    productName, brand, productType,
    province, city, address,
    dropShipping, needsMarketer, marketerPercentage,
    unit, availableQuantity, minOrder,
    minPricePerUnit, maxPricePerUnit,
    hasDiscount, discountPercentage, discountUntil,
    keyFeatures, keywords,
    // For Buy Posts
    neededProductName, neededProductType,
    neededQuantity, neededUnit,
    usageType, requestExpiry, paymentMethods,
    deliveryProvince, deliveryCity, deliveryAddress,
    maxBudget, additionalRequirements,
    // Common
   
    expiresAt,
    status = 'draft'
  } = req.body;

  console.log('=== CREATE POST START ===');
  console.log('Type:', type);
  console.log('Status:', status);
  console.log('User ID:', req.user._id);

  // === TEMPORARY FIX: Skip subscription check ===
  console.log('SKIPPING subscription check for now...');
  /*
  if (type === 'sell' && status === 'active') {
    try {
      const canCreate = await subscriptionService.checkLimits(req.user._id);
      
      if (!canCreate.hasActiveSubscription) {
        return response.error(res, 'برای ایجاد آگهی نیاز به اشتراک فعال دارید', 403);
      }
      if (canCreate.limits.sellPosts.remaining === 0) {
        return response.error(res, 'سهمیه آگهی فروش شما به پایان رسیده است', 403);
      }
    } catch (error) {
      console.error('Subscription check error:', error);
      return response.error(res, 'خطا در بررسی وضعیت اشتراک', 500);
    }
  }
  */

  // Verify categories exist
  const categories = await Promise.all([
    Category.findById(categoryLevel1),
    Category.findById(categoryLevel2),
    Category.findById(categoryLevel3)
  ]);

  if (categories.some(cat => !cat)) {
    console.log('Category validation failed');
    return response.error(res, 'دسته‌بندی یافت نشد', 400);
  }

  const postData = {
    user: req.user._id,
    type,
    title,
    description,
    categoryLevel1,
    categoryLevel2,
    categoryLevel3,
    keywords: keywords || [],
    status,
    expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  };

  // Add Sell Post specific fields
  if (type === 'sell') {
    console.log('Processing sell post...');
    const requiredSellFields = [
      productName, brand,
      province, city, unit, availableQuantity,
      minOrder, minPricePerUnit, maxPricePerUnit
    ];
    
    if (status === 'active' && requiredSellFields.some(field => !field)) {
      return response.error(res, 'همه فیلدهای الزامی برای آگهی فروش باید پر شوند', 400);
    }

    Object.assign(postData, {
      productName,
      brand,
      productType: productType || 'new',
      province,
      city,
      address,
      dropShipping: dropShipping === true || dropShipping === 'true',
      needsMarketer: needsMarketer === true || needsMarketer === 'true',
      marketerPercentage: needsMarketer ? Number(marketerPercentage) : 0,
      unit,
      availableQuantity: Number(availableQuantity) || 0,
      minOrder: Number(minOrder) || 1,
      minPricePerUnit: Number(minPricePerUnit) || 0,
      maxPricePerUnit: Number(maxPricePerUnit) || 0,
      hasDiscount: hasDiscount === true || hasDiscount === 'true',
      discountPercentage: discountPercentage ? Number(discountPercentage) : 0,
      discountUntil: discountUntil ? new Date(discountUntil) : null,
      keyFeatures: keyFeatures || []
    });

    if (productName) postData.keywords.push(...productName.split(' '));
    if (brand) postData.keywords.push(brand);
  }

  // Add Buy Post specific fields
  if (type === 'buy') {
    console.log('Processing buy post...');
    const requiredBuyFields = [
      neededProductName, neededProductType,
      neededQuantity, neededUnit,
      usageType, requestExpiry,
      deliveryProvince, deliveryCity
    ];
    
    if (status === 'active' && requiredBuyFields.some(field => !field)) {
      console.log('Missing buy post fields:', requiredBuyFields.filter(f => !f));
      return response.error(res, 'همه فیلدهای الزامی برای آگهی خرید باید پر شوند', 400);
    }

    Object.assign(postData, {
      neededProductName,
      neededProductType,
      neededQuantity: Number(neededQuantity) || 0,
      neededUnit,
      usageType: usageType || 'domestic',
      requestExpiry: requestExpiry ? new Date(requestExpiry)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      paymentMethods: paymentMethods || ['cash'],
      deliveryProvince,
      deliveryCity,
      deliveryAddress,
      maxBudget: maxBudget ? Number(maxBudget) : null,
      additionalRequirements
    });

    if (neededProductName) postData.keywords.push(...neededProductName.split(' '));
    if (neededProductType) postData.keywords.push(neededProductType);
  }

  // International and currencies (common option)
  // if (isInternational) {
  //   postData.isInternational = true;
  //   postData.currencies = currencies || ['USD'];
  // }

  // Finally create post
  const post = await Post.create(postData);

  console.log('Post created with ID:', post._id);
  return response.success(res, post, 'آگهی با موفقیت ایجاد شد', 201);
});
// @desc    Get all posts with filters
// @route   GET /api/posts
// @access  Public
// @desc    Get all posts with filters
// @route   GET /api/posts
// @access  Public
exports.getPosts = asyncHandler(async (req, res) => {
  const {
    page = 1, 
    limit = 20,
    type, 
    categoryLevel1, categoryLevel2, categoryLevel3,
    province, city, 
    minPrice, maxPrice,
    sort = 'priority', // priority, newest, cheapest, expensive, ending, popular
    order = 'desc',
    search,
    user,
    status = 'active',
    nardeban = false,
    special = false,
    featured = false
  } = req.query;

  const query = {};

  // Status filter
  if (status === 'active') {
    query.status = 'active';
    query.expiresAt = { $gt: new Date() };
  } else if (status) {
    query.status = status;
  }

  // Apply filters
  if (type) query.type = type;
  if (categoryLevel1) query.categoryLevel1 = categoryLevel1;
  if (categoryLevel2) query.categoryLevel2 = categoryLevel2;
  if (categoryLevel3) query.categoryLevel3 = categoryLevel3;
  if (user) query.user = user;
  
  // Enhancement filters
  if (nardeban === 'true') {
    query.isNardeban = true;
    query.nardebanExpiresAt = { $gt: new Date() };
  }
  
  if (special === 'true') {
    query.isSpecial = true;
    query.specialExpiresAt = { $gt: new Date() };
  }
  
  if (featured === 'true') {
    query.isFeatured = true;
    query.featuredUntil = { $gt: new Date() };
  }
  
  // Location filters
  if (province) {
    const locationQuery = {
      $or: [
        { province, city: city || { $exists: true } },
        { deliveryProvince: province, deliveryCity: city || { $exists: true } }
      ]
    };
    
    // If type is specified, use specific field
    if (type === 'sell') {
      delete locationQuery.$or;
      locationQuery.province = province;
      if (city) locationQuery.city = city;
    } else if (type === 'buy') {
      delete locationQuery.$or;
      locationQuery.deliveryProvince = province;
      if (city) locationQuery.deliveryCity = city;
    }
    
    Object.assign(query, locationQuery);
  }

  // Price filters
  if (minPrice || maxPrice) {
    const priceQuery = {
      $or: []
    };
    
    if (type === 'sell' || !type) {
      priceQuery.$or.push({
        $and: [
          { type: 'sell' },
          {
            $or: [
              { 
                $and: [
                  { minPricePerUnit: { $gte: Number(minPrice || 0) } },
                  { minPricePerUnit: { $lte: Number(maxPrice || 9999999999) } }
                ]
              },
              { 
                $and: [
                  { maxPricePerUnit: { $gte: Number(minPrice || 0) } },
                  { maxPricePerUnit: { $lte: Number(maxPrice || 9999999999) } }
                ]
              }
            ]
          }
        ]
      });
    }
    
    if (type === 'buy' || !type) {
      priceQuery.$or.push({
        $and: [
          { type: 'buy' },
          { 
            maxBudget: { 
              $gte: Number(minPrice || 0),
              $lte: Number(maxPrice || 9999999999)
            }
          }
        ]
      });
    }
    
    if (priceQuery.$or.length > 0) {
      Object.assign(query, priceQuery);
    }
  }

  // Text search
  if (search && search.length >= 2) {
    query.$text = { $search: search };
  }

  // Sort logic
  let sortOption = {};
  switch (sort) {
    case 'priority':
      // Complex priority: Nardeban > Special > Featured > Views > Date
      // We'll handle this in application logic
      sortOption = { 
        isNardeban: -1,
        nardebanExpiresAt: -1,
        isSpecial: -1,
        specialExpiresAt: -1,
        isFeatured: -1,
        'stats.views': -1,
        createdAt: -1 
      };
      break;
    case 'newest':
      sortOption = { createdAt: -1 };
      break;
    case 'cheapest':
      if (type === 'sell') {
        sortOption = { minPricePerUnit: 1 };
      } else if (type === 'buy') {
        sortOption = { maxBudget: 1 };
      } else {
        sortOption = { createdAt: -1 };
      }
      break;
    case 'expensive':
      if (type === 'sell') {
        sortOption = { maxPricePerUnit: -1 };
      } else if (type === 'buy') {
        sortOption = { maxBudget: -1 };
      } else {
        sortOption = { createdAt: -1 };
      }
      break;
    case 'ending':
      sortOption = { expiresAt: 1 };
      break;
    case 'popular':
      sortOption = { 'stats.views': -1, createdAt: -1 };
      break;
    default:
      sortOption = { createdAt: -1 };
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  // Get total count
  const total = await Post.countDocuments(query);

  // Get posts
  let posts = await Post.find(query)
    .sort(sortOption)
    .skip(skip)
    .limit(limitNum)
    .populate('user', 'firstName lastName profileImage scores verifications level producerVerificationStatus phone')
    .populate('categoryLevel1', 'name slug')
    .populate('categoryLevel2', 'name slug')
    .populate('categoryLevel3', 'name slug')
    .lean();

  const badgesByUser = await buildBadgesForUsers(posts.map((post) => post.user).filter(Boolean));
  posts = posts.map((post) => {
    if (!post.user) return post;
    return {
      ...post,
      user: {
        ...post.user,
        badges: badgesByUser[String(post.user._id)] || post.user.badges,
      },
    };
  });

  // For priority sort, we need to manually sort
  if (sort === 'priority') {
    posts.sort((a, b) => {
      // Calculate priority score
      const getScore = (post) => {
        let score = 0;
        const isNardebanActive = post.isNardeban && (!post.nardebanExpiresAt || new Date(post.nardebanExpiresAt) > new Date());
        const isSpecialActive = post.isSpecial && (!post.specialExpiresAt || new Date(post.specialExpiresAt) > new Date());
        
        if (isNardebanActive) score += 1000;
        if (isSpecialActive) score += 500;
        if (post.isFeatured) score += 100;
        
        // Add view score
        score += Math.min(post.stats?.views || 0, 100);
        
        // Recent posts get bonus
        const daysOld = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysOld < 1) score += 50;
        else if (daysOld < 3) score += 30;
        else if (daysOld < 7) score += 10;
        
        return score;
      };
      
      return getScore(b) - getScore(a);
    });
  }

  // Process posts for response
  const processedPosts = posts.map(post => {
    const postObj = { ...post };
    
    // Add display price
    postObj.displayPrice = post.type === 'sell' 
      ? (post.minPricePerUnit === post.maxPricePerUnit 
          ? `${post.minPricePerUnit?.toLocaleString()} ریال`
          : `${post.minPricePerUnit?.toLocaleString()} - ${post.maxPricePerUnit?.toLocaleString()} ریال`)
      : (post.maxBudget ? `تا ${post.maxBudget.toLocaleString()} ریال` : 'توافقی');
    
    // Calculate remaining days
    const remainingMs = new Date(post.expiresAt) - new Date();
    postObj.remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
    
    // Add enhancement status
    postObj.isNardebanActive = post.isNardeban && (!post.nardebanExpiresAt || new Date(post.nardebanExpiresAt) > new Date());
    postObj.isSpecialActive = post.isSpecial && (!post.specialExpiresAt || new Date(post.specialExpiresAt) > new Date());
    
    // For buy posts, handle contact access
    if (post.type === 'buy' && req.user) {
      postObj.requiresContactAccess = post.user._id.toString() !== req.user._id.toString();
      
      if (postObj.requiresContactAccess) {
        // Remove phone from user object for privacy
        if (postObj.user && postObj.user.phone) {
          delete postObj.user.phone;
        }
      }
    }
    
    // For non-authenticated users viewing buy posts
    if (post.type === 'buy' && !req.user && post.user && post.user.phone) {
      delete post.user.phone;
      postObj.requiresLoginForContact = true;
    }
    
    return postObj;
  });

  return response.paginated(res, processedPosts, {
    total,
    page: parseInt(page),
    limit: limitNum,
    pages: Math.ceil(total / limitNum)
  });
});


// @desc    Get single sell post by slug
// @route   GET /api/posts/slug/:slug
// @access  Public/Private
exports.getPostBySlug = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug })
    .populate(postBasePopulate);

  if (!post) {
    return response.notFound(res, 'آگهی یافت نشد');
  }

  if (post.type !== 'sell') {
    return response.error(res, 'صفحه جزئیات فقط برای آگهی فروش در دسترس است', 404);
  }

  if (post.status !== 'active' || post.isExpired()) {
    if (!req.user || req.user._id.toString() !== post.user._id.toString()) {
      return response.error(res, 'آگهی یافت نشد یا غیرفعال است', 404);
    }
  }

  if (!req.user || req.user._id.toString() !== post.user._id.toString()) {
    await post.incrementViews();
  }

  const postObj = await buildPostResponseObject(post, req);

  return response.success(res, { post: postObj });
});
// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public/Private
exports.getPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate('user', 'firstName lastName profileImage scores verifications level producerVerificationStatus phone email')
    .populate('categoryLevel1', 'name slug')
    .populate('categoryLevel2', 'name slug')
    .populate('categoryLevel3', 'name slug');

  if (!post) {
    return response.notFound(res, 'آگهی یافت نشد');
  }

  // Check if post is active and not expired
  if (post.status !== 'active' || post.isExpired()) {
    if (req.user?._id.toString() !== post.user._id.toString()) {
      return response.error(res, 'آگهی یافت نشد یا غیرفعال است', 404);
    }
  }

  // Increment view count (if not the owner)
  if (!req.user || req.user._id.toString() !== post.user._id.toString()) {
    await post.incrementViews();
  }

  // Prepare response
  const postObj = post.toObject();
  if (postObj.user) {
    postObj.user.badges = await buildBadgesForUser(postObj.user);
  }
  
  // Add display price
  postObj.displayPrice = post.type === 'sell' 
    ? (post.minPricePerUnit === post.maxPricePerUnit 
        ? `${post.minPricePerUnit?.toLocaleString()} ریال`
        : `${post.minPricePerUnit?.toLocaleString()} - ${post.maxPricePerUnit?.toLocaleString()} ریال`)
    : (post.maxBudget ? `تا ${post.maxBudget.toLocaleString()} ریال` : 'توافقی');
  
  // Calculate remaining days
  const remainingMs = new Date(post.expiresAt) - new Date();
  postObj.remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  
  // Add enhancement status
  postObj.isNardebanActive = post.isNardebanActive;
  postObj.isSpecialActive = post.isSpecialActive;

  // Handle contact access for buy posts
  if (post.type === 'buy') {
    if (req.user && post.user._id.toString() !== req.user._id.toString()) {
      // Check quota
      const accessInfo = await subscriptionService.canAccessContact(req.user._id);
      postObj.canAccessContact = accessInfo.canAccess;
      postObj.remainingQuota = accessInfo.remaining;
      postObj.requiresContactAccess = true;
      
      // Remove phone if not accessible
      if (postObj.user && !accessInfo.canAccess) {
        delete postObj.user.phone;
        delete postObj.user.email;
      }
    } else if (!req.user) {
      // Non-authenticated user
      postObj.requiresLoginForContact = true;
      if (postObj.user) {
        delete postObj.user.phone;
        delete postObj.user.email;
      }
    }
  }

  return response.success(res, { post: postObj });
});

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
exports.updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return response.notFound(res, 'آگهی یافت نشد');
  }

  if (post.user.toString() !== req.user._id.toString()) {
    return response.forbidden(res, 'شما مجاز به ویرایش این آگهی نیستید');
  }

  const {
    title, description, keywords,
    minPricePerUnit, maxPricePerUnit, availableQuantity,
    minOrder, hasDiscount, discountPercentage, discountUntil,
    additionalRequirements, expiresAt,
    status, // For publishing drafts
    province, city, address,
    deliveryProvince, deliveryCity, deliveryAddress
  } = req.body;

  // Handle publishing draft
  if (status === 'active' && post.status === 'draft') {
    // Validate required fields based on type
    if (post.type === 'sell') {
      const requiredFields = [
        post.productName, post.brand,
        post.province, post.city, post.unit, post.availableQuantity,
        post.minOrder, post.minPricePerUnit, post.maxPricePerUnit
      ];
      
      if (requiredFields.some(field => !field)) {
        return response.error(res, 'همه فیلدهای الزامی برای آگهی فروش باید پر شوند', 400);
      }
      
      // Check subscription limits
      const canCreate = await subscriptionService.checkLimits(req.user._id);
      if (!canCreate.hasActiveSubscription) {
        return response.error(res, 'برای ایجاد آگهی نیاز به اشتراک فعال دارید', 403);
      }
      if (canCreate.limits.sellPosts.remaining === 0) {
        return response.error(res, 'سهمیه آگهی فروش شما به پایان رسیده است', 403);
      }
      
      // Use quota
      await subscriptionService.useSellPostQuota(req.user._id);
      
      // Update category post counts
      await Promise.all([
        Category.findByIdAndUpdate(post.categoryLevel1, { $inc: { postsCount: 1 } }),
        Category.findByIdAndUpdate(post.categoryLevel2, { $inc: { postsCount: 1 } }),
        Category.findByIdAndUpdate(post.categoryLevel3, { $inc: { postsCount: 1 } })
      ]);
    }
  }

  // Update allowed fields
  const updates = {};
  const allowedFields = [
    'title', 'description', 'keywords',
    'minPricePerUnit', 'maxPricePerUnit', 'availableQuantity',
    'minOrder', 'hasDiscount', 'discountPercentage', 'discountUntil',
    'additionalRequirements', 'expiresAt', 'status',
    'province', 'city', 'address',
    'deliveryProvince', 'deliveryCity', 'deliveryAddress'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const updatedPost = await Post.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  )
    .populate('user', 'firstName lastName profileImage')
    .populate('categoryLevel1', 'name slug')
    .populate('categoryLevel2', 'name slug')
    .populate('categoryLevel3', 'name slug');

  return response.success(res, { post: updatedPost }, 'آگهی با موفقیت به‌روزرسانی شد');
});

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return response.notFound(res, 'آگهی یافت نشد');
  }

  if (post.user.toString() !== req.user._id.toString()) {
    return response.forbidden(res, 'شما مجاز به حذف این آگهی نیستید');
  }

  post.status = 'deleted';
  await post.save();

  // Update category post counts if post was active
  if (post.status === 'active') {
    await Promise.all([
      Category.findByIdAndUpdate(post.categoryLevel1, { $inc: { postsCount: -1 } }),
      Category.findByIdAndUpdate(post.categoryLevel2, { $inc: { postsCount: -1 } }),
      Category.findByIdAndUpdate(post.categoryLevel3, { $inc: { postsCount: -1 } })
    ]);
  }

  return response.success(res, null, 'آگهی با موفقیت حذف شد');
});

// @desc    Search posts
// @route   GET /api/posts/search
// @access  Public
exports.searchPosts = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20, type, categoryLevel3, province, city } = req.query;

  if (!q || q.length < 2) {
    return response.error(res, 'عبارت جستجو باید حداقل ۲ کاراکتر باشد', 400);
  }

  const query = {
    status: 'active',
    expiresAt: { $gt: new Date() },
    $text: { $search: q }
  };

  if (type) query.type = type;
  if (categoryLevel3) query.categoryLevel3 = categoryLevel3;
  
  // Location filter
  if (province) {
    query.$or = [
      { province, city: city || { $exists: true } },
      { deliveryProvince: province, deliveryCity: city || { $exists: true } }
    ];
  }

  const total = await Post.countDocuments(query);
  const posts = await Post.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('user', 'firstName lastName profileImage')
    .populate('categoryLevel3', 'name slug')
    .lean();

  return response.paginated(res, posts, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / limit)
  });
});

// @desc    Get posts by category
// @route   GET /api/posts/category/:categoryId
// @access  Public
exports.getPostsByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const { page = 1, limit = 20, type, level = 3 } = req.query;

  // Build query based on category level
  let categoryField = 'categoryLevel3';
  if (level == 1) categoryField = 'categoryLevel1';
  else if (level == 2) categoryField = 'categoryLevel2';

  const query = {
    status: 'active',
    expiresAt: { $gt: new Date() },
    [categoryField]: categoryId
  };

  if (type) query.type = type;

  const total = await Post.countDocuments(query);
  const posts = await Post.find(query)
    .sort({ 
      isNardeban: -1,
      nardebanExpiresAt: -1,
      isSpecial: -1,
      specialExpiresAt: -1,
      createdAt: -1 
    })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('user', 'firstName lastName profileImage')
    .populate('categoryLevel1', 'name slug')
    .populate('categoryLevel2', 'name slug')
    .populate('categoryLevel3', 'name slug')
    .lean();

  return response.paginated(res, posts, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / limit)
  });
});

// @desc    Get user's posts
// @route   GET /api/posts/user/:userId
// @access  Public/Private
exports.getUserPosts = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20, type, status } = req.query;

  const query = { user: userId };
  
  // Non-owners can only see active posts
  if (req.user?._id.toString() !== userId) {
    query.status = 'active';
    query.expiresAt = { $gt: new Date() };
  } else if (status) {
    query.status = status;
  }

  if (type) query.type = type;

  const total = await Post.countDocuments(query);
  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('categoryLevel1', 'name slug')
    .populate('categoryLevel2', 'name slug')
    .populate('categoryLevel3', 'name slug')
    .lean();

  return response.paginated(res, posts, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / limit)
  });
});

// @desc    Get my posts
// @route   GET /api/posts/my
// @access  Private (requires authentication)
exports.getMyPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, status } = req.query;

  const query = { user: req.user._id };
  if (type) query.type = type;
  if (status) query.status = status;

  const total = await Post.countDocuments(query);
  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('categoryLevel1', 'name slug')
    .populate('categoryLevel2', 'name slug')
    .populate('categoryLevel3', 'name slug')
    .lean();

  return response.paginated(res, posts, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / limit)
  });
});

// @desc    Get contact details for a post (uses quota)
// @route   GET /api/posts/:id/contact-details
// @access  Private
// In postController.js - Fix getContactDetails method

// @desc    Get contact details for a post (uses quota)
// @route   GET /api/posts/:id/contact-details
// @access  Private
// @desc    Get contact details for a post (uses quota)
// @route   GET /api/posts/:id/contact-details
// @access  Private
// @desc    Get contact details for a post (uses quota - FIRST TIME ONLY)
// @route   GET /api/posts/:id/contact-details
// @access  Private
exports.getContactDetails = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate('user', 'phone firstName lastName profileImage level verifications email')
    .lean();

  if (!post) {
    return response.notFound(res, 'آگهی یافت نشد');
  }

  // Check if user owns the post
  if (post.user._id.toString() === req.user._id.toString()) {
    return response.success(res, {
      contactDetails: {
        phone: post.user.phone,
        fullName: `${post.user.firstName} ${post.user.lastName}`,
        email: post.user.email,
        userLevel: post.user.level,
        verifications: post.user.verifications
      },
      usedQuota: false,
      isOwner: true
    });
  }

  // Check if user has already accessed this post's contact details
  const alreadyAccessed = post.contactAccessHistory?.some(
    access => access.user.toString() === req.user._id.toString()
  );

  // If already accessed, return contact details without using quota
  if (alreadyAccessed) {
    return response.success(res, {
      contactDetails: {
        phone: post.user.phone,
        fullName: `${post.user.firstName} ${post.user.lastName}`,
        email: post.user.email,
        userLevel: post.user.level,
        verifications: post.user.verifications
      },
      usedQuota: false,
      alreadyAccessed: true
    });
  }

  // For buy posts, use contact access quota (FIRST TIME ONLY)
  if (post.type === 'buy') {
    try {
      // First check quota
      const accessInfo = await subscriptionService.canAccessContact(req.user._id);
      
      if (!accessInfo.canAccess) {
        return response.error(res, 'سهمیه دسترسی به اطلاعات تماس شما به پایان رسیده است', 403, {
          requiresAccess: true,
          remaining: accessInfo.remaining,
          canPurchaseExtra: true,
          pricePerContact: 100000 // 10,000 Toman
        });
      }
      
      // Use quota (only for first access)
      await subscriptionService.useContactAccess(req.user._id);
      
      // Get updated quota info
      const updatedInfo = await subscriptionService.canAccessContact(req.user._id);
      
      // Record the access in post history
      await Post.findByIdAndUpdate(
        post._id,
        {
          $push: {
            contactAccessHistory: {
              user: req.user._id,
              accessedAt: new Date(),
              quotaUsed: true
            }
          },
          $inc: { 'stats.contactViews': 1 }
        }
      );
      
      return response.success(res, {
        contactDetails: {
          phone: post.user.phone,
          fullName: `${post.user.firstName} ${post.user.lastName}`,
          email: post.user.email,
          userLevel: post.user.level,
          verifications: post.user.verifications
        },
        usedQuota: true,
        remainingQuota: updatedInfo.remaining,
        quotaInfo: updatedInfo
      });
      
    } catch (error) {
      return response.error(res, error.message, 403, {
        requiresAccess: true,
        remaining: 0,
        canPurchaseExtra: true,
        pricePerContact: 100000
      });
    }
  }

  // For sell posts, return contact without using quota
  // But still record the access
  await Post.findByIdAndUpdate(
    post._id,
    {
      $push: {
        contactAccessHistory: {
          user: req.user._id,
          accessedAt: new Date(),
          quotaUsed: false
        }
      },
      $inc: { 'stats.contactViews': 1 }
    }
  );

  return response.success(res, {
    contactDetails: {
      phone: post.user.phone,
      fullName: `${post.user.firstName} ${post.user.lastName}`,
      email: post.user.email,
      userLevel: post.user.level,
      verifications: post.user.verifications
    },
    usedQuota: false
  });
});

// @desc    Upload post images
// @route   POST /api/posts/:id/images
// @access  Private
exports.uploadImages = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return response.notFound(res, 'آگهی یافت نشد');
  }

  if (post.user.toString() !== req.user._id.toString()) {
    return response.forbidden(res, 'شما مجاز به ویرایش این آگهی نیستید');
  }

  if (!req.files || req.files.length === 0) {
    return response.error(res, 'تصاویر الزامی است', 400);
  }

  // Limit to 8 images total
  if (post.productImages.length + req.files.length > 8) {
    return response.error(res, 'حداکثر ۸ تصویر می‌توانید آپلود کنید', 400);
  }

  const results = await fileUploadService.uploadPostImages(req.files);

  const images = results.map((result, index) => ({
    url: result.url,
    publicId: result.publicId,
    type: req.body.imageType || 'product',
    caption: req.body.caption || '',
    isPrimary: post.productImages.length === 0 && index === 0
  }));

  post.productImages.push(...images);
  await post.save();

  return response.success(res, { images: post.productImages }, 'تصاویر با موفقیت آپلود شدند');
});

// @desc    Set primary image
// @route   PUT /api/posts/:id/images/primary
// @access  Private
exports.setPrimaryImage = asyncHandler(async (req, res) => {
  const { imageIndex } = req.body;
  const post = await Post.findById(req.params.id);

  if (!post) {
    return response.notFound(res, 'آگهی یافت نشد');
  }

  if (post.user.toString() !== req.user._id.toString()) {
    return response.forbidden(res, 'شما مجاز به ویرایش این آگهی نیستید');
  }

  if (imageIndex < 0 || imageIndex >= post.productImages.length) {
    return response.error(res, 'شماره تصویر نامعتبر است', 400);
  }

  await post.setPrimaryImage(imageIndex);

  return response.success(res, { images: post.productImages }, 'تصویر اصلی با موفقیت تنظیم شد');
});

// @desc    Delete image
// @route   DELETE /api/posts/:id/images/:imageIndex
// @access  Private
exports.deleteImage = asyncHandler(async (req, res) => {
  const { imageIndex } = req.params;
  const post = await Post.findById(req.params.id);

  if (!post) {
    return response.notFound(res, 'آگهی یافت نشد');
  }

  if (post.user.toString() !== req.user._id.toString()) {
    return response.forbidden(res, 'شما مجاز به ویرایش این آگهی نیستید');
  }

  const index = parseInt(imageIndex);
  if (isNaN(index) || index < 0 || index >= post.productImages.length) {
    return response.error(res, 'شماره تصویر نامعتبر است', 400);
  }

  const imageToDelete = post.productImages[index];
  
  // Delete from Cloudinary
  try {
    await fileUploadService.deleteImages([imageToDelete.publicId]);
  } catch (error) {
    logger.error('Failed to delete image from Cloudinary:', error);
  }

  // Remove from array
  post.productImages.splice(index, 1);
  
  // If we deleted the primary image and there are other images, set first as primary
  if (imageToDelete.isPrimary && post.productImages.length > 0) {
    post.productImages[0].isPrimary = true;
  }
  
  await post.save();

  return response.success(res, { images: post.productImages }, 'تصویر با موفقیت حذف شد');
});

// @desc    Activate nardeban for post
// @route   POST /api/posts/:id/nardeban
// @access  Private
// @desc    Activate nardeban for post
// @route   POST /api/posts/:id/nardeban
// @access  Private
exports.activateNardeban = asyncHandler(async (req, res) => {
  const { duration = 24 } = req.body; // hours
  const post = await Post.findById(req.params.id);

  if (!post) {
    return response.notFound(res, 'آگهی یافت نشد');
  }

  if (post.user.toString() !== req.user._id.toString()) {
    return response.forbidden(res, 'شما مجاز به این عملیات نیستید');
  }

  if (post.status !== 'active') {
    return response.error(res, 'آگهی باید فعال باشد', 400);
  }

  if (post.isNardebanActive) {
    return response.error(res, 'آگهی قبلاً نردبان شده است', 400);
  }

  // Check wallet balance
  const wallet = await Wallet.getOrCreateWallet(req.user._id);
  const price = NARDEBAN_PRICE;
  
  if (!wallet.hasSufficientBalance(price, 'IRR')) {
    return response.error(res, 'موجودی کیف پول کافی نیست', 400);
  }

  // Process payment
  await wallet.withdraw(price, 'IRR');

  // Create transaction record using the new method
  const transaction = await Transaction.createPostEnhancement(
    req.user._id,
    wallet._id,
    price,
    post._id,
    `فعال‌سازی نردبان برای آگهی: ${post.title}`
  );

  // Update transaction with balance after
  const balance = wallet.getBalance('IRR');
  transaction.balanceAfter = balance.available;
  await transaction.save();

  // Activate nardeban
  await post.activateNardeban(duration, {
    transactionId: transaction._id,
    paidAt: new Date()
  });

  return response.success(res, { 
    post,
    transaction,
    price,
    duration,
    newBalance: balance.available
  }, 'آگهی با موفقیت نردبان شد');
});

// @desc    Activate special for post
// @route   POST /api/posts/:id/special
// @access  Private
exports.activateSpecial = asyncHandler(async (req, res) => {
  const { duration = 168 } = req.body; // 7 days in hours
  const post = await Post.findById(req.params.id);

  if (!post) {
    return response.notFound(res, 'آگهی یافت نشد');
  }

  if (post.user.toString() !== req.user._id.toString()) {
    return response.forbidden(res, 'شما مجاز به این عملیات نیستید');
  }

  if (post.status !== 'active') {
    return response.error(res, 'آگهی باید فعال باشد', 400);
  }

  if (post.isSpecialActive) {
    return response.error(res, 'آگهی قبلاً ویژه شده است', 400);
  }

  // Check wallet balance
  const wallet = await Wallet.getOrCreateWallet(req.user._id);
  const price = SPECIAL_PRICE;
  
  if (!wallet.hasSufficientBalance(price, 'IRR')) {
    return response.error(res, 'موجودی کیف پول کافی نیست', 400);
  }

  // Process payment
  await wallet.withdraw(price, 'IRR');

  // Create transaction record using the new method
  const transaction = await Transaction.createPostEnhancement(
    req.user._id,
    wallet._id,
    price,
    post._id,
    `فعال‌سازی ویژه برای آگهی: ${post.title}`
  );

  // Update transaction with balance after
  const balance = wallet.getBalance('IRR');
  transaction.balanceAfter = balance.available;
  await transaction.save();

  // Activate special
  await post.activateSpecial(duration, {
    transactionId: transaction._id,
    paidAt: new Date()
  });

  return response.success(res, { 
    post,
    transaction,
    price,
    duration,
    newBalance: balance.available
  }, 'آگهی با موفقیت ویژه شد');
});

// @desc    Activate special for post
// @route   POST /api/posts/:id/special
// @access  Private
exports.activateSpecial = asyncHandler(async (req, res) => {
  const { duration = 168 } = req.body; // 7 days in hours
  const post = await Post.findById(req.params.id);

  if (!post) {
    return response.notFound(res, 'آگهی یافت نشد');
  }

  if (post.user.toString() !== req.user._id.toString()) {
    return response.forbidden(res, 'شما مجاز به این عملیات نیستید');
  }

  if (post.status !== 'active') {
    return response.error(res, 'آگهی باید فعال باشد', 400);
  }

  if (post.isSpecialActive) {
    return response.error(res, 'آگهی قبلاً ویژه شده است', 400);
  }

  // Check wallet balance
  const wallet = await Wallet.getOrCreateWallet(req.user._id);
  const price = SPECIAL_PRICE;
  
  if (!wallet.hasSufficientBalance(price, 'IRR')) {
    return response.error(res, 'موجودی کیف پول کافی نیست', 400);
  }

  // Process payment
  await wallet.withdraw(price, 'IRR');

  // Create transaction record
  const transaction = await Transaction.create({
    user: req.user._id,
    wallet: wallet._id,
    type: 'post_enhancement',
    amount: -price,
    currency: 'IRR',
    description: `فعال‌سازی ویژه برای آگهی: ${post.title}`,
    status: 'completed',
    relatedPost: post._id,
    completedAt: new Date()
  });

  // Activate special
  await post.activateSpecial(duration, {
    transactionId: transaction._id,
    paidAt: new Date()
  });

  return response.success(res, { 
    post,
    transaction,
    price,
    duration 
  }, 'آگهی با موفقیت ویژه شد');
});

// @desc    Get nardeban posts
// @route   GET /api/posts/nardeban/list
// @access  Public
exports.getNardebanPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type } = req.query;

  const query = {
    isNardeban: true,
    nardebanExpiresAt: { $gt: new Date() },
    status: 'active',
    expiresAt: { $gt: new Date() }
  };

  if (type) query.type = type;

  const total = await Post.countDocuments(query);
  const posts = await Post.find(query)
    .sort({ nardebanExpiresAt: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('user', 'firstName lastName profileImage')
    .populate('categoryLevel3', 'name slug')
    .lean();

  return response.paginated(res, posts, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / limit)
  });
});

// @desc    Get special posts
// @route   GET /api/posts/special/list
// @access  Public
exports.getSpecialPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type } = req.query;

  const query = {
    isSpecial: true,
    specialExpiresAt: { $gt: new Date() },
    status: 'active',
    expiresAt: { $gt: new Date() }
  };

  if (type) query.type = type;

  const total = await Post.countDocuments(query);
  const posts = await Post.find(query)
    .sort({ specialExpiresAt: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('user', 'firstName lastName profileImage')
    .populate('categoryLevel3', 'name slug')
    .lean();

  return response.paginated(res, posts, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / limit)
  });
});

// @desc    Get featured posts
// @route   GET /api/posts/featured/list
// @access  Public
exports.getFeaturedPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type } = req.query;

  const query = {
    isFeatured: true,
    featuredUntil: { $gt: new Date() },
    status: 'active',
    expiresAt: { $gt: new Date() }
  };

  if (type) query.type = type;

  const total = await Post.countDocuments(query);
  const posts = await Post.find(query)
    .sort({ featuredUntil: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('user', 'firstName lastName profileImage')
    .populate('categoryLevel3', 'name slug')
    .lean();

  return response.paginated(res, posts, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / limit)
  });
});

// @desc    Extend post expiry
// @route   POST /api/posts/:id/extend
// @access  Private
exports.extendPost = asyncHandler(async (req, res) => {
  const { days = 30 } = req.body;
  const post = await Post.findById(req.params.id);

  if (!post) {
    return response.notFound(res, 'آگهی یافت نشد');
  }

  if (post.user.toString() !== req.user._id.toString()) {
    return response.forbidden(res, 'شما مجاز به این عملیات نیستید');
  }

  if (post.status !== 'active') {
    return response.error(res, 'آگهی باید فعال باشد', 400);
  }

  // Calculate new expiry date
  const currentExpiry = post.expiresAt || new Date();
  const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);
  
  // Update post
  post.expiresAt = newExpiry;
  await post.save();

  return response.success(res, { 
    post,
    newExpiry,
    extendedDays: days 
  }, 'مدت آگهی با موفقیت تمدید شد');
});

// @desc    Mark post as sold
// @route   POST /api/posts/:id/sold
// @access  Private
exports.markAsSold = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return response.notFound(res, 'آگهی یافت نشد');
  }

  if (post.user.toString() !== req.user._id.toString()) {
    return response.forbidden(res, 'شما مجاز به این عملیات نیستید');
  }

  if (post.type !== 'sell') {
    return response.error(res, 'فقط آگهی‌های فروش قابل علامت‌گذاری به عنوان فروخته شده هستند', 400);
  }

  post.status = 'sold';
  await post.save();

  // Update user stats
  await mongoose.model('User').findByIdAndUpdate(req.user._id, {
    $inc: { 'stats.successfulDeals': 1 }
  });

  return response.success(res, { post }, 'آگهی با موفقیت به عنوان فروخته شده علامت‌گذاری شد');
});

// @desc    Get post statistics
// @route   GET /api/posts/:id/stats
// @access  Private
exports.getPostStats = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).lean();

  if (!post) {
    return response.notFound(res, 'آگهی یافت نشد');
  }

  if (post.user.toString() !== req.user._id.toString()) {
    return response.forbidden(res, 'شما مجاز به مشاهده آمار این آگهی نیستید');
  }

  return response.success(res, { 
    stats: post.stats,
    createdAt: post.createdAt,
    expiresAt: post.expiresAt,
    isNardebanActive: post.isNardeban && (!post.nardebanExpiresAt || new Date(post.nardebanExpiresAt) > new Date()),
    isSpecialActive: post.isSpecial && (!post.specialExpiresAt || new Date(post.specialExpiresAt) > new Date())
  });
});

// Add this method to postController.js:

// @desc    Get post chat status and info
// @route   GET /api/posts/:id/chat-status
// @access  Private
// @desc    Get post chat status and info
// @route   GET /api/posts/:id/chat-status
// @access  Private
exports.getPostChatStatus = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate('user', 'firstName lastName profileImage');
  
  if (!post) {
    return response.notFound(res, 'آگهی یافت نشد');
  }
  
  // Check if user is post owner
  const isOwner = post.user._id.toString() === req.user._id.toString();
  
  // Check existing chats
  const existingChats = await Chat.find({
    post: post._id,
    'participants.user': req.user._id,
    status: 'active'
  })
    .populate('participants.user', 'firstName lastName profileImage')
    .sort({ updatedAt: -1 })
    .limit(3);
  
  // For buy posts, check contact access
  let canStartChat = false;
  let requiresContactAccess = false;
  let hasAccessedContacts = false;
  
  if (isOwner) {
    canStartChat = false; // Can't chat with yourself
  } else if (post.type === 'buy') {
    hasAccessedContacts = post.hasUserAccessedContacts(req.user._id);
    canStartChat = hasAccessedContacts;
    requiresContactAccess = !hasAccessedContacts;
  } else {
    // Sell posts - always allowed
    canStartChat = true;
    hasAccessedContacts = true; // Not required for sell posts
  }
  
  return response.success(res, {
    post: {
      _id: post._id,
      title: post.title,
      type: post.type,
      owner: {
        _id: post.user._id,
        name: `${post.user.firstName} ${post.user.lastName}`,
        profileImage: post.user.profileImage
      }
    },
    isOwner,
    canStartChat,
    requiresContactAccess,
    hasAccessedContacts,
    existingChats: existingChats.map(chat => ({
      _id: chat._id,
      participants: chat.participants,
      lastActivity: chat.updatedAt,
      unreadCount: chat.participants.find(p => 
        p.user._id.toString() === req.user._id.toString()
      )?.unreadCount || 0
    })),
    chatStats: post.chatStats || {
      totalChats: 0,
      activeChats: 0,
      unreadMessages: 0
    }
  });
});
// @desc    Get similar posts
// @route   GET /api/posts/:id/similar
// @access  Public
exports.getSimilarPosts = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return response.notFound(res, 'آگهی یافت نشد');
  }

  const { limit = 6 } = req.query;

  // Find similar posts by category and keywords
  const query = {
    _id: { $ne: post._id },
    status: 'active',
    expiresAt: { $gt: new Date() },
    $or: [
      { categoryLevel3: post.categoryLevel3 },
      { keywords: { $in: post.keywords.slice(0, 3) } }
    ]
  };

  if (post.type) {
    query.type = post.type;
  }

  const similarPosts = await Post.find(query)
    .sort({ 
      isNardeban: -1,
      isSpecial: -1,
      'stats.views': -1,
      createdAt: -1 
    })
    .limit(parseInt(limit))
    .populate('user', 'firstName lastName profileImage')
    .populate('categoryLevel3', 'name slug')
    .lean();

  // Process display price
  const processedPosts = similarPosts.map(p => ({
    ...p,
    displayPrice: p.type === 'sell' 
      ? (p.minPricePerUnit === p.maxPricePerUnit 
          ? `${p.minPricePerUnit?.toLocaleString()} ریال`
          : `${p.minPricePerUnit?.toLocaleString()} - ${p.maxPricePerUnit?.toLocaleString()} ریال`)
      : (p.maxBudget ? `تا ${p.maxBudget.toLocaleString()} ریال` : 'توافقی')
  }));

  return response.success(res, { posts: processedPosts });
})




