const express = require('express');
const router = express.Router();
const productController = require('../controllers/ProductController');
const multer = require('multer');

// ✅ Use Multer with memory storage (No local storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });


// ✅ Routes for Product API
router.get('/fetch-all-products', productController.getAllProducts);
router.get('/fetch-product-by-category/:categoryId', productController.getProductsByCategory);
router.get('/search-products', productController.getFilteredProducts);
router.get('/search-products-for-searchpage', productController.getAllProductsForSearchPage);
router.get('/fetch-product-new-arrival', productController.getNewArrivals);
router.get('/fetch-product-by-id/:id', productController.getProductById);
router.get('/fetch-product-by-type-id/:typeId', productController.getProductsByTypeId);
// ✅ Create a new product with multiple image uploads
router.post('/create-products', upload.array('images', 5), productController.createProduct);

// ✅ Update product details and replace images if new ones are uploaded
router.put('/update-products/:id', upload.array('images', 5), productController.updateProduct);

// ✅ Delete a product (also deletes images from Cloudinary)
router.delete('/delete-products/:id', productController.deleteProduct);

module.exports = router;
