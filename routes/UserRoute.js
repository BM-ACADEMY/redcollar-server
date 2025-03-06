const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');

// Register a new user
router.post('/register', userController.registerUser);

// Login user
router.post('/login', userController.loginUser);

// Forgot password (send email with reset link)
router.post('/forgot-password', userController.forgotPassword);

// Reset password (verify token and update password)
router.post('/reset-password', userController.resetPassword);

// Get all users
router.get('/fetch-all-users', userController.getAllUsers);

router.get('/fetch-user-by-id/:id', userController.getUserById);

// Update user by ID
router.put('/updateUserById/:id', userController.updateUserById);

// Delete user by ID
router.delete('/deleteUserById/:id', userController.deleteUserById);

module.exports = router;
