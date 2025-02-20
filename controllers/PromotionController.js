const Promo = require('../models/PromotionsSchema'); // Import Promo model
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const moment = require('moment');
// Define the upload directory inside 'uploads/promotions'
const uploadDir = path.join(__dirname, '..', 'uploads', 'promotions');

// Create the 'promotions' folder if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up multer storage for image upload in 'uploads/promotions'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Save image to 'uploads/promotions' folder
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extname = path.extname(file.originalname); // Get file extension
    cb(null, file.fieldname + '-' + uniqueSuffix + extname); // Create unique filename
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
  fileFilter: (req, file, cb) => {
    // Accept all file types by always calling cb with true
    cb(null, true);
  }
});


// Get all promotions
exports.getAllPromotions = async (req, res) => {
  try {
    const promotions = await Promo.find();
    res.status(200).json({
      message:"fetch promotions successfully",
      data:promotions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a promotion by ID
exports.getPromotionById = async (req, res) => {
  try {
    const promotion = await Promo.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }
    res.status(200).json(promotion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new promotion
// Create a promotion
exports.createPromotion = async (req, res) => {
  upload.single('Image')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: 'Invalid file format' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { title, message } = req.body;
      console.log(req.body);
      
      const imageUrl = `/uploads/promotions/${req.file.filename}`; // Generate the image URL

      // Save the new promotion with message
      const newPromotion = new Promo({ title, Image: imageUrl, message });
      await newPromotion.save();

      res.status(201).json({
        message: 'Promotion created successfully',
        promotion: newPromotion,
        image: imageUrl
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
};

// Update a promotion by ID
exports.updatePromotion = async (req, res) => {
  const { title, message } = req.body; // Include message field

  // Handle image upload in update
  upload.single('Image')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: 'Invalid file format' });
    }

    try {
      let updatedPromotionData = { title, message }; // Include message field in update data
      console.log(req.body);
      
      // If a new image file is uploaded, include the new image URL
      if (req.file) {
        const newImageUrl = `/uploads/promotions/${req.file.filename}`;
        updatedPromotionData.Image = newImageUrl;
      }

      const updatedPromotion = await Promo.findByIdAndUpdate(
        req.params.id,
        updatedPromotionData,
        { new: true, runValidators: true }
      );

      if (!updatedPromotion) {
        return res.status(404).json({ message: 'Promotion not found' });
      }

      res.status(200).json(updatedPromotion);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
};


// Delete a promotion by ID
exports.deletePromotion = async (req, res) => {
  try {
    const deletedPromotion = await Promo.findByIdAndDelete(req.params.id);
    if (!deletedPromotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }
    res.status(200).json({ message: 'Promotion deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Serve the uploaded image
exports.getImage = (req, res) => {
  const imageName = req.params.imageName;
  const imagePath = path.join(__dirname, '..', 'uploads', 'promotions', imageName); // Adjust path to promotions folder

  res.sendFile(imagePath, (err) => {
    if (err) {
      res.status(404).json({ message: 'Image not found' });
    }
  });
};


exports.getUnreadPromotions = async (req, res) => {
  try {
    const promotions = await Promo.find({ unread: true }).sort({ timestamp: -1 });
    res.json(promotions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark promotion as read
exports.updatereadPromotions = async (req, res) => {
  try {
    await Promo.findByIdAndUpdate(req.params.id, { unread: false });
    res.json({ message: 'Promotion marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getTodaysMessages = async (req, res) => {
  try {
    // Get the current date and set the start and end of today
    const startOfDay = moment().startOf('day').toDate();
    const endOfDay = moment().endOf('day').toDate();

    // Find promotions created today and sort by time in descending order
    const todaysPromotions = await Promo.find({
      time: { $gte: startOfDay, $lte: endOfDay }
    })
      .sort({ time: -1 }); // Sort in descending order
console.log(todaysPromotions);

    res.status(200).json({
      success: true,
      promotions: todaysPromotions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch today\'s promotions',
    });
  }
};