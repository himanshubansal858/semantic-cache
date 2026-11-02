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
    await connectRedis();
    await checkRedisSearch();
    await createVectorIndex();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();