const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController.js');
const { isAdmin } = require('../middleware/authMiddleware.js');

// Note: The base path for these routes is already protected by the 'protect' middleware in server.js

// Admin-only routes
router.get('/', isAdmin, userController.getAllUsers);
router.post('/', isAdmin, userController.createUser);
router.put('/:id/status', isAdmin, userController.toggleUserStatus);
router.put('/:id/role', isAdmin, userController.updateUserRole);

// Route for a user to update their own profile
router.put('/:id', userController.updateUserProfile);


module.exports = router;