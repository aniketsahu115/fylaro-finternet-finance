const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Register user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('userType').isIn(['business', 'investor']),
  body('companyName').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, userType, companyName, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userId = await User.create({
      email,
      password: hashedPassword,
      userType,
      companyName,
      firstName,
      lastName,
      creditScore: userType === 'business' ? 500 : null,
      isVerified: false
    });

    // Generate JWT
    const token = jwt.sign(
      { userId, email, userType },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: userId,
        email,
        userType,
        companyName,
        firstName,
        lastName,
        isVerified: false
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    await User.updateLastLogin(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        companyName: user.companyName,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified,
        creditScore: user.creditScore
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      userType: user.userType,
      companyName: user.companyName,
      firstName: user.firstName,
      lastName: user.lastName,
      isVerified: user.isVerified,
      creditScore: user.creditScore,
      walletAddress: user.walletAddress,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, [
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('companyName').optional().trim(),
  body('walletAddress').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, companyName, walletAddress } = req.body;
    
    await User.update(req.user.userId, {
      firstName,
      lastName,
      companyName,
      walletAddress
    });

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Connect wallet
router.post('/connect-wallet', auth, [
  body('walletAddress').isLength({ min: 42, max: 42 }),
  body('signature').exists(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { walletAddress, signature } = req.body;
    
    // Here you would verify the signature to ensure wallet ownership
    // For demo purposes, we'll skip signature verification
    
    await User.update(req.user.userId, { walletAddress });

    res.json({ 
      message: 'Wallet connected successfully',
      walletAddress 
    });
  } catch (error) {
    console.error('Wallet connection error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;