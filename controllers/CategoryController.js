const Category = require('../models/CategorySchema');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define the upload directory for category images
const uploadDir = path.join(__dirname, '..', 'uploads', 'categories');

// Create the 'categories' folder if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up multer storage for image upload in 'uploads/categories'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Save image to 'uploads/categories' folder
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extname = path.extname(file.originalname); // Get file extension
    cb(null, 'category-' + uniqueSuffix + extname); // Create unique filename
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']; // Allowed file types
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true); // Accept the file
    } else {
      cb(new Error('Only .jpg, .jpeg, .png files are allowed!'), false); // Reject the file
    }
  },
});

// ✅ Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({
      message:"fetch category successfully",
      data:categories
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error });
  }
};

// ✅ Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching category', error });
  }
};

// ✅ Add a new category
exports.createCategory = async (req, res) => {
  // Use multer middleware to handle image upload
  upload.single('images')(req, res, async (err) => { // single image upload
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: 'Invalid file format' });
    }

    try {
      const { name, is_active } = req.body;
      const image = req.file ? `/uploads/categories/${req.file.filename}` : ''; // Image URL or path

      // Create a new category
      const newCategory = new Category({
        name,
        images: image, // Store the image URL in the 'images' field
        is_active,
      });

      await newCategory.save();
      res.status(201).json({ message: 'Category added successfully', category: newCategory });
    } catch (error) {
      res.status(500).json({ message: 'Error adding category', error });
    }
  });
};


// ✅ Update a category
exports.updateCategory = async (req, res) => {
  // Use multer middleware to handle image upload
  upload.single('images')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: 'Invalid file format' });
    }

    try {
      const updatedData = { ...req.body };

      // Handle image if uploaded
      if (req.file) {
        updatedData.images = `/uploads/categories/${req.file.filename}`;
      }

      const updatedCategory = await Category.findByIdAndUpdate(req.params.id, updatedData, { new: true });

      if (!updatedCategory) {
        return res.status(404).json({ message: 'Category not found' });
      }

      res.status(200).json({ message: 'Category updated successfully', category: updatedCategory });
    } catch (error) {
      res.status(500).json({ message: 'Error updating category', error });
    }
  });
};


// ✅ Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    if (!deletedCategory) return res.status(404).json({ message: 'Category not found' });

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category', error });
  }
};


exports.getCategoryImage = (req, res) => {
  const imageName = req.params.imageName;
  const imagePath = path.join(__dirname, '..', 'uploads', 'categories', imageName);

  res.sendFile(imagePath, (err) => {
    if (err) {
      res.status(404).json({ message: 'Image not found' });
    }
  });
};
