const express = require('express');
const router = express.Router();
const { db } = require('../services/firebase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  
  let query = db.collection('users').orderBy('createdAt', 'desc');
  
  // Apply pagination
  const offset = (page - 1) * limit;
  if (offset > 0) {
    query = query.offset(offset);
  }
  query = query.limit(parseInt(limit));
  
  const snapshot = await query.get();
  const users = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    users.push({
      uid: doc.id,
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      createdAt: data.createdAt,
      issuesReported: data.issuesReported || 0,
      issuesUpvoted: data.issuesUpvoted || 0
    });
  });
  
  // Get total count
  const totalSnapshot = await db.collection('users').get();
  const totalCount = totalSnapshot.size;
  
  res.json({
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalCount,
      totalPages: Math.ceil(totalCount / limit)
    }
  });
}));

// Update user role (admin only)
router.patch('/users/:uid/role', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { uid } = req.params;
  const { role } = req.body;
  
  if (!['citizen', 'admin', 'volunteer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  
  const userRef = db.collection('users').doc(uid);
  const userDoc = await userRef.get();
  
  if (!userDoc.exists) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  await userRef.update({ role });
  
  res.json({ message: 'User role updated successfully' });
}));

// Get admin dashboard statistics
router.get('/dashboard/stats', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  // Get issues statistics
  const issuesSnapshot = await db.collection('issues').get();
  const issues = [];
  
  issuesSnapshot.forEach(doc => {
    issues.push(doc.data());
  });
  
  // Get users statistics
  const usersSnapshot = await db.collection('users').get();
  const users = [];
  
  usersSnapshot.forEach(doc => {
    users.push(doc.data());
  });
  
  // Calculate statistics
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const recentIssues = issues.filter(issue => {
    const issueDate = issue.timestamp?.toDate();
    return issueDate && issueDate >= thirtyDaysAgo;
  });
  
  const weeklyIssues = issues.filter(issue => {
    const issueDate = issue.timestamp?.toDate();
    return issueDate && issueDate >= sevenDaysAgo;
  });
  
  const stats = {
    totalIssues: issues.length,
    totalUsers: users.length,
    openIssues: issues.filter(issue => issue.status === 'Open').length,
    resolvedIssues: issues.filter(issue => issue.status === 'Resolved').length,
    recentIssues: recentIssues.length,
    weeklyIssues: weeklyIssues.length,
    averageSeverity: issues.length > 0 ? 
      (issues.reduce((sum, issue) => sum + issue.severity, 0) / issues.length).toFixed(1) : 0,
    categoryBreakdown: {},
    severityBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    statusBreakdown: {
      'Open': 0,
      'In Progress': 0,
      'Resolved': 0
    },
    monthlyTrend: []
  };
  
  // Category and severity breakdown
  issues.forEach(issue => {
    stats.categoryBreakdown[issue.category] = (stats.categoryBreakdown[issue.category] || 0) + 1;
    stats.severityBreakdown[issue.severity] += 1;
    stats.statusBreakdown[issue.status] += 1;
  });
  
  // Monthly trend (last 6 months)
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    
    const monthlyIssues = issues.filter(issue => {
      const issueDate = issue.timestamp?.toDate();
      return issueDate && issueDate >= monthStart && issueDate <= monthEnd;
    });
    
    stats.monthlyTrend.push({
      month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
      count: monthlyIssues.length
    });
  }
  
  res.json(stats);
}));

// Delete user (admin only)
router.delete('/users/:uid', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { uid } = req.params;
  
  // Check if user exists
  const userDoc = await db.collection('users').doc(uid).get();
  
  if (!userDoc.exists) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Delete user document
  await db.collection('users').doc(uid).delete();
  
  // Note: This doesn't delete the user from Firebase Auth
  // You might want to use Firebase Admin SDK to delete the auth user as well
  
  res.json({ message: 'User deleted successfully' });
}));

// Bulk actions on issues
router.post('/issues/bulk-action', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { action, issueIds } = req.body;
  
  if (!action || !issueIds || !Array.isArray(issueIds)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  
  if (!['resolve', 'delete', 'reopen'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }
  
  const batch = db.batch();
  const results = [];
  
  for (const issueId of issueIds) {
    const issueRef = db.collection('issues').doc(issueId);
    const issueDoc = await issueRef.get();
    
    if (!issueDoc.exists) {
      results.push({ issueId, status: 'not_found' });
      continue;
    }
    
    switch (action) {
      case 'resolve':
        batch.update(issueRef, {
          status: 'Resolved',
          resolvedAt: new Date(),
          resolvedBy: req.user.uid
        });
        break;
      case 'delete':
        batch.delete(issueRef);
        break;
      case 'reopen':
        batch.update(issueRef, {
          status: 'Open',
          resolvedAt: null,
          resolvedBy: null
        });
        break;
    }
    
    results.push({ issueId, status: 'success' });
  }
  
  await batch.commit();
  
  res.json({ 
    message: `Bulk ${action} completed`,
    results 
  });
}));

module.exports = router;
