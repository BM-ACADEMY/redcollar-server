// const mongoose = require('mongoose');

// const orderSchema = new mongoose.Schema(
//   {
//     user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     products: [
//       {
//         product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
//         quantity: { type: Number, required: true },
//         price: { type: Number, required: true },
//         discount: { type: Number, default: 0 }, 
//       },
//     ],
//     total_amount: { type: Number, required: true },
//     order_status: { type: String, enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
//     payment_status: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
//     delivery_address: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
//     payment_method: { type: String, enum: ['COD', 'Credit/Debit Card', 'Net Banking', 'Wallet'], required: true },
//     shipping_date: { type: Date },
//     delivery_date: { type: Date },
//     createdAt: { type: Date, default: Date.now },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model('Order', orderSchema);


// const mongoose = require('mongoose');

// const orderSchema = new mongoose.Schema(
//   {
//     user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     products: [
//       {
//         product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
//         quantity: { type: Number, required: true },
//         price: { type: Number, required: true },
//         discount: { type: Number, default: 0 }, 
//       },
//     ],
//     total_amount: { type: Number, required: true },
//     order_status: { type: String, enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
//     delivery_address: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
//     shipping_date: { type: Date },
//     delivery_date: { type: Date },
    
//     // Payment details embedded
//     payment: {
//       payment_method: { type: String, required: true },
//       amount_paid: { type: Number, required: true },
//       payment_status: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
//       payment_date: { type: Date, default: Date.now },
//     },

//     createdAt: { type: Date, default: Date.now },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model('Order', orderSchema);
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, required: true },
        total_price: { type: Number, required: true },
        discount: { type: Number, default: 0 },
      },
    ],
    total_amount: { type: Number, required: true },
    order_status: {
      type: String,
      enum: ["Pending","Confirmed", "Shipped", "Delivered", "Cancelled","PreparedforDelivery"],
      default: "Pending",
    },
    delivery_address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },
    shipping_date: { type: Date },
    delivery_date: { type: Date },

    // Payment details
    payment: {
      payment_method: { type: String, required: true },
      amount_paid: { type: Number, required: true },
      payment_status: {
        type: String,
        enum: ["Pending", "Completed", "Failed"],
        default: "Pending",
      },
      payment_date: { type: Date, default: Date.now },
      razorpay_order_id: { type: String, required: true },
      razorpay_payment_id: { type: String },
      razorpay_signature: { type: String },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
