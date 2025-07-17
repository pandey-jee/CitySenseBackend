const express = require('express');
const router = express.Router();
const { db } = require('../services/firebase');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// Get user profile
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const { uid } = req.user;
  
  const userDoc = await db.collection('users').doc(uid).get();
  
  if (!userDoc.exists) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const userData = userDoc.data();
  
  res.json({
    uid: userData.uid,
    email: userData.email,
    displayName: userData.displayName,
    role: userData.role,
    createdAt: userData.createdAt,
    issuesReported: userData.issuesReported || 0,
    issuesUpvoted: userData.issuesUpvoted || 0
  });
}));

// Update user profile
router.patch('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const { uid } = req.user;
  const { displayName } = req.body;
  
  if (!displayName || displayName.trim().length < 2) {
    return res.status(400).json({ error: 'Display name must be at least 2 characters' });
  }
  
  const userRef = db.collection('users').doc(uid);
  const userDoc = await userRef.get();
  
  if (!userDoc.exists) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  await userRef.update({
    displayName: displayName.trim()
  });
  
  res.json({ message: 'Profile updated successfully' });
}));

// Verify token endpoint
router.post('/verify', authenticateToken, asyncHandler(async (req, res) => {
  const { uid, email } = req.user;
  
  // Get user role from database
  const userDoc = await db.collection('users').doc(uid).get();
  let role = 'citizen';
  
  if (userDoc.exists) {
    role = userDoc.data().role || 'citizen';
  }
  
  res.json({
    uid,
    email,
    role,
    verified: true
  });
}));

module.exports = router;
