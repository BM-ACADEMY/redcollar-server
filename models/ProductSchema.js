const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }, 
    type: { type: mongoose.Schema.Types.ObjectId, ref: 'Type', required: true }, 
    brand: { type: String, required: true },
    original_price: { type: Number, required: true },
    discount_percentage: { type: Number, default: 0 },
    color: [{ type: String, required: true }],
    sizes: [{ type: String, required: true }],
    stock_quantity: { type: Number, required: true, min: 0 },
    images: [{ type: String, required: true }],
    gender: { type: String, enum: ['Male', 'Female', 'Unisex'], required: true },
    age_category: { type: String, enum: ['Adults', 'Kids', 'Baby'], required: true },
    similar_products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], 
    rating: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
    deliveryOption:{type:String},
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
