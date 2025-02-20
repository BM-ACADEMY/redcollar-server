const express = require("express");
const router = express.Router();
const likedProductController = require("../controllers/LikedProductController");

// Get all liked products for a specific user
router.get("/fetch-favorite-products-by-userId/:userId", likedProductController.getLikedProducts);

// Add a product to liked list
router.post("/create-favorite", likedProductController.addLikedProduct);

// Update liked product (optional)
router.put("/update-favorite/:id", likedProductController.updateLikedProduct);

// Remove a product from liked list
router.delete("/delete-favorite", likedProductController.removeLikedProduct);

module.exports = router;
