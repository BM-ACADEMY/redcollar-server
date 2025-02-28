const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/UsersSchema');
const mongoose = require('mongoose');
// Create a new user (Registration)
exports.registerUser = async (req, res) => {
  const { username, email, id, phoneNumber, password, address } = req.body; // Receiving address fields

  console.log(req.body);

  try {
    // Check if a user already exists with the given email or Facebook ID
    const existingUser = await User.findOne({ 
      $or: [{ email }, { facebook_id: id }] 
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password only if provided (normal email-password registration)
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Create a new user (without password for Facebook signup)
    const newUser = new User({
      username,
      email,
      password: hashedPassword, // null if Facebook signup
      phoneNumber,
      facebook_id: id, // Save Facebook ID
      address: {
        country: address?.country || "",
        state: address?.state || "",
        city: address?.city || "",
        addressLine1: address?.addressLine1 || "",
        addressLine2: address?.addressLine2 || "",
        pincode: address?.pincode || "",
      }
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: err.message });
  }
};
// Login user
exports.loginUser = async (req, res) => {
  const { email, password, id } = req.body; // Extract email, password, or Facebook ID

  try {
    // Facebook Login: If the request contains only `id`
    if (id && !email && !password) {
      const user = await User.findOne({ facebook_id: id });

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      return res.status(200).json({
        success: true,
        message: "Facebook login successful",
        username: user.username,
        isAdmin: user.isAdmin || false,
        _id: user._id,
        name: user.username,
        email: user.email,
        address: user.address || {} // Include address details
      });
    }

    // Normal Login: Check if email & password are provided
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Check if the user exists in the database
    const user = await User.findOne({ email });

    // If email matches the admin credentials
    if (email === "clinetredcollar@gmail.com" && password === "redcollar@123") {
      if (user) {
        return res.status(200).json({
          success: true,
          message: "Admin login successful",
          username: user.username,
          isAdmin: true,
          _id: user._id,
          name: user.username,
          email: user.email,
          address: user.address || {} // Include address details
        });
      }

      // Default admin response if user does not exist in DB
      return res.status(200).json({
        success: true,
        message: "Admin login successful",
        username: "redcollar",
        isAdmin: true,
        _id: "admin_id",
        name: "Admin Name",
        email: email,
        address: {} // Empty address for default admin login
      });
    }

    // If the email is not an admin, check if the user exists
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Compare passwords for regular users
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Successful login
    res.status(200).json({
      success: true,
      message: "Login successful",
      username: user.username,
      isAdmin: user.isAdmin || false,
      _id: user._id,
      name: user.username,
      email: user.email,
      address: user.address || {} // Include address details
    });

  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


// Endpoint for sending reset password email
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // SMTP server for Gmail
  port: 587, // Secure SMTP port for Gmail
  secure: false, // Use STARTTLS (false for port 587)
  auth: {
    user: 'clinetredcollar@gmail.com',
    pass: 'ipehalalhlzctbun',
  },
  tls: {
    rejectUnauthorized: false,
  },
});

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a reset token (hex) and set expiration time (30 minutes)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expirationTime = Date.now() + 30 * 60 * 1000; // 30 minutes

    // Store token and expiration in the database
    user.resetToken = resetToken;
    user.resetTokenExpiration = expirationTime;
    await user.save();

    // Generate password reset link
    const resetLink = `http://10.0.2.2:6000/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: 'clinetredcollar@gmail.com',
      to: email,
      subject: 'Password Reset Request',
      html: `
        <p>You requested a password reset.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}" target="_blank">Reset Password</a>
        <p>This link is valid for 30 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ message: 'Failed to send email', error: error.toString() });
      }
      res.status(200).json({ message: 'Password reset email sent successfully.' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Error processing request', error });
  }
};

// Reset Password (Verify Token & Update Password)
exports.resetPassword = async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (!newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'Both password fields are required' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() }, // Check token expiration
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and remove token
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiration = null;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;  // Get page number, default to 1
    const limit = parseInt(req.query.limit) || 10; // Get limit per page, default to 10
    const skip = (page - 1) * limit; // Calculate how many records to skip

    // Fetch paginated users from database
    const users = await User.find().skip(skip).limit(limit);

    // Get total count of users (for frontend to know if there are more pages)
    const totalUsers = await User.countDocuments();

    res.status(200).json({
      users, 
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit), 
      currentPage: page
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Error fetching users." });
  }
};
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    // Convert to ObjectId
    const objectId = new mongoose.Types.ObjectId(id);

    // Fetch user from database
    const user = await User.findById(objectId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user details:", err);
    res.status(500).json({ message: "Error fetching user details." });
  }}

// Update user by ID
// exports.updateUserById = async (req, res) => {
//   const { id } = req.params;
//   const { email, password, username } = req.body;

//   if (!email || !password || !username) {
//     return res.status(400).json({ message: 'New Email, Username, and Password are required' });
//   }

//   try {
//     const updatedUser = await User.findByIdAndUpdate(
//       id, // Find user by ID
//       { email, password, username }, // Update user fields
//       { new: true } // Return updated user
//     );

//     if (!updatedUser) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     res.status(200).json({ message: 'User updated successfully', updatedUser });
//   } catch (error) {
//     res.status(500).json({ message: 'Error updating user', error });
//   }
// };

exports.updateUserById = async (req, res) => {
  const { id } = req.params;
  const { email, password, username, phoneNumber, address } = req.body;
console.log(id)
  // Convert id to ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }

  const objectId = new mongoose.Types.ObjectId(id);

  // Prepare the update object, only including fields that are provided
  let updateData = {};

  if (email) updateData.email = email;
  if (username) updateData.username = username;
  if (phoneNumber) updateData.phoneNumber = phoneNumber;
  if (address) updateData.address = address; // Include address update

  if (password) {
    // Hash the password if it is provided
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    } catch (error) {
      return res.status(500).json({ message: 'Error hashing password', error });
    }
  }

  // If no fields are provided, send an error
  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ message: 'At least one field is required to update' });
  }

  try {
    // Find user by ID and update the fields
    const updatedUser = await User.findByIdAndUpdate(
      objectId, 
      { $set: updateData }, // Ensure only provided fields are updated
      { new: true } // Return the updated user document
    );

    // If no user is found with the given ID
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User updated successfully', updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error });
  }
};
// Delete user by ID
exports.deleteUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error });
  }
};
