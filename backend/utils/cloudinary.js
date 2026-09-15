const path = require('path');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const isCloudinaryConfigured = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return Boolean(
    cloudName &&
    apiKey &&
    apiSecret &&
    !apiSecret.includes('*') &&
    !apiSecret.includes('•')
  );
};

const getCloudinaryInstance = () => {
  dotenv.config({ path: path.join(__dirname, '../.env') }); // Read fresh .env on each invocation

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (apiSecret && (apiSecret.includes('*') || apiSecret.includes('•'))) {
    console.warn('⚠️ [Cloudinary] CLOUDINARY_API_SECRET in .env is masked with asterisks (***). Please copy the actual unmasked API secret from Cloudinary dashboard.');
    return null;
  }

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName.trim(),
      api_key: apiKey.trim(),
      api_secret: apiSecret.trim(),
      secure: true,
    });
    return cloudinary;
  }
  return null;
};

/**
 * Upload base64 image data URI or image file to Cloudinary
 * @param {string} imageSource - Base64 data URI (e.g. data:image/jpeg;base64,...) or file path/URL
 * @param {string} folder - Target Cloudinary folder (e.g. 'sanekt_avatars', 'sanekt_attendance')
 * @param {boolean} throwOnError - If true, throws error on failure instead of silent fallback
 * @returns {Promise<string>} - Cloudinary secure_url or fallback
 */
const uploadToCloudinary = async (imageSource, folder = 'sanekt_attendance', throwOnError = false) => {
  if (!imageSource || typeof imageSource !== 'string' || imageSource.trim() === '') {
    return '';
  }

  // Already a Cloudinary URL
  if (imageSource.includes('res.cloudinary.com')) {
    return imageSource;
  }

  const cloudInstance = getCloudinaryInstance();

  if (cloudInstance) {
    try {
      console.log(`☁️ [Cloudinary] Uploading image to folder: ${folder}...`);
      const uploadResult = await cloudInstance.uploader.upload(imageSource, {
        folder,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      });
      console.log(`✅ [Cloudinary] Upload successful! URL: ${uploadResult.secure_url}`);
      return uploadResult.secure_url;
    } catch (err) {
      console.error('❌ [Cloudinary] Upload failed:', err.message);
      if (throwOnError) {
        if (err.http_code === 403 || (err.message && err.message.includes('403'))) {
          throw new Error('Cloudinary Error (403): Missing "Create" permission. In your Cloudinary "API Keys" tab, edit API key 816792571631177 and enable "Upload / Create" or "Full Access" permissions.');
        }
        throw new Error(`Cloudinary upload failed: ${err.message}`);
      }
      return imageSource;
    }
  } else {
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (apiSecret && (apiSecret.includes('*') || apiSecret.includes('•'))) {
      const maskedMsg = 'Cloudinary API Secret in .env contains asterisks (***). Please click the copy icon or eye icon in Cloudinary Console to copy your actual secret key.';
      console.warn(`⚠️ [Cloudinary] ${maskedMsg}`);
      if (throwOnError) {
        throw new Error(maskedMsg);
      }
    } else {
      console.log('ℹ️ [Cloudinary] CLOUDINARY credentials not configured in .env. Saving fallback.');
      if (throwOnError) {
        throw new Error('Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are missing or incomplete in backend/.env.');
      }
    }
    return imageSource;
  }
};

module.exports = {
  isCloudinaryConfigured,
  uploadToCloudinary,
};
