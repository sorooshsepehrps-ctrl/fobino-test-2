const express = require('express');
const router = express.Router();
const producerVerificationController = require('../controllers/producerVerificationController');
const { protect } = require('../middleware/auth');
const { uploadProducerLevelOnePhotos, uploadProducerLevelTwoDocuments } = require('../middleware/upload');

router.use(protect);

router.get('/me', producerVerificationController.getMine);
router.post('/level/1/draft', producerVerificationController.saveLevel1Draft);
router.post('/level/1/photos', uploadProducerLevelOnePhotos, producerVerificationController.uploadLevel1Photos);
router.post('/level/1/submit', producerVerificationController.submitLevel1);
router.post('/level/2/documents', uploadProducerLevelTwoDocuments, producerVerificationController.uploadLevel2Documents);
router.post('/level/2/submit', producerVerificationController.submitLevel2);
router.post('/level/3/request-visit', producerVerificationController.requestLevel3Visit);

module.exports = router;
