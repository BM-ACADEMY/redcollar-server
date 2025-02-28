const Review = require('../models/ReviewSchema'); // Import Review model
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
// const cloudinary = require('../utils/cloudinary');

// Define the upload directory for review images
// const uploadDir = path.join(__dirname, '..', 'uploads', 'reviews');

// // Create the 'reviews' folder if it doesn't exist
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// // Set up multer storage for image upload in 'uploads/reviews'
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadDir); // Save image to 'uploads/reviews' folder
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     const extname = path.extname(file.originalname); // Get file extension
//     cb(null, file.fieldname + '-' + uniqueSuffix + extname);
//   },
// });

// const upload = multer({ 
//   storage: storage,
//   limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
//   fileFilter: (req, file, cb) => {
//     console.log(`Uploaded file type: ${file.mimetype}`); // Log the file type
//     cb(null, true); // Accept all file types
//   }
// });


// Get all reviews for a product
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user')
      .populate('product');
    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reviews', error: err.message });
  }
};
exports.getReviewsByProductId = async (req, res) => {
  try {
    const { id } = req.params; // Product ID

    console.log('Product ID:', id);

    // Validate and convert ID to mongoose ObjectId
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(id);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    console.log('Converted Product ObjectId:', objectId);

    // Fetch reviews with selected fields only
    const reviews = await Review.find({ product: objectId })
      .populate('user', 'username') // Fetch only user name
      .select('comment images rating user'); // Select only required fields

    console.log('Fetched Reviews:', reviews);

    if (!reviews.length) {
      return res.status(404).json({ message: 'No reviews found for this product' });
    }

    // Format response
    const formattedReviews = reviews.map(review => ({
      comment: review.comment,
      images: review.images,
      userName: review.user ? review.user.username : 'Anonymous', // Handle cases where user might be null
      rating: review.rating
    }));

    res.status(200).json({
      message: 'Fetched reviews successfully',
      data: formattedReviews
    });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ message: 'Error fetching reviews', error: err.message });
  }
};
// Get a specific review by ID

exports.getReviewById = async (req, res) => {
  try {
    const id  = req.params.id;

    // Log the ID to check if it's being passed correctly
    console.log('Review ID:', id);

    // Convert ID into a mongoose ObjectId and handle invalid cases
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(id);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid review ID format' });
    }

    // Log the converted objectId to ensure it's a valid ObjectId
    console.log('Converted ObjectId:', objectId);

    // Fetch the review from the database by user ID
    const review = await Review.find({ user: objectId })
      .populate('user')
      .populate('product');

    // Log the review object to verify what was returned
    console.log('Fetched Review:', review);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Send the review data back to the client if found
    res.status(200).json({
      message:"fetch reviews successfully",
      data:review
    });
  } catch (err) {
    // Handle unexpected errors
    console.error('Error fetching review:', err);
    res.status(500).json({ message: 'Error fetching review', error: err.message });
  }
};
const cloudinary = require('../utils/cloudinary');
// Create a new review with image handling
exports.createReview = async (req, res) => {
  try {
    const { user, product, rating, comment } = req.body;
    let images = [];

    // 🔹 Ensure files exist before uploading
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: 'reviews' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result.secure_url);
            }
          ).end(file.buffer);
        })
      );
      images = await Promise.all(uploadPromises);
    }

    // 🔹 Create and save the review
    const newReview = new Review({ user, product, rating, comment, images });
    await newReview.save();

    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ message: 'Error creating review', error: error.message });
  }
};


// Update a review with image handling
exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    const { user, product, rating, comment } = req.body;
    let updatedFields = { user, product, rating, comment };

    // 🔹 If new images are uploaded, delete old ones and upload new ones
    if (req.files && req.files.length > 0) {
      try {
        // Delete old images from Cloudinary
        if (review.images && review.images.length > 0) {
          await Promise.all(
            review.images.map(async (imageUrl) => {
              try {
                const publicId = imageUrl.split('/').pop().split('.')[0]; // Extract last part correctly
                await cloudinary.uploader.destroy(publicId);
              } catch (error) {
                console.error('❌ Error deleting old image from Cloudinary:', error.message);
              }
            })
          );
        }

        // Upload new images to Cloudinary
        const uploadPromises = req.files.map((file) =>
          new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              { folder: 'reviews' },
              (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
              }
            ).end(file.buffer);
          })
        );
        updatedFields.images = await Promise.all(uploadPromises);
      } catch (error) {
        console.error('❌ Error uploading new images:', error.message);
        return res.status(500).json({ message: 'Error uploading images', error: error.message });
      }
    }

    // 🔹 Update review in the database
    const updatedReview = await Review.findByIdAndUpdate(req.params.id, updatedFields, {
      new: true,
      runValidators: true,
    });

    if (!updatedReview) {
      return res.status(500).json({ message: 'Failed to update review' });
    }

    res.status(200).json(updatedReview);
  } catch (error) {
    console.error('❌ Error updating review:', error.stack);
    res.status(500).json({ message: 'Error updating review', error: error.stack });
  }
};




// Delete a review
// Delete a review and remove images from Cloudinary
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    // 🔹 Delete images from Cloudinary
    if (review.images && review.images.length > 0) {
      await Promise.all(
        review.images.map(async (imageUrl) => {
          try {
            const publicId = imageUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
          } catch (error) {
            console.error('Error deleting image:', error.message);
          }
        })
      );
    }

    // 🔹 Delete the review from the database
    await Review.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
};



// Serve the uploaded image
exports.getReviewImage = (req, res) => {
  const imageName = req.params.imageName;
  const imagePath = path.join(__dirname, '..', 'uploads', 'reviews', imageName); // Adjust path to reviews folder

  res.sendFile(imagePath, (err) => {
    if (err) {
      res.status(404).json({ message: 'Image not found' });
    }
  });
};
