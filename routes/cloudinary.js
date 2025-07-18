const express = require('express');
const router = express.Router();
const {
  deleteImage,
  getImageMetadata,
  uploadImage,
  generateSignedUploadUrl,
  bulkDeleteImages,
  getFolderContents
} = require('../services/cloudinary');
const { authenticateToken } = require('../middleware/auth');

/**
 * DELETE /api/cloudinary/delete
 * Delete image from Cloudinary
 */
router.delete('/delete', authenticateToken, async (req, res) => {
  try {
    const { publicId } = req.body;
    
    if (!publicId) {
      return res.status(400).json({
        success: false,
        error: 'Public ID is required'
      });
    }
    
    const result = await deleteImage(publicId);
    
    res.json({
      success: true,
      message: 'Image deleted successfully',
      result
    });
    
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/cloudinary/metadata/:publicId
 * Get image metadata from Cloudinary
 */
router.get('/metadata/:publicId', authenticateToken, async (req, res) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      return res.status(400).json({
        success: false,
        error: 'Public ID is required'
      });
    }
    
    const result = await getImageMetadata(publicId);
    
    res.json(result);
    
  } catch (error) {
    console.error('Get metadata error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/cloudinary/upload
 * Server-side image upload to Cloudinary
 */
router.post('/upload', authenticateToken, async (req, res) => {
  try {
    const { filePath, options } = req.body;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'File path is required'
      });
    }
    
    const result = await uploadImage(filePath, options);
    
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      ...result
    });
    
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/cloudinary/signed-upload
 * Generate signed upload parameters for client-side uploads
 */
router.post('/signed-upload', authenticateToken, async (req, res) => {
  try {
    const { options } = req.body;
    
    const signedParams = generateSignedUploadUrl(options);
    
    res.json({
      success: true,
      signedParams
    });
    
  } catch (error) {
    console.error('Generate signed upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/cloudinary/bulk-delete
 * Bulk delete images from Cloudinary
 */
router.delete('/bulk-delete', authenticateToken, async (req, res) => {
  try {
    const { publicIds } = req.body;
    
    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Array of public IDs is required'
      });
    }
    
    const result = await bulkDeleteImages(publicIds);
    
    res.json({
      success: true,
      message: `Bulk deletion completed for ${publicIds.length} images`,
      ...result
    });
    
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/cloudinary/folder/:folderPath
 * Get folder contents from Cloudinary
 */
router.get('/folder/:folderPath?', authenticateToken, async (req, res) => {
  try {
    const { folderPath } = req.params;
    const { maxResults, nextCursor } = req.query;
    
    const options = {
      maxResults: maxResults ? parseInt(maxResults) : 100,
      nextCursor
    };
    
    const result = await getFolderContents(folderPath || 'citysense', options);
    
    res.json(result);
    
  } catch (error) {
    console.error('Get folder contents error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/cloudinary/stats
 * Get Cloudinary usage statistics
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // This would require admin API access to get usage stats
    // For now, return basic folder stats
    const issuesFolder = await getFolderContents('citysense/issues', { maxResults: 1 });
    
    res.json({
      success: true,
      stats: {
        totalImages: issuesFolder.totalCount || 0,
        folder: 'citysense/issues'
      }
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
