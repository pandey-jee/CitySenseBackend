const express = require('express');
const router = express.Router();
const { db } = require('../services/firebase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateQuery } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// Get all issues with filtering and pagination
router.get('/', validateQuery, asyncHandler(async (req, res) => {
  const { category, status, severity, limit, page, sortBy, sortOrder } = req.query;
  
  let query = db.collection('issues');
  
  // Apply filters
  if (category) {
    query = query.where('category', '==', category);
  }
  
  if (status) {
    query = query.where('status', '==', status);
  }
  
  if (severity) {
    query = query.where('severity', '==', severity);
  }
  
  // Apply sorting
  query = query.orderBy(sortBy, sortOrder);
  
  // Apply pagination
  const offset = (page - 1) * limit;
  if (offset > 0) {
    query = query.offset(offset);
  }
  query = query.limit(limit);
  
  const snapshot = await query.get();
  const issues = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    issues.push({
      id: doc.id,
      ...data,
      timestamp: data.timestamp?.toDate()
    });
  });
  
  // Get total count for pagination
  let countQuery = db.collection('issues');
  if (category) countQuery = countQuery.where('category', '==', category);
  if (status) countQuery = countQuery.where('status', '==', status);
  if (severity) countQuery = countQuery.where('severity', '==', severity);
  
  const totalSnapshot = await countQuery.get();
  const totalCount = totalSnapshot.size;
  
  res.json({
    issues,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit)
    }
  });
}));

// Get issue by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const doc = await db.collection('issues').doc(id).get();
  
  if (!doc.exists) {
    return res.status(404).json({ error: 'Issue not found' });
  }
  
  const data = doc.data();
  res.json({
    id: doc.id,
    ...data,
    timestamp: data.timestamp?.toDate()
  });
}));

// Get issues by user
router.get('/user/:userId', authenticateToken, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  // Check if user is requesting their own issues or is admin
  if (req.user.uid !== userId && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const query = db.collection('issues')
    .where('userId', '==', userId)
    .orderBy('timestamp', 'desc');
  
  const snapshot = await query.get();
  const issues = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    issues.push({
      id: doc.id,
      ...data,
      timestamp: data.timestamp?.toDate()
    });
  });
  
  res.json({ issues });
}));

// Update issue status (admin only)
router.patch('/:id/status', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['Open', 'In Progress', 'Resolved'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  const issueRef = db.collection('issues').doc(id);
  const doc = await issueRef.get();
  
  if (!doc.exists) {
    return res.status(404).json({ error: 'Issue not found' });
  }
  
  const updateData = { status };
  
  if (status === 'Resolved') {
    updateData.resolvedAt = new Date();
    updateData.resolvedBy = req.user.uid;
  } else {
    updateData.resolvedAt = null;
    updateData.resolvedBy = null;
  }
  
  await issueRef.update(updateData);
  
  res.json({ message: 'Issue status updated successfully' });
}));

// Delete issue (admin only)
router.delete('/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const doc = await db.collection('issues').doc(id).get();
  
  if (!doc.exists) {
    return res.status(404).json({ error: 'Issue not found' });
  }
  
  await db.collection('issues').doc(id).delete();
  
  res.json({ message: 'Issue deleted successfully' });
}));

// Get issue statistics
router.get('/stats/overview', asyncHandler(async (req, res) => {
  const snapshot = await db.collection('issues').get();
  const issues = [];
  
  snapshot.forEach(doc => {
    issues.push(doc.data());
  });
  
  const stats = {
    total: issues.length,
    open: issues.filter(issue => issue.status === 'Open').length,
    inProgress: issues.filter(issue => issue.status === 'In Progress').length,
    resolved: issues.filter(issue => issue.status === 'Resolved').length,
    categories: {},
    severityDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  };
  
  // Count by category and severity
  issues.forEach(issue => {
    stats.categories[issue.category] = (stats.categories[issue.category] || 0) + 1;
    stats.severityDistribution[issue.severity] += 1;
  });
  
  res.json(stats);
}));

module.exports = router;
