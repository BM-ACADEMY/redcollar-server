const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/CategoryController');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
// ✅ Routes for Category API
router.get('/fetch-all-categories', categoryController.getAllCategories);
router.get('/fetch-all-categories-for-admin', categoryController.getAllCategoriesforAdmin);

router.get('/fetch-category-by-id/:id', categoryController.getCategoryById);
router.post('/create-categories', upload.single('images'), categoryController.createCategory);
router.put('/update-categories/:id', upload.single('images'), categoryController.updateCategory);;
router.delete('/delete-categories/:id', categoryController.deleteCategory);
router.get('/fetch-category-image/:imageName', categoryController.getCategoryImage);


module.exports = router;
