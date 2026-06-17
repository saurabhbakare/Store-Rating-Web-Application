const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// User routes (only 'user' role can view stores & submit ratings)
router.get('/user/stores', verifyToken, requireRole(['user']), storeController.getUserStoresList);
router.post('/:id/rate', verifyToken, requireRole(['user']), storeController.submitOrModifyRating);

// Store Owner routes (only 'store_owner' role can view their dashboard stats and raters)
router.get('/owner/dashboard', verifyToken, requireRole(['store_owner']), storeController.getOwnerDashboard);

module.exports = router;
