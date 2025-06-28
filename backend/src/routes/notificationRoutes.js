import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
    getNotificationSettings,
    updateNotificationSettings,
    sendTestNotification,
    checkUpcomingRenewals,
} from "../controllers/notificationController.js";

const router = express.Router();

// Protected routes
router.get("/settings", authMiddleware, getNotificationSettings);
router.put("/settings", authMiddleware, updateNotificationSettings);
router.post("/test", authMiddleware, sendTestNotification);
router.get("/check-renewals", checkUpcomingRenewals);

export default router;
