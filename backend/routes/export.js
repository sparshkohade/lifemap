// backend/routes/export.js
import express from 'express';
import exportController from '../controllers/exportController.js'; // default object exported earlier
import auth from '../middleware/authMiddleware.js';
import checkOwnership from '../middleware/checkOwnership.js';

const router = express.Router();

router.get('/roadmap/:id/json', auth, checkOwnership, exportController.exportJSON);
router.get('/roadmap/:id/csv', auth, checkOwnership, exportController.exportCSV);
router.get('/roadmap/:id/pdf', auth, checkOwnership, exportController.exportPDF);

export default router;
