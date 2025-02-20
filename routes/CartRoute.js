
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/CartController');

// Define routes
router.get('/fetch-all-cart/', cartController.getCartItems); // Get all cart items
router.get('/fetch-cart-by-user/:userId', cartController.getCartItemByUserId);
router.get('/fetch-cart-by-id/:id', cartController.getCartItemById); // Get cart item by ID
router.post('/create-cart/', cartController.addToCart); // Add item to cart
router.put('/update-cart/:id', cartController.updateCartItem); 
router.delete('/delete-cart/:id', cartController.deleteCartItem); 

module.exports = router;
