const express = require('express');
const {
    register,
    login,
    getMe,
    logout,
    changePassword,
    verifyEmail,
    
} = require('../controllers/auth');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);
router.put('/changePassword', protect, changePassword);

// Email verification routes
router.get('/verifyemail/:token', verifyEmail);

module.exports = router;