  const mongoose = require('mongoose');

  const addToCartSchema = new mongoose.Schema(
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true, min: 1 },
      selected_color: { type: String, required: true },
      selected_size: { type: String, required: true },
      total_price: { type: Number, required: true },
      is_active: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
  );

  module.exports = mongoose.model('AddToCart', addToCartSchema);
