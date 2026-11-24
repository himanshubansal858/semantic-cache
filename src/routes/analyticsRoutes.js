import express from "express";
import { getAnalytics
        ,resetAnalytics
 } from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/", getAnalytics);
router.delete("/reset", resetAnalytics);
export default router;