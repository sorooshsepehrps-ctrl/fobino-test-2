const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roles');

// Public routes
router.get('/', categoryController.getCategories);
router.get('/level/:level', categoryController.getCategoriesByLevel);
router.get('/:id', categoryController.getCategory);
router.get('/:id/parents', categoryController.getParentChain);
router.get('/:id/subcategories', categoryController.getSubcategories);

// Admin routes
router.post('/', protect, isAdmin, categoryController.createCategory);
router.put('/:id', protect, isAdmin, categoryController.updateCategory);
router.delete('/:id', protect, isAdmin, categoryController.deleteCategory);
router.post('/seed', protect, isAdmin, categoryController.seedCategories);

// Internal routes (for post operations)
router.post('/:id/increment', protect, categoryController.incrementPostsCount);
router.post('/:id/decrement', protect, categoryController.decrementPostsCount);

module.exports = router;