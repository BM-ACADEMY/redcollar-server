// const Order = require('../models/OrderSchema');

// // ✅ Get all orders
// exports.getAllOrders = async (req, res) => {
//   try {
//     const orders = await Order.find().populate('user', 'name email').populate('products.product', 'name price');
//     res.status(200).json(orders);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching orders', error });
//   }
// };

// // ✅ Get order by ID
// exports.getOrderById = async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id)
//       .populate('user', 'name email')
//       .populate('products.product', 'name price');
    
//     if (!order) return res.status(404).json({ message: 'Order not found' });

//     res.status(200).json(order);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching order', error });
//   }
// };

// // ✅ Create a new order
// exports.createOrder = async (req, res) => {
//   try {
//     const newOrder = new Order(req.body);
//     await newOrder.save();
//     res.status(201).json({ message: 'Order placed successfully', order: newOrder });
//   } catch (error) {
//     res.status(500).json({ message: 'Error placing order', error });
//   }
// };

// // ✅ Update order (status, payment, etc.)
// exports.updateOrder = async (req, res) => {
//   try {
//     const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!updatedOrder) return res.status(404).json({ message: 'Order not found' });

//     res.status(200).json({ message: 'Order updated successfully', order: updatedOrder });
//   } catch (error) {
//     res.status(500).json({ message: 'Error updating order', error });
//   }
// };

// // ✅ Delete an order (Cancel)
// exports.deleteOrder = async (req, res) => {
//   try {
//     const deletedOrder = await Order.findByIdAndDelete(req.params.id);
//     if (!deletedOrder) return res.status(404).json({ message: 'Order not found' });

//     res.status(200).json({ message: 'Order cancelled successfully' });
//   } catch (error) {
//     res.status(500).json({ message: 'Error cancelling order', error });
//   }
// };


const Order = require('../models/OrderSchema');
const Razorpay = require("razorpay");
const User=require('../models/UsersSchema');
const crypto = require("crypto");
const mongoose = require("mongoose");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});


// exports.createOrder = async (req, res) => {
//   try {
//     const { user, products, total_amount, delivery_address, payment } = req.body;

//     const newOrder = new Order({
//       user,
//       products,
//       total_amount,
//       delivery_address,
//       order_status: 'Pending',
//       payment,
//     });

//     const savedOrder = await newOrder.save();
//     res.status(201).json({ success: true, order: savedOrder });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };



// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // 10 records per page
    const skip = (page - 1) * limit;

    // Fetch orders with pagination
    const orders = await Order.find()
      .skip(skip)
      .limit(limit)
      .populate('user')
      .populate('products.product')
      .populate('delivery_address');

    // Count the total number of orders
    const totalOrders = await Order.countDocuments();

    // Send paginated response
    res.status(200).json({
      success: true,
      orders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { userId, products, total_amount, delivery_address } = req.body;
    console.log(req.body);

    if (!userId || !products || !total_amount || !delivery_address) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Fetch user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate Razorpay Order
    const options = {
      amount: total_amount * 100, // Convert to paisa
      currency: "INR",
      receipt: `order_rcptid_${Date.now()}`,
      payment_capture: 1,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Save Order in DB
    const order = new Order({
      user: userId,
      products,
      total_amount,
      delivery_address,
      payment: {
        payment_method: "Razorpay",
        amount_paid: total_amount,
        payment_status: "Pending",
        razorpay_order_id: razorpayOrder.id,
      },
    });

    await order.save();
    
    
    res.status(201).json({
      success: true,
      order,
      razorpayOrder,
      user: {
        _id: user._id,
        name: user.username,
        email: user.email,
        phone: user.phoneNumber,
      },
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const secret = process.env.RAZORPAY_SECRET;
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // Update Order in DB
    const order = await Order.findOneAndUpdate(
      { "payment.razorpay_order_id": razorpay_order_id },
      {
        $set: {
          "payment.razorpay_payment_id": razorpay_payment_id,
          "payment.razorpay_signature": razorpay_signature,
          "payment.payment_status": "Completed",
          order_status: "Confirmed",
        },
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json({ success: true, message: "Payment Verified", order });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
};
// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user')
      .populate('products.product')
      .populate('delivery_address');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.getOrderByUserId = async (req, res) => {
  try {
    // Convert userId to ObjectId
    const userId = new mongoose.Types.ObjectId(req.params.userId);
    
    // Find orders by userId and populate necessary fields
    const orders = await Order.find({ user: userId })
      .populate('user')
      .populate('products.product')
      .populate('delivery_address');

    // Check if orders exist
    if (!orders || orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Orders not found for this user' });
    }
    console.log(orders,'sdfdfd');
    
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { order_status } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { order_status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, order: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { payment_status, amount_paid } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { 'payment.payment_status': payment_status, 'payment.amount_paid': amount_paid },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, order: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.updateOrderStatusAdminpage = async (req, res) => {
  try {
    const { order_status } = req.body;
    let orderId = req.params.orderId; // Using orderId from URL params
    
    // Log the orderId for debugging
    console.log("Order ID received:", orderId);
    
    // Check if the orderId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: 'Invalid Order ID' });
    }

    // Convert orderId to ObjectId
    const ObjectId = new mongoose.Types.ObjectId(orderId);

    // Check if the order exists
    const updatedOrder = await Order.findById(ObjectId);
    
    // If order not found, return error message
    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    // Log the existing order before update
    console.log("Existing Order:", updatedOrder);

    // Proceed with the update
    const orderUpdated = await Order.findByIdAndUpdate(
      { _id: ObjectId },
      { order_status },
      { new: true }
    );

    // Return the updated order as the response
    res.status(200).json({ success: true, order: orderUpdated });
    
  } catch (error) {
    // Log and return any errors encountered
    console.error("Error updating order status:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete an order
exports.deleteOrder = async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);

    if (!deletedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.getOrderByEmailAndId = async (req, res) => {
  try {
    const { email, orderId } = req.query; // Extract email and orderId from request query

    if (!email || !orderId) {
      return res.status(400).json({ success: false, message: "Email and Order ID are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid Order ID" });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const orderObjectId = new mongoose.Types.ObjectId(orderId);

    // Find the order where user ID matches and order ID matches
    const order = await Order.findOne({ user: user._id, _id: orderObjectId })
      .populate("user")
      .populate("products.product")
      .populate("delivery_address");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
console.log(order,'orders');

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
