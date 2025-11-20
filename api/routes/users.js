const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController.js');
const { isAdmin } = require('../middleware/authMiddleware.js');

router.get('/', isAdmin, userController.getAllUsers);
router.post('/', isAdmin, userController.createUser);
router.put('/:id/status', isAdmin, userController.toggleUserStatus);
router.put('/:id/role', isAdmin, userController.updateUserRole);
router.put('/:id', userController.updateUserProfile);

module.exports = router;