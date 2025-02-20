const AddToCart = require('../models/CartSchema'); // Import Cart Model
const mongoose = require('mongoose');
// GET all cart items
exports.getCartItems = async (req, res) => {
  try {
    const cartItems = await AddToCart.find().populate('users').populate('products'); // Populate user and product details
    res.status(200).json(cartItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getCartItemByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    // Convert userId to ObjectId
    const objectId = new mongoose.Types.ObjectId(userId);

    const cartItems = await AddToCart.find({ userId: objectId }) 
      .populate('userId', '-password') // Exclude the password field
      .populate('product');

    if (!cartItems.length) {
      return res.status(404).json({ message: "No cart items found for this user" });
    }

    res.status(200).json(cartItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET cart item by ID
exports.getCartItemById = async (req, res) => {
  try {
    const cartItem = await AddToCart.findById(req.params.id).populate('user').populate('product');
    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    res.status(200).json(cartItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADD item to cart (POST)
exports.addToCart = async (req, res) => {
  try {
    const { userId, product, quantity, selected_color, selected_size, total_price } = req.body;

    // Check if the product with the same color and size exists in the user's cart
    const existingCartItem = await AddToCart.findOne({
      userId,
      product,
      selected_color,
      selected_size
    });

    if (existingCartItem) {
      // If product exists, update the quantity and total price
      existingCartItem.quantity += quantity;
      existingCartItem.total_price += total_price;
      const updatedCartItem = await existingCartItem.save();
      return res.status(200).json(updatedCartItem);
    }

    // If product does not exist, create a new entry
    const newCartItem = new AddToCart({
      userId,
      product,
      quantity,
      selected_color,
      selected_size,
      total_price
    });

    const savedCartItem = await newCartItem.save();
    res.status(201).json(savedCartItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// UPDATE cart item (PUT)
exports.updateCartItem = async (req, res) => {
  try {
    const updatedCartItem = await AddToCart.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    if (!updatedCartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    
    res.status(200).json(updatedCartItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE cart item
exports.deleteCartItem = async (req, res) => {
  try {
    const deletedCartItem = await AddToCart.findByIdAndDelete(req.params.id);
    
    if (!deletedCartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    
    res.status(200).json({ message: 'Cart item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

