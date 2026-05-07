const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { uploadProfileImage, uploadVerificationDocs, uploadSingleDocument } = require('../middleware/upload');

router.get('/me', protect, userController.getProfile);
router.put('/me', protect, userController.updateProfile);
router.post('/me/profile-image', protect, uploadProfileImage, userController.uploadProfileImage);
router.get('/profile-user/:id', userController.getPublicProfile);
router.get('/:id/public', userController.getPublicProfile);
router.post('/level-up', protect, userController.requestLevelUp);
router.get('/verification/status', protect, userController.getVerificationStatus);
router.post('/verification/request', protect, userController.createVerificationRequest);
router.post('/verification/submit', protect, userController.submitVerificationRequest);
router.post('/verification', protect, uploadSingleDocument, userController.uploadDocument);
router.post('/upload-document', protect, uploadSingleDocument, userController.uploadDocument);
router.post('/verification-info', protect, userController.submitVerificationInfo);
router.get('/documents', protect, userController.getDocuments);
router.get('/activity', protect, userController.getActivity);

module.exports = router;
