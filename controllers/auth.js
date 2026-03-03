const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    let user; // ประกาศไว้นอก try เพื่อใช้ใน catch ได้
    try {
        const { name, email, tel, password,role } = req.body;
        console.log('1. req.body =', req.body); // เช็คว่า body มาถึงไหม
        user = await User.create({ name, email, tel, password,role });

        const verificationToken = user.getEmailVerificationToken();
        await user.save({ validateBeforeSave: false });

        const verifyUrl = `${process.env.CLIENT_URL}/api/v1/auth/verifyemail/${verificationToken}`;
        
        await sendEmail({
            email: user.email,
            subject: 'Email Verification - Job Fair',
            html: `
                <h2>Welcome to Job Fair, ${user.name}!</h2>
                <p>Please verify your email by clicking the link below:</p>
                <a href="${verifyUrl}" 
                   style="background:#4F46E5;color:white;padding:12px 24px;
                          text-decoration:none;border-radius:6px;display:inline-block;">
                   Verify Email
                </a>
                <p>This link will expire in <strong>24 hours</strong>.</p>
                <p>If you did not register, please ignore this email.</p>
            `
        })


        res.status(200).json({
            success: true,
            message: `Verification email sent to ${user.email}. Please verify before logging in.`
        });

    } catch (err) {
        console.log(err.stack);
        console.log('ERROR =', err.message); // ดูว่า error คืออะไร
        if (user) {
            await User.findByIdAndDelete(user._id);
        }

        res.status(500).json({ 
            success: false, 
            message: 'Registration failed. Please try again.' 
        });
    }
};

// @desc    Verify email
// @route   GET /api/v1/auth/verifyemail/:token
// @access  Public
exports.verifyEmail = async (req, res, next) => {
    try {
        // Hash the token from URL to match stored hash
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            emailVerificationToken: hashedToken,
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        // Mark as verified and clear token fields
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        await user.save({ validateBeforeSave: false });

        sendTokenResponse(user, 200, res);

    } catch (err) {
        console.log(err.stack);
        res.status(500).json({ success: false, message: 'Email verification failed' });
    }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Block unverified users from logging in
        if (!user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email before logging in. Check your inbox or request a new verification email.'
            });
        }

        sendTokenResponse(user, 200, res);

    } catch (err) {
        return res.status(500).json({ success: false, message: 'Cannot process login' });
    }
};

const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        token
    });
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
};

// @desc    Log user out / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({ success: true, data: {} });
};

// @desc    Change password
// @route   PUT /api/v1/auth/changePassword
// @access  Private
exports.changePassword = async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword) {
            return res.status(400).json({ success: false, message: 'Please provide old password' });
        }
        if (!newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide new password' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }

        const user = await User.findById(req.user.id).select('+password');

         const isMatch = await user.matchPassword(oldPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        const isSame = await user.matchPassword(newPassword);
        if (isSame) {
            return res.status(400).json({ success: false, message: 'New password must be different from current password' });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ success: true, message: 'Password changed successfully' });

    } catch (err) {
        console.log(err.stack);
        return res.status(500).json({ success: false, message: 'Cannot change password' });
    }
};