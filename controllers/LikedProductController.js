// const LikedProduct = require("../models/LikedProductSchema");

// // Like a product
// exports.likeProduct = async (req, res) => {
//     try {
//         const { userId, productId } = req.body;

//         // Check if the product is already liked
//         const existingLike = await LikedProduct.findOne({ userId, productId });
//         if (existingLike) {
//             return res.status(400).json({ message: "Product already liked" });
//         }

//         const likedProduct = new LikedProduct({ userId, productId });
//         await likedProduct.save();

//         res.status(201).json({ message: "Product liked successfully", likedProduct });
//     } catch (error) {
//         res.status(500).json({ error: "Internal server error" });
//     }
// };

// // Get all liked products for a user
// exports.getLikedProducts = async (req, res) => {
//     try {
//         const likedProducts = await LikedProduct.find({ userId: req.params.userId }).populate("productId");
//         res.status(200).json(likedProducts);
//     } catch (error) {
//         res.status(500).json({ error: "Internal server error" });
//     }
// };



const LikedProduct = require("../models/LikedProductSchema");
const mongoose = require("mongoose");

// Get all liked products for a user
exports.getLikedProducts = async (req, res) => {
    try {
        const { userId } = req.params;
        const likedProducts = await LikedProduct.find({ userId }).populate("productId");
        res.status(200).json({
            message:"fetched favorite successfully",
            data:likedProducts
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add a product to liked list

exports.addLikedProduct = async (req, res) => {
    try {
        const { userId, productId } = req.body;
        console.log(req.body);
        
        // Convert userId and productId to ObjectId
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const productObjectId = new mongoose.Types.ObjectId(productId);

        // Check if the product is already liked by the user
        const existingLikedProduct = await LikedProduct.findOne({ userId: userObjectId, productId: productObjectId });

        if (existingLikedProduct) {
            return res.status(200).json({ message: "Product is already in the liked list" });
        }

        // Add new liked product
        const likedProduct = new LikedProduct({ userId: userObjectId, productId: productObjectId });
        await likedProduct.save();

        res.status(201).json(likedProduct);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Update liked product (not commonly needed, but included if necessary)
exports.updateLikedProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedProduct = await LikedProduct.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedProduct) return res.status(404).json({ message: "Liked product not found" });
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Remove a product from liked list
exports.removeLikedProduct = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        // Convert IDs to ObjectId
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const productObjectId = new mongoose.Types.ObjectId(productId);

        // Remove specific product from user's favorites
        const deletedProduct = await LikedProduct.findOneAndDelete({ userId: userObjectId, productId: productObjectId });

        if (!deletedProduct) {
            return res.status(404).json({ message: "Product not found in favorites" });
        }

        res.status(200).json({ message: "Removed from favorites" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }}
