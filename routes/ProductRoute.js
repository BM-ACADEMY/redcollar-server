const express = require('express');
const router = express.Router();
const productController = require('../controllers/ProductController');

// ✅ Routes for Product API
router.get('/fetch-all-products', productController.getAllProducts); // Get all products
router.get('/fetch-product-by-category/:categoryId', productController.getProductsByCategory); // Get product by ID
router.get('/search-products', productController.getFilteredProducts);
router.get('/search-products-for-searchpage', productController.getAllProductsForSearchPage);
router.get('/fetch-product-new-araivel', productController.getNewArrivals); // Get product by ID
router.get('/fetch-product-by-id/:id', productController.getProductById);
router.post('/create-products', productController.createProduct); // Create a new product
router.put('/update-products/:id', productController.updateProduct); // Update product details
router.delete('/delete-products/:id', productController.deleteProduct); // Delete a product
router.get('/fetch-product-image/:imageName', productController.getProductImage); // Get product image by name

module.exports = router;
