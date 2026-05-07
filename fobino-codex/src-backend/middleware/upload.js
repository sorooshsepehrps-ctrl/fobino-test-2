const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { SYSTEM } = require('../config/constants');

// Memory storage for cloudinary uploads
const memoryStorage = multer.memoryStorage();

// Disk storage for local uploads
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter for images
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('فقط فایل‌های تصویری (JPEG, PNG, GIF, WebP) مجاز هستند'), false);
  }
};

// File filter for documents
const documentFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('فرمت فایل مجاز نیست'), false);
  }
};

// File filter for all allowed types
const allFilesFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4', 'video/mpeg', 'video/quicktime'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('فرمت فایل مجاز نیست'), false);
  }
};

// Single image upload
const uploadSingleImage = multer({
  storage: memoryStorage,
  limits: {
    fileSize: SYSTEM.MAX_FILE_SIZE
  },
  fileFilter: imageFilter
}).single('image');

// Multiple images upload
const uploadMultipleImages = multer({
  storage: memoryStorage,
  limits: {
    fileSize: SYSTEM.MAX_FILE_SIZE,
    files: SYSTEM.MAX_IMAGES_PER_POST
  },
  fileFilter: imageFilter
}).array('images', SYSTEM.MAX_IMAGES_PER_POST);

// Single document upload
const uploadSingleDocument = multer({
  storage: memoryStorage,
  limits: {
    fileSize: SYSTEM.MAX_FILE_SIZE
  },
  fileFilter: documentFilter
}).single('document');

// Multiple documents upload
const uploadMultipleDocuments = multer({
  storage: memoryStorage,
  limits: {
    fileSize: SYSTEM.MAX_FILE_SIZE,
    files: 10
  },
  fileFilter: documentFilter
}).array('documents', 10);

// Profile image upload
const uploadProfileImage = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB for profile images
  },
  fileFilter: imageFilter
}).single('profileImage');

// Verification documents upload
const uploadVerificationDocs = multer({
  storage: memoryStorage,
  limits: {
    fileSize: SYSTEM.MAX_FILE_SIZE,
    files: 10
  },
  fileFilter: documentFilter
}).fields([
  { name: 'nationalCard', maxCount: 1 },
  { name: 'birthCertificate', maxCount: 1 },
  { name: 'selfieWithCard', maxCount: 1 },
  { name: 'businessLicense', maxCount: 1 },
  { name: 'businessPhotos', maxCount: 5 },
  { name: 'catalog', maxCount: 1 },
  { name: 'bankCardImage', maxCount: 1 }
]);

// Chat attachments upload
const uploadChatAttachment = multer({
  storage: memoryStorage,
  limits: {
    fileSize: SYSTEM.MAX_FILE_SIZE,
    files: 5
  },
  fileFilter: allFilesFilter
}).array('attachments', 5);

// Middleware wrapper to handle multer errors
const handleUploadError = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: `حجم فایل نباید بیش از ${SYSTEM.MAX_FILE_SIZE / (1024 * 1024)} مگابایت باشد`
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: 'تعداد فایل‌ها بیش از حد مجاز است'
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: 'نام فیلد فایل نامعتبر است'
          });
        }
        return res.status(400).json({
          success: false,
          message: 'خطا در آپلود فایل'
        });
      }
      
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'خطا در آپلود فایل'
        });
      }
      
      next();
    });
  };
};

// Custom upload for marketing requests (images + document)
const uploadMarketingRequest = multer({
  storage: memoryStorage,
  limits: {
    fileSize: SYSTEM.MAX_FILE_SIZE,
    files: SYSTEM.MAX_IMAGES_PER_POST + 1 // +1 for catalogue
  },
  fileFilter: (req, file, cb) => {
    // Allow both images and documents (PDF)
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedDocumentTypes = ['application/pdf'];
    
    if (allowedImageTypes.includes(file.mimetype) || allowedDocumentTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('فقط فایل‌های تصویری (JPEG, PNG, GIF, WebP) و PDF مجاز هستند'), false);
    }
  }
}).fields([
  { name: 'images', maxCount: SYSTEM.MAX_IMAGES_PER_POST },
  { name: 'document', maxCount: 1 }
]);

module.exports = {
  uploadSingleImage: handleUploadError(uploadSingleImage),
  uploadMultipleImages: handleUploadError(uploadMultipleImages),
  uploadSingleDocument: handleUploadError(uploadSingleDocument),
  uploadMultipleDocuments: handleUploadError(uploadMultipleDocuments),
  uploadProfileImage: handleUploadError(uploadProfileImage),
  uploadVerificationDocs: handleUploadError(uploadVerificationDocs),
  uploadChatAttachment: handleUploadError(uploadChatAttachment),
  uploadMarketingRequest: handleUploadError(uploadMarketingRequest)
};
