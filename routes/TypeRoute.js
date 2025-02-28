const express = require('express');
const router = express.Router();
const typeController = require('../controllers/TypeController');
const multer = require('multer');

// ✅ Use Multer with memory storage (No local storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 🔹 Routes for types
router.get('/get-all-types', typeController.getAllTypes);
router.get('/get-all-by-id/:id', typeController.getTypeById);
router.post('/create-type', upload.single('image'), typeController.createType);
router.put('/update-type/:id', upload.single('image'), typeController.updateType);
router.delete('/delete-type/:id', typeController.deleteType);

module.exports = router;
