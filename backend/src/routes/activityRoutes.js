import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware.js';
import { index } from '../controllers/activityController.js';
const router = Router();
router.get('/', authenticate, authorizeRoles('ADMIN'), index);
export default router;
