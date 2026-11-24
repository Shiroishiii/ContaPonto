import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware.js';
import { store, index, decide } from '../controllers/correctionController.js';
const router = Router();
router.use(authenticate);
router.get('/', authorizeRoles('ADMIN', 'EMPLOYEE'), index);
router.post('/', authorizeRoles('EMPLOYEE'), store);
router.post('/:id/review', authorizeRoles('ADMIN'), decide);
export default router;
