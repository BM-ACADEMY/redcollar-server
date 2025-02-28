const express = require('express');
const router = express.Router();
const promotionsController = require('../controllers/PromotionController');
const multer = require('multer');

// ✅ Use Multer with memory storage (No local storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Routes for Promotion API
router.get('/promotions-getAll', promotionsController.getAllPromotions);
router.get('/promotions-last-data', promotionsController.getLastPromotion);

router.get('/promotions-getById/:id', promotionsController.getPromotionById);
router.post('/promotions-create', upload.single('Image'), promotionsController.createPromotion);
router.put('/promotions-update/:id', upload.single('Image'), promotionsController.updatePromotion);
router.delete('/promotions-delete/:id', promotionsController.deletePromotion);
router.get('/notifications/todays', promotionsController.getTodaysMessages);
router.get('/unread-promotions', promotionsController.getUnreadPromotions);
router.put('/mark-as-read/:id', promotionsController.updatereadPromotions);

module.exports = router;
