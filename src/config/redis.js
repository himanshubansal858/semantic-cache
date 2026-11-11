import { createClient } from "redis";

let redisClient;


export const connectRedis = async () => {
    try {
        redisClient = createClient({
            url: process.env.REDIS_URL,
            socket: {
                connectTimeout: 5000,
                reconnectStrategy: false
            }
        });

        redisClient.on("error", (err) => {
            console.error("Redis Client Error:", err.message);
        });

        await redisClient.connect();

        const response = await redisClient.ping();

        console.log("Redis connected successfully:", response);

        return true;

    } catch (error) {
        console.error("Redis connection failed:", error.message);

        redisClient = null;

        return false;
    }
};

export const getRedisClient = () => {
    if (!redisClient || !redisClient.isReady) {
        throw new Error("Redis client is not ready");
    }

    return redisClient;
};


export const checkRedisSearch = async () => {
    try {
        const client = getRedisClient();

        const result = await client.sendCommand(["FT._LIST"]);

        console.log("Redis Search is available!");
        console.log("Existing indexes:", result);

        return result;

    } catch (error) {
        console.error("Redis Search check failed:", error.message);
        throw error;
    }
};
