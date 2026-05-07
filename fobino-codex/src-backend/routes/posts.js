/* backend/src/routes/posts.js */
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { protect, optionalAuth } = require('../middleware/auth');
const { canCreateSellPost } = require('../middleware/subscription');
const { uploadMultipleImages } = require('../middleware/upload');
const { validate } = require('../middleware/validation');
const parseArrays = require('../middleware/parseArrays');
const {
  createPostValidator,
  updatePostValidator,
  postIdValidator,
  listPostsValidator,
  searchPostsValidator,
  nardebanValidator,
  specialValidator,
  extendPostValidator
} = require('../validators/postValidator');
const { searchLimiter } = require('../middleware/rateLimit');

// ==================== PUBLIC ROUTES ====================
router.get('/', optionalAuth, listPostsValidator, validate, postController.getPosts);
router.get('/search', searchLimiter, optionalAuth, searchPostsValidator, validate, postController.searchPosts);
router.get('/nardeban/list', optionalAuth, postController.getNardebanPosts);
router.get('/special/list', optionalAuth, postController.getSpecialPosts);
router.get('/featured/list', optionalAuth, postController.getFeaturedPosts);
router.get('/category/:categoryId', optionalAuth, postController.getPostsByCategory);
router.get('/user/:userId', optionalAuth, postController.getUserPosts);
router.get('/my', protect, postController.getMyPosts);

// IMPORTANT: slug route must be before /:id
router.get('/slug/:slug', optionalAuth, postController.getPostBySlug);

router.get('/:id', optionalAuth, postIdValidator, validate, postController.getPost);
router.get('/:id/similar', optionalAuth, postController.getSimilarPosts);

// ==================== PROTECTED ROUTES ====================
router.use(protect);

// ======== POST MANAGEMENT ========
router.post('/', uploadMultipleImages, parseArrays, canCreateSellPost, createPostValidator, validate, postController.createPost);
router.put('/:id', postIdValidator, updatePostValidator, validate, postController.updatePost);
router.delete('/:id', postIdValidator, validate, postController.deletePost);
router.post('/:id/extend', postIdValidator, extendPostValidator, validate, postController.extendPost);
router.post('/:id/sold', postIdValidator, postController.markAsSold);

// ======== IMAGE MANAGEMENT ========
router.post('/:id/images', uploadMultipleImages, postController.uploadImages);
router.put('/:id/images/primary', postController.setPrimaryImage);
router.delete('/:id/images/:imageIndex', postController.deleteImage);

// ======== POST ENHANCEMENTS ========
router.post('/:id/nardeban', postIdValidator, nardebanValidator, validate, postController.activateNardeban);
router.post('/:id/special', postIdValidator, specialValidator, validate, postController.activateSpecial);

// ======== CONTACT, STATS, AND CHAT ========
router.get('/:id/contact-details', postIdValidator, validate, postController.getContactDetails);
router.get('/:id/stats', postIdValidator, validate, postController.getPostStats);
router.get('/:id/chat-status', postIdValidator, validate, postController.getPostChatStatus);

module.exports = router;

// const express = require('express');
// const router = express.Router();
// const postController = require('../controllers/postController');
// const { protect, optionalAuth } = require('../middleware/auth');
// const { canCreateSellPost } = require('../middleware/subscription');
// const { uploadMultipleImages } = require('../middleware/upload');
// const { validate } = require('../middleware/validation');
// const { 
//   createPostValidator, 
//   updatePostValidator, 
//   postIdValidator, 
//   listPostsValidator, 
//   searchPostsValidator,
//   nardebanValidator,
//   specialValidator,
//   extendPostValidator
// } = require('../validators/postValidator');
// const { searchLimiter } = require('../middleware/rateLimit');

// // Public routes
// router.get('/', optionalAuth, listPostsValidator, validate, postController.getPosts);
// router.get('/search', searchLimiter, optionalAuth, searchPostsValidator, validate, postController.searchPosts);
// router.get('/nardeban/list', optionalAuth, postController.getNardebanPosts);
// router.get('/special/list', optionalAuth, postController.getSpecialPosts);
// router.get('/featured/list', optionalAuth, postController.getFeaturedPosts);
// router.get('/category/:categoryId', optionalAuth, postController.getPostsByCategory);
// router.get('/user/:userId', optionalAuth, postController.getUserPosts);
// router.get('/:id', optionalAuth, postIdValidator, validate, postController.getPost);
// router.get('/:id/similar', optionalAuth, postController.getSimilarPosts);

// // Protected routes
// router.use(protect);

// // Post management
// router.get('/me', postController.getMyPosts);
// router.post('/', canCreateSellPost, createPostValidator, validate, postController.createPost);
// router.put('/:id', postIdValidator, updatePostValidator, validate, postController.updatePost);
// router.delete('/:id', postIdValidator, validate, postController.deletePost);
// router.post('/:id/extend', postIdValidator, extendPostValidator, validate, postController.extendPost);
// router.post('/:id/sold', postIdValidator, postController.markAsSold);

// // Image management
// router.post('/:id/images', uploadMultipleImages, postController.uploadImages);
// router.put('/:id/images/primary', postController.setPrimaryImage);
// router.delete('/:id/images/:imageIndex', postController.deleteImage);

// // Post enhancements
// router.post('/:id/nardeban', postIdValidator, nardebanValidator, validate, postController.activateNardeban);
// router.post('/:id/special', postIdValidator, specialValidator, validate, postController.activateSpecial);

// // Contact and stats
// router.get('/:id/contact-details', postIdValidator, validate, postController.getContactDetails);
// router.get('/:id/stats', postIdValidator, validate, postController.getPostStats);

// module.exports = router;
