const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    address_line1: { type: String, required: true },
    address_line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postal_code: { type: String, required: true },
    country: { type: String, required: true },
    phone_number: { type: String, required: true },
    save_address:{type:Boolean,default:false},
    is_default: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Address', addressSchema);
