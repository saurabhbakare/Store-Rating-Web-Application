const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { validateUserCreation, validateStoreCreation } = require('../middleware/validationMiddleware');

// Secure all admin routes with authentication and role check
router.use(verifyToken, requireRole(['admin']));

router.get('/stats', adminController.getDashboardStats);
router.get('/users', adminController.getUsersList);
router.get('/stores', adminController.getStoresList);
router.post('/users', validateUserCreation, adminController.addUser);
router.post('/stores', validateStoreCreation, adminController.addStore);

module.exports = router;
