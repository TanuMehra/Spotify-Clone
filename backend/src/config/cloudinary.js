const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a file buffer directly to Cloudinary using streams.
 * @param {Buffer} fileBuffer - The memory buffer of the uploaded file.
 * @param {string} folder - Target folder inside Cloudinary.
 * @param {string} resourceType - 'auto', 'image', 'video' (audio belongs to video in Cloudinary).
 * @returns {Promise<object>} Cloudinary upload result.
 */
const uploadToCloudinary = (fileBuffer, folder = 'spotify_clone', resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary stream upload error:', error);
          return reject(error);
        }
        resolve(result);
      }
    );
    
    // Convert Buffer to readable stream and pipe to Cloudinary
    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });
};

/**
 * Deletes an asset from Cloudinary.
 * @param {string} publicId - The public ID of the asset.
 * @param {string} resourceType - The Cloudinary resource type ('image', 'video', 'raw').
 * @returns {Promise<object>} Cloudinary deletion result.
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    console.error(`Error deleting ${publicId} from Cloudinary:`, error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary
};
