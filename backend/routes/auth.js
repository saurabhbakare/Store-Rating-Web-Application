const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const { validateSignup, validatePasswordUpdate } = require('../middleware/validationMiddleware');

router.post('/register', validateSignup, authController.register);
router.post('/login', authController.login);
router.put('/update-password', verifyToken, validatePasswordUpdate, authController.updatePassword);

module.exports = router;
