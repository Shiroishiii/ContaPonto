import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware.js';
import { index } from '../controllers/reportController.js';
const router = Router();
router.get('/', authenticate, authorizeRoles('ADMIN'), index);
export default router;
