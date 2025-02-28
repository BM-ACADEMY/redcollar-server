const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/ReviewController');
const multer = require('multer');

// ✅ Use Multer with memory storage (No local storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 🔹 Routes for reviews
router.get('/reviews', reviewController.getAllReviews);
router.get('/reviewsById/:id', reviewController.getReviewById);
router.get('/reviews-by-product-id/:id', reviewController.getReviewsByProductId);
router.post('/create-reviews', upload.array('images'), reviewController.createReview);
router.put('/update-reviews/:id', upload.array('images'), reviewController.updateReview);
router.delete('/delete-reviews/:id', reviewController.deleteReview);

module.exports = router;
