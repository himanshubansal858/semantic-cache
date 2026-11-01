import express from "express";
import dotenv from "dotenv";
import { connectRedis } from "./config/redis.js";
import llmRoutes from "./routes/llmRoutes.js";

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

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();