const cloudinary = require('../config/cloudinary');
const logger = require('../utils/logger');

class FileUploadService {
  // Upload product images
  async uploadPostImages(files, postId = null) {
    const results = [];
    
    for (const file of files) {
      try {
        const result = await cloudinary.uploadImage(file.path, 
          postId ? `fobino/posts/${postId}` : 'fobino/posts/temp'
        );
        results.push(result);
      } catch (error) {
        logger.error('Failed to upload image:', error);
        // Continue with other files if one fails
      }
    }
    
    return results;
  }
  
  // Upload certificate/document images
  async uploadCertificateImages(files, userId = null) {
    const results = [];
    
    for (const file of files) {
      try {
        const result = await cloudinary.uploadDocument(file.path,
          userId ? `fobino/documents/${userId}` : 'fobino/documents/temp'
        );
        results.push(result);
      } catch (error) {
        logger.error('Failed to upload certificate:', error);
      }
    }
    
    return results;
  }
  
  // Delete images
  async deleteImages(publicIds) {
    const results = [];
    
    for (const publicId of publicIds) {
      try {
        const result = await cloudinary.deleteImage(publicId);
        results.push({ publicId, success: result });
      } catch (error) {
        logger.error('Failed to delete image:', error);
        results.push({ publicId, success: false, error: error.message });
      }
    }
    
    return results;
  }
  
  // Get signed URL for protected images
  getSignedUrl(publicId, expiresInSeconds = 3600) {
    return cloudinary.getSignedUrl(publicId, expiresInSeconds);
  }
  
  // Upload chat attachment
  async uploadChatAttachment(file, chatId) {
    const folder = `fobino/chats/${chatId}`;
    
    try {
      let result;
      if (file.mimetype.startsWith('image/')) {
        result = await cloudinary.uploadImage(file.path, folder);
      } else {
        result = await cloudinary.uploadDocument(file.path, folder);
      }
      return {
        url: result.url,
        publicId: result.publicId,
        format: result.format,
        width: result.width,
        height: result.height
      };
    } catch (error) {
      logger.error('Failed to upload chat attachment:', error);
      throw error;
    }
  }
}

module.exports = new FileUploadService();







// const fs = require('fs');
// const path = require('path');
// const { v4: uuidv4 } = require('uuid');
// const logger = require('../utils/logger');

// const isDev = process.env.NODE_ENV !== 'production';
// const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
// const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// // Ensure upload directories exist
// const ensureDir = (dir) => {
//   if (!fs.existsSync(dir)) {
//     fs.mkdirSync(dir, { recursive: true });
//   }
// };

// // Initialize upload directories
// ensureDir(UPLOAD_DIR);
// ensureDir(path.join(UPLOAD_DIR, 'profiles'));
// ensureDir(path.join(UPLOAD_DIR, 'posts'));
// ensureDir(path.join(UPLOAD_DIR, 'documents'));
// ensureDir(path.join(UPLOAD_DIR, 'verification'));
// ensureDir(path.join(UPLOAD_DIR, 'chats'));

// class FileUploadService {
//   // Upload single image to local disk
//   async uploadImage(file, folder = 'posts') {
//     try {
//       if (!file || !file.buffer) {
//         throw new Error('فایل نامعتبر است');
//       }

//       const folderPath = path.join(UPLOAD_DIR, folder);
//       ensureDir(folderPath);

//       // Generate unique filename
//       const ext = path.extname(file.originalname) || '.jpg';
//       const filename = `${uuidv4()}${ext}`;
//       const filePath = path.join(folderPath, filename);

//       // Write file to disk
//       fs.writeFileSync(filePath, file.buffer);

//       // Generate public URL
//       const publicId = `${folder}/${filename}`;
//       const url = `${BASE_URL}/uploads/${publicId}`;

//       return {
//         url,
//         publicId,
//         format: ext.replace('.', ''),
//         width: null,
//         height: null
//       };
//     } catch (error) {
//       logger.error('Image upload error:', error);
//       throw new Error('خطا در آپلود تصویر');
//     }
//   }

