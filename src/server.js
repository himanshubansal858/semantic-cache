import express from "express";
import dotenv from "dotenv";
import { connectRedis,checkRedisSearch } from "./config/redis.js";
import llmRoutes from "./routes/llmRoutes.js";
import { createVectorIndex } from "./services/vectorStore.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import { trackResponseTime } from "./middleware/responseTime.js";
import { askRateLimiter } from "./middleware/rateLimiter.js";

dotenv.config();

const app = express();

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

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();