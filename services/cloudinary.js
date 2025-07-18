require('dotenv').config();
const { v2: cloudinary } = require('cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Deletion result
 */
const deleteImage = async (publicId) => {
  try {
    console.log('🗑️ Deleting image from Cloudinary:', publicId);
    
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image'
    });
    
    console.log('✅ Cloudinary deletion result:', result);
    
    return {
      success: result.result === 'ok',
      result: result
    };
  } catch (error) {
    console.error('❌ Cloudinary deletion failed:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

/**
 * Get image metadata from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Image metadata
 */
const getImageMetadata = async (publicId) => {
  try {
    console.log('📊 Fetching image metadata from Cloudinary:', publicId);
    
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'image'
    });
    
    return {
      success: true,
      metadata: {
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        url: result.secure_url,
        createdAt: result.created_at,
        folder: result.folder,
        tags: result.tags
      }
    };
  } catch (error) {
    console.error('❌ Failed to fetch image metadata:', error);
    throw new Error(`Failed to fetch metadata: ${error.message}`);
  }
};

/**
 * Upload image to Cloudinary (server-side)
 * @param {string} filePath - Local file path or base64 string
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
const uploadImage = async (filePath, options = {}) => {
  try {
    console.log('📤 Uploading image to Cloudinary...');
    
    const uploadOptions = {
      folder: options.folder || 'citysense/issues',
      public_id: options.publicId,
      tags: options.tags || ['citysense', 'issue-report'],
      transformation: options.transformation || [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
        { width: 1200, height: 800, crop: 'limit' }
      ],
      ...options
    };
    
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    
    console.log('✅ Cloudinary upload successful:', result.public_id);
    
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      metadata: {
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        createdAt: result.created_at,
        folder: result.folder,
        tags: result.tags
      }
    };
  } catch (error) {
    console.error('❌ Cloudinary upload failed:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

/**
 * Generate signed upload URL for client-side uploads
 * @param {Object} options - Upload options
 * @returns {Object} Signed upload parameters
 */
const generateSignedUploadUrl = (options = {}) => {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    
    const params = {
      timestamp,
      folder: options.folder || 'citysense/issues',
      tags: 'citysense,issue-report',
      transformation: 'q_auto:good,f_auto,w_1200,h_800,c_limit',
      ...options
    };
    
    const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);
    
    return {
      ...params,
      signature,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME
    };
  } catch (error) {
    console.error('❌ Failed to generate signed URL:', error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};

/**
 * Bulk delete images from Cloudinary
 * @param {Array<string>} publicIds - Array of public IDs to delete
 * @returns {Promise<Object>} Deletion results
 */
const bulkDeleteImages = async (publicIds) => {
  try {
    console.log('🗑️ Bulk deleting images from Cloudinary:', publicIds.length);
    
    const result = await cloudinary.api.delete_resources(publicIds, {
      resource_type: 'image'
    });
    
    console.log('✅ Bulk deletion completed');
    
    return {
      success: true,
      deleted: result.deleted,
      partial: result.partial,
      notFound: result.not_found
    };
  } catch (error) {
    console.error('❌ Bulk deletion failed:', error);
    throw new Error(`Bulk deletion failed: ${error.message}`);
  }
};

/**
 * Get folder contents from Cloudinary
 * @param {string} folderPath - Folder path
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Folder contents
 */
const getFolderContents = async (folderPath = 'citysense', options = {}) => {
  try {
    console.log('📁 Fetching folder contents:', folderPath);
    
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folderPath,
      max_results: options.maxResults || 100,
      next_cursor: options.nextCursor,
      ...options
    });
    
    return {
      success: true,
      resources: result.resources,
      nextCursor: result.next_cursor,
      totalCount: result.total_count
    };
  } catch (error) {
    console.error('❌ Failed to fetch folder contents:', error);
    throw new Error(`Failed to fetch folder contents: ${error.message}`);
  }
};

module.exports = {
  deleteImage,
  getImageMetadata,
  uploadImage,
  generateSignedUploadUrl,
  bulkDeleteImages,
  getFolderContents,
  cloudinary
};
