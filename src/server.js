import express from "express";
import dotenv from "dotenv";
import { connectRedis,checkRedisSearch } from "./config/redis.js";
import llmRoutes from "./routes/llmRoutes.js";
import { createVectorIndex } from "./services/vectorStore.js";

dotenv.config();

const app = express();

app.use(express.json());

app.use("/api", llmRoutes);

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