const Category = require('../models/Category');
const { asyncHandler } = require('../middleware/errorHandler');
const response = require('../utils/responseFormatter');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res) => {
  const { tree = 'false', level, parent, isActive = 'true' } = req.query;
  
  // Return as tree
  if (tree === 'true') {
    const categories = await Category.getCategoryTree();
    return response.success(res, { categories });
  }
  
  // Build query
  const query = {};
  
  if (level) {
    query.level = parseInt(level);
  }
  
  if (parent) {
    if (parent === 'null') {
      query.parent = null;
    } else {
      query.parent = parent;
    }
  }
  
  if (isActive !== 'all') {
    query.isActive = isActive === 'true';
  }
  
  // Get categories
  const categories = await Category.find(query)
    .sort('order')
    .lean();
  
  return response.success(res, { categories });
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    return response.notFound(res, 'دسته‌بندی یافت نشد');
  }
  
  // Get parent chain
  const parentChain = await Category.getParentChain(req.params.id);
  
  return response.success(res, { 
    category: {
      ...category.toObject(),
      parentChain
    } 
  });
});

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = asyncHandler(async (req, res) => {
  const { name, level, parent = null, order = 0, isActive = true } = req.body;
  
  // Validate level
  if (level < 1 || level > 3) {
    return response.error(res, 'سطح دسته‌بندی باید بین ۱ تا ۳ باشد', 400);
  }
  
  // Validate parent for non-root categories
  if (level > 1 && !parent) {
    return response.error(res, 'دسته‌بندی سطح ۲ و ۳ نیازمند والد هستند', 400);
  }
  
  // For level 1, ensure parent is null
  if (level === 1 && parent) {
    return response.error(res, 'دسته‌بندی سطح ۱ نمی‌تواند والد داشته باشد', 400);
  }
  
  // Check parent exists if provided
  if (parent) {
    const parentCategory = await Category.findById(parent);
    if (!parentCategory) {
      return response.error(res, 'دسته‌بندی والد یافت نشد', 400);
    }
    
    // Validate level hierarchy
    if (parentCategory.level !== level - 1) {
      return response.error(res, `دسته‌بندی سطح ${level} باید والد سطح ${level - 1} داشته باشد`, 400);
    }
  }
  
  const category = await Category.create({
    name,
    level,
    parent,
    order,
    isActive
  });
  
  return response.created(res, { category }, 'دسته‌بندی با موفقیت ایجاد شد');
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = asyncHandler(async (req, res) => {
  const { name, order, isActive } = req.body;
  
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (order !== undefined) updates.order = order;
  if (isActive !== undefined) updates.isActive = isActive;
  
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  );
  
  if (!category) {
    return response.notFound(res, 'دسته‌بندی یافت نشد');
  }
  
  return response.success(res, { category }, 'دسته‌بندی با موفقیت به‌روزرسانی شد');
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    return response.notFound(res, 'دسته‌بندی یافت نشد');
  }
  
  // Check if category has children
  const children = await Category.find({ parent: category._id });
  if (children.length > 0) {
    return response.error(res, 'ابتدا زیردسته‌ها را حذف کنید', 400);
  }
  
  // Check if category has posts
  if (category.postsCount > 0) {
    return response.error(res, 'این دسته‌بندی دارای آگهی است و قابل حذف نیست', 400);
  }
  
  await category.deleteOne();
  
  return response.success(res, null, 'دسته‌بندی با موفقیت حذف شد');
});

// @desc    Get categories by level
// @route   GET /api/categories/level/:level
// @access  Public
exports.getCategoriesByLevel = asyncHandler(async (req, res) => {
  const { level } = req.params;
  const levelNum = parseInt(level);
  
  if (levelNum < 1 || levelNum > 3) {
    return response.error(res, 'سطح دسته‌بندی باید بین ۱ تا ۳ باشد', 400);
  }
  
  const categories = await Category.find({ 
    level: levelNum,
    isActive: true 
  }).sort('order');
  
  return response.success(res, { categories });
});

// @desc    Get parent categories chain
// @route   GET /api/categories/:id/parents
// @access  Public
exports.getParentChain = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    return response.notFound(res, 'دسته‌بندی یافت نشد');
  }
  
  const parentChain = await Category.getParentChain(req.params.id);
  
  return response.success(res, { parentChain });
});

// @desc    Seed sample categories
// @route   POST /api/categories/seed
// @access  Private/Admin
exports.seedCategories = asyncHandler(async (req, res) => {
  const categories = await Category.seedSampleData();
  return response.created(res, { categories }, 'دسته‌بندی‌های نمونه با موفقیت ایجاد شدند');
});

// @desc    Increment posts count
// @route   POST /api/categories/:id/increment
// @access  Private (Used internally)
exports.incrementPostsCount = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { $inc: { postsCount: 1 } },
    { new: true }
  );
  
  if (!category) {
    return response.notFound(res, 'دسته‌بندی یافت نشد');
  }
  
  // Also increment parent categories
  let currentId = category.parent;
  while (currentId) {
    await Category.findByIdAndUpdate(
      currentId,
      { $inc: { postsCount: 1 } }
    );
    
    const parentCat = await Category.findById(currentId);
    currentId = parentCat ? parentCat.parent : null;
  }
  
  return response.success(res, { category }, 'تعداد آگهی‌ها به‌روزرسانی شد');
});

// @desc    Decrement posts count
// @route   POST /api/categories/:id/decrement
// @access  Private (Used internally)
exports.decrementPostsCount = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { $inc: { postsCount: -1 } },
    { new: true }
  );
  
  if (!category) {
    return response.notFound(res, 'دسته‌بندی یافت نشد');
  }
  
  // Also decrement parent categories
  let currentId = category.parent;
  while (currentId) {
    await Category.findByIdAndUpdate(
      currentId,
      { $inc: { postsCount: -1 } }
    );
    
    const parentCat = await Category.findById(currentId);
    currentId = parentCat ? parentCat.parent : null;
  }
  
  return response.success(res, { category }, 'تعداد آگهی‌ها به‌روزرسانی شد');
});

// @desc    Get subcategories of a category
// @route   GET /api/categories/:id/subcategories
// @access  Public
exports.getSubcategories = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if parent category exists
  const parentCategory = await Category.findById(id);
  if (!parentCategory) {
    return response.notFound(res, 'دسته‌بندی والد یافت نشد');
  }
  
  // Get direct children (subcategories)
  const subcategories = await Category.find({ 
    parent: id,
    isActive: true 
  }).sort('order').lean();
  
  return response.success(res, { subcategories });
});