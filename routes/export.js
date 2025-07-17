const express = require('express');
const router = express.Router();
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');
const { db } = require('../services/firebase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// Export issues to CSV
router.get('/issues/csv', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { category, status, severity, startDate, endDate } = req.query;
  
  let query = db.collection('issues');
  
  // Apply filters
  if (category) {
    query = query.where('category', '==', category);
  }
  
  if (status) {
    query = query.where('status', '==', status);
  }
  
  if (severity) {
    query = query.where('severity', '==', parseInt(severity));
  }
  
  // Date range filter
  if (startDate) {
    query = query.where('timestamp', '>=', new Date(startDate));
  }
  
  if (endDate) {
    query = query.where('timestamp', '<=', new Date(endDate));
  }
  
  query = query.orderBy('timestamp', 'desc');
  
  const snapshot = await query.get();
  const issues = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    issues.push({
      id: doc.id,
      title: data.title,
      description: data.description,
      category: data.category,
      severity: data.severity,
      status: data.status,
      latitude: data.location?.lat,
      longitude: data.location?.lng,
      address: data.location?.address || '',
      upvotes: data.upvotes || 0,
      userId: data.userId,
      timestamp: data.timestamp?.toDate()?.toISOString() || '',
      resolvedAt: data.resolvedAt?.toDate()?.toISOString() || '',
      resolvedBy: data.resolvedBy || '',
      imageURL: data.imageURL || ''
    });
  });
  
  // Create CSV file
  const filename = `issues_export_${new Date().toISOString().split('T')[0]}.csv`;
  const filepath = path.join(__dirname, '../temp', filename);
  
  // Ensure temp directory exists
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const csvWriter = createCsvWriter({
    path: filepath,
    header: [
      { id: 'id', title: 'ID' },
      { id: 'title', title: 'Title' },
      { id: 'description', title: 'Description' },
      { id: 'category', title: 'Category' },
      { id: 'severity', title: 'Severity' },
      { id: 'status', title: 'Status' },
      { id: 'latitude', title: 'Latitude' },
      { id: 'longitude', title: 'Longitude' },
      { id: 'address', title: 'Address' },
      { id: 'upvotes', title: 'Upvotes' },
      { id: 'userId', title: 'User ID' },
      { id: 'timestamp', title: 'Created At' },
      { id: 'resolvedAt', title: 'Resolved At' },
      { id: 'resolvedBy', title: 'Resolved By' },
      { id: 'imageURL', title: 'Image URL' }
    ]
  });
  
  await csvWriter.writeRecords(issues);
  
  // Send file
  res.download(filepath, filename, (err) => {
    if (err) {
      console.error('Error sending file:', err);
    }
    
    // Clean up file after sending
    fs.unlink(filepath, (unlinkErr) => {
      if (unlinkErr) {
        console.error('Error deleting temp file:', unlinkErr);
      }
    });
  });
}));

// Export users to CSV (admin only)
router.get('/users/csv', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { role } = req.query;
  
  let query = db.collection('users');
  
  if (role) {
    query = query.where('role', '==', role);
  }
  
  query = query.orderBy('createdAt', 'desc');
  
  const snapshot = await query.get();
  const users = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    users.push({
      uid: doc.id,
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      createdAt: data.createdAt || '',
      issuesReported: data.issuesReported || 0,
      issuesUpvoted: data.issuesUpvoted || 0
    });
  });
  
  // Create CSV file
  const filename = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
  const filepath = path.join(__dirname, '../temp', filename);
  
  // Ensure temp directory exists
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const csvWriter = createCsvWriter({
    path: filepath,
    header: [
      { id: 'uid', title: 'User ID' },
      { id: 'email', title: 'Email' },
      { id: 'displayName', title: 'Display Name' },
      { id: 'role', title: 'Role' },
      { id: 'createdAt', title: 'Created At' },
      { id: 'issuesReported', title: 'Issues Reported' },
      { id: 'issuesUpvoted', title: 'Issues Upvoted' }
    ]
  });
  
  await csvWriter.writeRecords(users);
  
  // Send file
  res.download(filepath, filename, (err) => {
    if (err) {
      console.error('Error sending file:', err);
    }
    
    // Clean up file after sending
    fs.unlink(filepath, (unlinkErr) => {
      if (unlinkErr) {
        console.error('Error deleting temp file:', unlinkErr);
      }
    });
  });
}));

// Export statistics report
router.get('/stats/report', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  // Get comprehensive statistics
  const issuesSnapshot = await db.collection('issues').get();
  const usersSnapshot = await db.collection('users').get();
  
  const issues = [];
  const users = [];
  
  issuesSnapshot.forEach(doc => {
    issues.push(doc.data());
  });
  
  usersSnapshot.forEach(doc => {
    users.push(doc.data());
  });
  
  // Generate report data
  const reportData = [];
  
  // Overall statistics
  reportData.push({
    metric: 'Total Issues',
    value: issues.length,
    category: 'Overview'
  });
  
  reportData.push({
    metric: 'Total Users',
    value: users.length,
    category: 'Overview'
  });
  
  // Status breakdown
  const statusStats = {
    'Open': issues.filter(i => i.status === 'Open').length,
    'In Progress': issues.filter(i => i.status === 'In Progress').length,
    'Resolved': issues.filter(i => i.status === 'Resolved').length
  };
  
  Object.entries(statusStats).forEach(([status, count]) => {
    reportData.push({
      metric: `${status} Issues`,
      value: count,
      category: 'Status'
    });
  });
  
  // Category breakdown
  const categoryStats = {};
  issues.forEach(issue => {
    categoryStats[issue.category] = (categoryStats[issue.category] || 0) + 1;
  });
  
  Object.entries(categoryStats).forEach(([category, count]) => {
    reportData.push({
      metric: `${category} Issues`,
      value: count,
      category: 'Category'
    });
  });
  
  // Severity breakdown
  const severityStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  issues.forEach(issue => {
    severityStats[issue.severity] += 1;
  });
  
  Object.entries(severityStats).forEach(([severity, count]) => {
    reportData.push({
      metric: `Severity ${severity} Issues`,
      value: count,
      category: 'Severity'
    });
  });
  
  // Create CSV file
  const filename = `statistics_report_${new Date().toISOString().split('T')[0]}.csv`;
  const filepath = path.join(__dirname, '../temp', filename);
  
  // Ensure temp directory exists
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const csvWriter = createCsvWriter({
    path: filepath,
    header: [
      { id: 'metric', title: 'Metric' },
      { id: 'value', title: 'Value' },
      { id: 'category', title: 'Category' }
    ]
  });
  
  await csvWriter.writeRecords(reportData);
  
  // Send file
  res.download(filepath, filename, (err) => {
    if (err) {
      console.error('Error sending file:', err);
    }
    
    // Clean up file after sending
    fs.unlink(filepath, (unlinkErr) => {
      if (unlinkErr) {
        console.error('Error deleting temp file:', unlinkErr);
      }
    });
  });
}));

module.exports = router;
