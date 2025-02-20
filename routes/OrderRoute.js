// const express = require('express');
// const router = express.Router();
// const orderController = require('../controllers/OrderController');

// // ✅ Routes for Order API
// router.get('/fetch-all-orders', orderController.getAllOrders);
// router.get('/fetch-order-by-id/:id', orderController.getOrderById);
// router.post('/create-orders', orderController.createOrder);
// router.put('/update-orders/:id', orderController.updateOrder);
// router.delete('/delete-orders/:id', orderController.deleteOrder);

// module.exports = router;


const express = require('express');
const router = express.Router();
const orderController = require('../controllers/OrderController');

// Create a new order
router.post('/create-order', orderController.createOrder);
router.post('/verify-payment', orderController.verifyPayment);
// Get all orders
router.get('/fetch-all-orders/', orderController.getAllOrders);

// Get an order by ID
router.get('/fetch-order-by-id/:id', orderController.getOrderById);

router.get('/fetch-order-by-userId/:userId', orderController.getOrderByUserId);

router.get('/fetch-order-by-for-tracking', orderController.getOrderByEmailAndId);

// Update order status
router.put('/update-order-status/:id/status', orderController.updateOrderStatus);


router.put('/update-order-status-admin-page/:orderId', orderController.updateOrderStatusAdminpage);

// Update payment status
router.put('/update-payment-status/:id/payment', orderController.updatePaymentStatus);

// Delete an order
router.delete('/delete-order/:id', orderController.deleteOrder);

module.exports = router;
