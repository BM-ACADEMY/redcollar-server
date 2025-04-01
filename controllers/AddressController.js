const mongoose= require('mongoose');
const Address = require('../models/AddressSchema');

// ✅ Get all addresses
exports.getAllAddresses = async (req, res) => {
  try {
    const addresses = await Address.find();
    res.status(200).json(addresses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching addresses', error });
  }
};
exports.getAddressById = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);
    if (!address) return res.status(404).json({ message: 'Address not found' });

    res.status(200).json(address);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching address', error });
  }
};
// ✅ Get address by ID
exports.getAddressesByUserId = async (req, res) => {
  try {
    // if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    //   return res.status(400).json({ message: 'Invalid user ID format' });
    // }

    const userId = new mongoose.Types.ObjectId(req.params.id);

    const addresses = await Address.find({
      user: userId,
      save_address: true, // Fetch only saved addresses
    });

    if (!addresses || addresses.length === 0) {
      return res.status(404).json({ message: 'No saved addresses found' });
    }

    res.status(200).json(addresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ message: 'Error fetching addresses', error });
  }
};
// ✅ Add a new address
exports.createAddress = async (req, res) => {
  try {
    const newAddress = new Address(req.body);
  
    await newAddress.save();
    res.status(201).json({ message: 'Address added successfully', address: newAddress });
  } catch (error) {
    res.status(500).json({ message: 'Error adding address', error });
  }
};

// ✅ Update an address
exports.updateAddress = async (req, res) => {
  try {
    const updatedAddress = await Address.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedAddress) return res.status(404).json({ message: 'Address not found' });

    res.status(200).json({ message: 'Address updated successfully', address: updatedAddress });
  } catch (error) {
    res.status(500).json({ message: 'Error updating address', error });
  }
};

// ✅ Delete an address
exports.deleteAddress = async (req, res) => {
  try {
    const deletedAddress = await Address.findByIdAndDelete(req.params.id);
    if (!deletedAddress) return res.status(404).json({ message: 'Address not found' });

    res.status(200).json({ message: 'Address deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting address', error });
  }
};
