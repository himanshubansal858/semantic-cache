import express from "express";
import { getAnalytics
        ,resetAnalytics
 } from "../controllers/analyticsController.js";
import { requireAdmin } from "../middleware/adminAuth.js";
const router = express.Router();

router.get("/", getAnalytics);
router.delete("/reset", requireAdmin, resetAnalytics);
export default router;