const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
  // api_config: process.env.COUDINARY_API_CONFIG
});


const uploadImage = async (file, folder = 'fobino') => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: 'auto',
      // sourceFile:'systemd',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    throw error;
  }
};

const uploadDocument = async (file, folder = 'fobino/documents') => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: 'auto',
      access_mode: 'authenticated'
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format
    };
  } catch (error) {
    logger.error('Cloudinary document upload error:', error);
    throw error;
  }
};
const deleteImage = async (publicId)=>{
  try{
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch(error){
    logger.error('Cloudinary delte error:', error);
    throw error;
  }
}
// const deleteImage = async (publicId) => {
//   try {
//     const result = await cloudinary.uploader.destroy(publicId);
//     return result.result === 'ok';
//   } catch (error) {
//     logger.error('Cloudinary delete error:', error);
//     throw error;
//   }
// };

const getSignedUrl = (publicId , expiresAt=3600)=>{
  return cloudinary.url(publicId, {
    sign_url:true,
    type:'authenticated',
    expiresAt: Math.floor(Date.now()/1000)+expiresAt
  })
}


// const getSignedUrl = (publicId, expiresAt = 3600) => {
//   return cloudinary.url(publicId, {
//     sign_url: true,
//     type: 'authenticated',
//     expires_at: Math.floor(Date.now() / 1000) + expiresAt
//   });
// };

// module.exports = {
//   cloudinary,
//   uploadImage,
//   uploadDocument,
//   deleteImage,
//   getSignedUrl
// };


module.exports ={
  cloudinary,
  uploadImage,
  uploadDocument,
  deleteImage,
  getSignedUrl
}