const mongoose = require("mongoose");

const LikedProductSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    likedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("LikedProduct", LikedProductSchema);