
import express from "express";
import { askQuestion, removeCache } from "../controllers/llmController.js";
import { requireAdmin } from "../middleware/adminAuth.js";
const router = express.Router();

router.post("/ask", askQuestion);
router.delete("/cache/:key", requireAdmin, removeCache);
export default router;
