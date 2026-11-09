
import express from "express";
import { askQuestion, removeCache } from "../controllers/llmController.js";
const router = express.Router();

router.post("/ask", askQuestion);
router.delete("/cache/:key", removeCache);

export default router;
