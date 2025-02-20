const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    payment_method: { type: String, enum: ['COD', 'Credit/Debit Card', 'Wallet', 'Net Banking'], required: true },
    amount_paid: { type: Number, required: true },
    payment_status: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
    payment_date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
