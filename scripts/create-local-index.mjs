
import "dotenv/config";

import {
    connectRedis,
    getRedisClient
} from "../src/config/redis.js";

import {
    createLocalVectorIndex
} from "../src/services/vectorStore.js";

async function main() {
    const connected = await connectRedis();

    if (!connected) {
        throw new Error("Redis connection failed");
    }

    await createLocalVectorIndex();

    const client = getRedisClient();
    const indexes = await client.sendCommand(["FT._LIST"]);

    console.log("Available indexes:", indexes);

    await client.quit();
}

main().catch(error => {
    console.error("Index setup failed:", error.message);
    process.exitCode = 1;
});