//   // Upload multiple images
//   async uploadImages(files, folder = 'posts') {
//     try {
//       const uploadPromises = files.map(file => this.uploadImage(file, folder));
//       const results = await Promise.all(uploadPromises);
//       return results;
//     } catch (error) {
//       logger.error('Multiple images upload error:', error);
//       throw new Error('خطا در آپلود تصاویر');
//     }
//   }

//   // Upload document to local disk
//   async uploadDoc(file, folder = 'documents') {
//     try {
//       if (!file || !file.buffer) {
//         throw new Error('فایل نامعتبر است');
//       }

//       const folderPath = path.join(UPLOAD_DIR, folder);
//       ensureDir(folderPath);

//       // Generate unique filename
//       const ext = path.extname(file.originalname) || '.pdf';
//       const filename = `${uuidv4()}${ext}`;
//       const filePath = path.join(folderPath, filename);

//       // Write file to disk
//       fs.writeFileSync(filePath, file.buffer);

//       // Generate public URL
//       const publicId = `${folder}/${filename}`;
//       const url = `${BASE_URL}/uploads/${publicId}`;

//       return {
//         url,
//         publicId,
//         format: ext.replace('.', ''),
//         name: file.originalname,
//         size: file.size,
//         mimeType: file.mimetype
//       };
//     } catch (error) {
//       logger.error('Document upload error:', error);
//       throw new Error('خطا در آپلود سند');
//     }
//   }

//   // Upload profile image
//   async uploadProfileImage(file) {
//     return this.uploadImage(file, 'profiles');
//   }

//   // Upload verification document
//   async uploadVerificationDocument(file, userId, docType) {
//     return this.uploadDoc(file, `verification/${userId}/${docType}`);
//   }

//   // Upload post images
//   async uploadPostImages(files) {
//     return this.uploadImages(files, 'posts');
//   }

//   // Upload chat attachment
//   async uploadChatAttachment(file, chatId) {
//     const folder = `chats/${chatId}`;
    
//     if (file.mimetype.startsWith('image/')) {
//       return this.uploadImage(file, folder);
//     }
    
//     return this.uploadDoc(file, folder);
//   }

//   // Delete file from local disk
//   async deleteFile(publicId) {
//     try {
//       const filePath = path.join(UPLOAD_DIR, publicId);
//       if (fs.existsSync(filePath)) {
//         fs.unlinkSync(filePath);
//       }
//       return { success: true };
//     } catch (error) {
//       logger.error('File delete error:', error);
//       throw new Error('خطا در حذف فایل');
//     }
//   }

//   // Delete multiple files
//   async deleteFiles(publicIds) {
//     try {
//       const deletePromises = publicIds.map(id => this.deleteFile(id));
//       await Promise.all(deletePromises);
//       return { success: true };
//     } catch (error) {
//       logger.error('Multiple files delete error:', error);
//       throw new Error('خطا در حذف فایل‌ها');
//     }
//   }

//   // Get signed URL for private files (just return public URL in dev mode)
//   getSignedUrl(publicId, expiresIn = 3600) {
//     return `${BASE_URL}/uploads/${publicId}`;
//   }

//   // Validate file
//   validateFile(file, options = {}) {
//     const {
//       maxSize = 10 * 1024 * 1024, // 10MB
//       allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
//     } = options;

//     if (!file) {
//       throw new Error('فایل الزامی است');
//     }

//     if (file.size > maxSize) {
//       throw new Error(`حجم فایل نباید بیش از ${maxSize / (1024 * 1024)} مگابایت باشد`);
//     }

//     if (!allowedTypes.includes(file.mimetype)) {
//       throw new Error('فرمت فایل مجاز نیست');
//     }

//     return true;
//   }

//   // Validate image dimensions (if needed)
//   async validateImageDimensions(file, options = {}) {
//     // For now, just return true
//     // In production, you'd use a library like sharp to check dimensions
//     return true;
//   }
// }

// module.exports = new FileUploadService();
