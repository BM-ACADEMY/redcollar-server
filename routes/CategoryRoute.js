const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/CategoryController');

// ✅ Routes for Category API
router.get('/fetch-all-categories', categoryController.getAllCategories);
router.get('/fetch-category-by-id/:id', categoryController.getCategoryById);
router.post('/create-categories', categoryController.createCategory);
router.put('/update-categories/:id', categoryController.updateCategory);
router.delete('/delete-categories/:id', categoryController.deleteCategory);
router.get('/fetch-category-image/:imageName', categoryController.getCategoryImage);


module.exports = router;
