const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/ReviewController');

// Routes for reviews
router.get('/reviews', reviewController.getAllReviews);
router.get('/reviewsById/:id', reviewController.getReviewById); 
router.get('/reviews-by-product-id/:id', reviewController.getReviewsByProductId); 
router.post('/create-reviews', reviewController.createReview); 
router.put('/update-reviews/:id', reviewController.updateReview); 
router.delete('/delete-reviews/:id', reviewController.deleteReview); 
router.get('/fetch-images/:imageName', reviewController.getReviewImage); 

module.exports = router;
