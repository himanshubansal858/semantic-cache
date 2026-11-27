import express from "express";
import dotenv from "dotenv";
import { connectRedis, checkRedisSearch } from "./config/redis.js";
import llmRoutes from "./routes/llmRoutes.js";
import { createVectorIndex } from "./services/vectorStore.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import { trackResponseTime } from "./middleware/responseTime.js";
import { askRateLimiter } from "./middleware/rateLimiter.js";
import cors from "cors";

dotenv.config();

const app = express();
if (process.env.RENDER) {
    app.set("trust proxy", 1);
}
app.use(cors({
    origin: process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(",").map(url => url.trim())
        : false
}));

app.use(express.json({
    limit: "10kb"
}));

app.use("/api/ask", askRateLimiter);
app.use("/api/ask", trackResponseTime);
app.use("/api", llmRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/", (req, res) => {
    res.status(200).json({
        message: "Semantic Cache API is running!"
    });
});

const PORT = process.env.PORT || 5000;


const startServer = async () => {
    const redisConnected = await connectRedis();

    if (redisConnected) {
        try {
            await checkRedisSearch();
            await createVectorIndex();
        } catch (error) {
            console.error(
                "Redis initialization failed:",
                error.message
            );
        }
    } else {
        console.log(
            "Starting without Redis. Cache will be unavailable."
        );
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();