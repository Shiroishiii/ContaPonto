import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware.js';
import { showWorkday } from '../controllers/workdayController.js';
const router = Router();
router.use(authenticate, authorizeRoles('ADMIN', 'EMPLOYEE'));
router.get('/:employeeId/:date', showWorkday);
export default router;
