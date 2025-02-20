const Payment = require('../models/PaymentSchema');

// ✅ Get all payments
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().populate('order', 'total_amount order_status');
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payments', error });
  }
};

// ✅ Get payment by ID
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('order', 'total_amount order_status');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment', error });
  }
};

// ✅ Create a new payment
exports.createPayment = async (req, res) => {
  try {
    const { order, payment_method, amount_paid } = req.body;

    // Create new payment
    const newPayment = new Payment({
      order,
      payment_method,
      amount_paid,
      payment_status: 'Pending',
    });

    // Save payment to DB
    await newPayment.save();
    res.status(201).json({ message: 'Payment initiated successfully', payment: newPayment });
  } catch (error) {
    res.status(500).json({ message: 'Error processing payment', error });
  }
};

// ✅ Update payment status (Completed or Failed)
exports.updatePayment = async (req, res) => {
  try {
    const updatedPayment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedPayment) return res.status(404).json({ message: 'Payment not found' });

    res.status(200).json({ message: 'Payment updated successfully', payment: updatedPayment });
  } catch (error) {
    res.status(500).json({ message: 'Error updating payment', error });
  }
};

// ✅ Delete payment (If applicable)
exports.deletePayment = async (req, res) => {
  try {
    const deletedPayment = await Payment.findByIdAndDelete(req.params.id);
    if (!deletedPayment) return res.status(404).json({ message: 'Payment not found' });

    res.status(200).json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting payment', error });
  }
};
