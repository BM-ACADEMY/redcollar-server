const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/PaymentController');

// ✅ Routes for Payment API
router.get('/fetch-all-payments', paymentController.getAllPayments); 
router.get('/fetch-payment-by-id/:id', paymentController.getPaymentById); 
router.post('/create-payments', paymentController.createPayment); 
router.put('/update-payments/:id', paymentController.updatePayment); 
router.delete('/delete-payments/:id', paymentController.deletePayment); 

module.exports = router;
