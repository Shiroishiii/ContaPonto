
import { Router } from "express";

import {
    store,
    index,
    show,
    update,
    updateStatus,
    assign,
} from "../controllers/scheduleController.js";

import {
    authenticate,
    authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = Router();

router.use(authenticate);
router.use(authorizeRoles("ADMIN"));

router.post("/", store);
router.get("/", index);
router.get("/:id", show);
router.put("/:id", update);
router.patch("/:id/status", updateStatus);
router.post("/:id/assign", assign);

export default router;
