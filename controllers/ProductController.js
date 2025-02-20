const Product = require('../models/ProductSchema');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Category=require('../models/CategorySchema');
const express = require('express');



// Define the upload directory for product images
const uploadDir = path.join(__dirname, '..', 'uploads', 'products');

// Create the 'products' folder if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up multer storage for image upload in 'uploads/products'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Save image to 'uploads/products' folder
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
    cb(null, true); // Accept all file types
  }
});


// Function to handle the filtered product search
exports.getFilteredProducts = async (req, res) => {
  try {
    const {
      categoryId,
      gender,
      color,
      size,
      priceRange,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    let filter = {};

    if (categoryId) filter.category = categoryId;
    if (gender) filter.gender = gender;
    if (color) filter.color = { $in: color.split(',') };
    if (size) filter.sizes = { $in: size.split(',') };
    if (priceRange) {
      if (priceRange === 'under_40000') filter.original_price = { $lt: 40000 };
      if (priceRange === 'above_50000') filter.original_price = { $gt: 50000 };
    }

    let sortCondition = {};
    if (sort) {
      const [field, order] = sort.split('_');
      if (['price', 'name', 'rating'].includes(field) && ['asc', 'desc'].includes(order)) {
        sortCondition[field] = order === 'asc' ? 1 : -1;
      }
    }

    const products = await Product.find(filter)
      .sort(sortCondition)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Handle null values for deliveryOption or other fields
    const updatedProducts = products.map(product => ({
      ...product.toObject(),
      deliveryOption: product.deliveryOption || "No Delivery Option",  // Fallback value for null
    }));

    const totalProducts = await Product.countDocuments(filter);
    const hasMore = totalProducts > page * limit;
console.log(products,'asdas');

    res.status(200).json({ products: updatedProducts, hasMore });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};





// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products', error: err.message });
  }
};
exports.getAllProductsForSearchPage = async (req, res) => {
  try {
    // Aggregate products to get distinct values for each category, brand, color, size, gender, and age category
    const products = await Product.aggregate([
      {
        $group: {
          _id: null, // Group everything together
          categories: { $addToSet: "$category" },
          brands: { $addToSet: "$brand" },
          colors: { $addToSet: "$color" },
          sizes: { $addToSet: "$sizes" },
          genders: { $addToSet: "$gender" },
          ageCategories: { $addToSet: "$age_category" }
        }
      }
    ]);

    // If there are no products, return empty arrays for each field
    if (products.length === 0) {
      return res.status(200).json({
        categories: [],
        brands: [],
        colors: [],
        sizes: [],
        genders: [],
        ageCategories: []
      });
    }

    // Get the grouped values from the aggregation
    let { categories, brands, colors, sizes, genders, ageCategories } = products[0];

    // Remove duplicates from color and size arrays
    colors = [...new Set(colors.flat())]; // Flatten the array and remove duplicates
    sizes = [...new Set(sizes.flat())];   // Flatten the array and remove duplicates

    // Map categories to the desired structure of { _id, name }
    categories = categories.map(category => ({
      _id: category, 
      name: category  // Adjust this if you need to get the category name from a different source
    }));

    // Return the grouped values
    res.status(200).json({
      categories,
      brands,
      colors,
      sizes,
      genders,
      ageCategories
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching product data', error: err.message });
  }
};


// Get a product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching product', error: err.message });
  }
};


exports.getNewArrivals = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const products = await Product.find({
      createdAt: { $gte: thirtyDaysAgo },
      is_active: true 
    })
    .populate('category', 'name') 
    .sort({ createdAt: -1 }) 
    .limit(10); 

    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching new arrivals', error: err.message });
  }
};

exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params; // Extract categoryId from request parameters
    const products = await Product.find({ category: categoryId });
     console.log(req.params);

    if (products.length === 0) {
      return res.status(404).json({ message: 'No products found for this category' });
    }

    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products', error: err.message });
  }
};


// Create a new product with image handling
exports.createProduct = async (req, res) => {
  upload.array('images')(req, res, async (err) => { 
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: 'Invalid file format' });
    }

    try {
      const { name, description, category, brand, original_price, discount_percentage, color, sizes, stock_quantity, gender, age_category, similar_products, rating, is_active ,deliveryOption} = req.body;
      console.log(req.body);
      

      // Ensure color and sizes are arrays (in case they come as strings, we'll convert them to arrays)
      const colorArray = Array.isArray(color) ? color : JSON.parse(color);
      const sizeArray = Array.isArray(sizes) ? sizes : JSON.parse(sizes);

      // Generate image URLs for the uploaded files
      const images = req.files ? req.files.map(file => `/uploads/products/${file.filename}`) : [];

      const newProduct = new Product({
        name,
        description,
        category,
        brand,
        original_price,
        discount_percentage,
        color: colorArray, // Ensure it's an array
        sizes: sizeArray,   // Ensure it's an array
        stock_quantity,
        images,
        gender,
        age_category,
        similar_products,
        rating,
        is_active,
        deliveryOption
      });

      await newProduct.save();
      res.status(201).json(newProduct);
    } catch (err) {
      res.status(500).json({ message: 'Error creating product', error: err.message });
    }
  });
};

// Update a product with image handling
exports.updateProduct = async (req, res) => {
  upload.array('images')(req, res, async (err) => { // Allow up to 5 image uploads
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: 'Invalid file format' });
    }

    try {
      const updatedData = { ...req.body };

      // Handle color and sizes arrays if they are stringified
      if (updatedData.color && typeof updatedData.color === 'string') {
        updatedData.color = JSON.parse(updatedData.color); // Convert stringified array to actual array
      }
      if (updatedData.sizes && typeof updatedData.sizes === 'string') {
        updatedData.sizes = JSON.parse(updatedData.sizes); // Convert stringified array to actual array
      }

      // Handle images if they are uploaded
      if (req.files) {
        updatedData.images = req.files.map(file => `/uploads/products/${file.filename}`);
      }

      const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updatedData, { new: true });

      if (!updatedProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }

      res.status(200).json(updatedProduct);
    } catch (err) {
      res.status(500).json({ message: 'Error updating product', error: err.message });
    }
  });
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
};

// Serve the uploaded product image
exports.getProductImage = (req, res) => {
  const imageName = req.params.imageName;
  const imagePath = path.join(__dirname, '..', 'uploads', 'products', imageName);

  res.sendFile(imagePath, (err) => {
    if (err) {
      res.status(404).json({ message: 'Image not found' });
    }
  });
};
