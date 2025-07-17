const { auth } = require('../services/firebase');

// Middleware to authenticate Firebase tokens
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the Firebase token
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to check admin role
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user data from Firestore to check role
    const { db } = require('../services/firebase');
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    
    if (userData.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.userRole = userData.role;
    next();
  } catch (error) {
    console.error('Admin check failed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to check if user owns the resource
const requireOwnership = (resourceField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user owns the resource or is admin
    if (req.resource && req.resource[resourceField] !== req.user.uid && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireOwnership
};
