
import { Router } from "express";

import {
    authenticate,
    authorizeRoles
} from "../middlewares/authMiddleware.js";

import {
    store,
    today,
} from "../controllers/timeRecordController.js";

const router = Router();

router.use(authenticate);

router.get(
    "/today",
    authorizeRoles("ADMIN", "EMPLOYEE"),
    today
);

router.post(
    "/",
    authorizeRoles("EMPLOYEE"),
    store
);

export default router;
