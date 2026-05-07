







const mongoose = require('mongoose');
// const express = require('express')

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'نام دسته‌بندی الزامی است'],
    trim: true,
    maxlength: [100, 'نام دسته‌بندی نمی‌تواند بیش از ۱۰۰ کاراکتر باشد']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 3,
    index: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  order: {
    type: Number,
    default: 0
  },
  postsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ level: 1, isActive: 1 });

// Virtual for children
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Generate slug before saving
categorySchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('name')) {
    const slugify = require('slugify');
    const baseSlug = slugify(this.name, { 
      lower: true, 
      strict: true,
      locale: 'fa',
      remove: /[*+~.()'"!:@]/g
    });
    let slug = baseSlug;
    let counter = 1;
    
    while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

// Static method to get category tree
categorySchema.statics.getCategoryTree = async function() {
  const categories = await this.find({ isActive: true }).sort('order').lean();
  
  const buildTree = (parentId = null, currentLevel = 1) => {
    return categories
      .filter(cat => {
        if (parentId === null) {
          return cat.level === 1;
        }
        return String(cat.parent) === String(parentId);
      })
      .map(cat => ({
        _id: cat._id,
        name: cat.name,
        slug: cat.slug,
        level: cat.level,
        order: cat.order,
        postsCount: cat.postsCount,
        children: buildTree(cat._id, cat.level + 1)
      }))
      .sort((a, b) => a.order - b.order);
  };
  
  return buildTree(null, 1);
};

// Static method to get all parent IDs
categorySchema.statics.getParentChain = async function(categoryId) {
  const chain = [];
  let currentId = categoryId;
  
  while (currentId) {
    const category = await this.findById(currentId);
    if (!category) break;
    
    chain.unshift({
      _id: category._id,
      name: category.name,
      slug: category.slug,
      level: category.level
    });
    
    if (!category.parent) break;
    currentId = category.parent;
  }
  
  return chain;
};

// Static method to seed sample data
categorySchema.statics.seedSampleData = async function() {
  const count = await this.countDocuments();
  if (count > 0) return; // Don't seed if data exists

  console.log('Seeding sample categories...');
  
  // Level 1: Root categories
  const rootCategories = [
    { name: 'مواد غذایی', level: 1, order: 1 },
    { name: 'الکترونیک', level: 1, order: 2 },
    { name: 'پوشاک', level: 1, order: 3 },
    { name: 'لوازم خانگی', level: 1, order: 4 },
    { name: 'خودرو', level: 1, order: 5 }
  ];

  const createdRoots = await this.create(rootCategories);
  
  // Level 2: Subcategories
  const subcategories = [];
  
  // Subcategories for مواد غذایی
  subcategories.push(
    { name: 'خشکبار', level: 2, parent: createdRoots[0]._id, order: 1 },
    { name: 'حبوبات', level: 2, parent: createdRoots[0]._id, order: 2 }
  );
  
  // Subcategories for الکترونیک
  subcategories.push(
    { name: 'موبایل', level: 2, parent: createdRoots[1]._id, order: 1 },
    { name: 'لپ تاپ', level: 2, parent: createdRoots[1]._id, order: 2 }
  );
  
  // Subcategories for پوشاک
  subcategories.push(
    { name: 'مردانه', level: 2, parent: createdRoots[2]._id, order: 1 },
    { name: 'زنانه', level: 2, parent: createdRoots[2]._id, order: 2 }
  );
  
  // Subcategories for لوازم خانگی
  subcategories.push(
    { name: 'آشپزخانه', level: 2, parent: createdRoots[3]._id, order: 1 },
    { name: 'نظافت', level: 2, parent: createdRoots[3]._id, order: 2 }
  );
  
  // Subcategories for خودرو
  subcategories.push(
    { name: 'سواری', level: 2, parent: createdRoots[4]._id, order: 1 },
    { name: 'سنگین', level: 2, parent: createdRoots[4]._id, order: 2 }
  );

  const createdSubs = await this.create(subcategories);
  
  // Level 3: Final categories
  const finalCategories = [];
  
  // For خشکبار
  finalCategories.push(
    { name: 'پسته', level: 3, parent: createdSubs[0]._id, order: 1 },
    { name: 'بادام', level: 3, parent: createdSubs[0]._id, order: 2 }
  );
  
  // For حبوبات
  finalCategories.push(
    { name: 'عدس', level: 3, parent: createdSubs[1]._id, order: 1 },
    { name: 'لوبیا', level: 3, parent: createdSubs[1]._id, order: 2 }
  );
  
  // For موبایل
  finalCategories.push(
    { name: 'آیفون', level: 3, parent: createdSubs[2]._id, order: 1 },
    { name: 'سامسونگ', level: 3, parent: createdSubs[2]._id, order: 2 }
  );
  
  // For لپ تاپ
  finalCategories.push(
    { name: 'ایسر', level: 3, parent: createdSubs[3]._id, order: 1 },
    { name: 'ایسوس', level: 3, parent: createdSubs[3]._id, order: 2 }
  );
  
  // For مردانه
  finalCategories.push(
    { name: 'کفش', level: 3, parent: createdSubs[4]._id, order: 1 },
    { name: 'شلوار', level: 3, parent: createdSubs[4]._id, order: 2 }
  );
  
  // For زنانه
  finalCategories.push(
    { name: 'روسری', level: 3, parent: createdSubs[5]._id, order: 1 },
    { name: 'لباس', level: 3, parent: createdSubs[5]._id, order: 2 }
  );
  
  // For آشپزخانه
  finalCategories.push(
    { name: 'ماشین ظرفشویی', level: 3, parent: createdSubs[6]._id, order: 1 },
    { name: 'مایکروویو', level: 3, parent: createdSubs[6]._id, order: 2 }
  );
  
  // For نظافت
  finalCategories.push(
    { name: 'جاروبرقی', level: 3, parent: createdSubs[7]._id, order: 1 },
    { name: 'ماشین لباسشویی', level: 3, parent: createdSubs[7]._id, order: 2 }
  );
  
  // For سواری
  finalCategories.push(
    { name: 'پراید', level: 3, parent: createdSubs[8]._id, order: 1 },
    { name: 'پژو', level: 3, parent: createdSubs[8]._id, order: 2 }
  );
  
  // For سنگین
  finalCategories.push(
    { name: 'کامیون', level: 3, parent: createdSubs[9]._id, order: 1 },
    { name: 'اتوبوس', level: 3, parent: createdSubs[9]._id, order: 2 }
  );

  await this.create(finalCategories);
  
  console.log('Sample categories seeded successfully!');
  return this.getCategoryTree();
};

module.exports = mongoose.model('Category', categorySchema);