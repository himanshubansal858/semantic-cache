import { randomUUID } from "node:crypto";

const API_URL = "http://127.0.0.1:5000/api/ask";

const testId = randomUUID();

const question =
    `Explain a unique distributed transaction scenario with test identifier ${testId}.`;
const sendRequest = async (id) => {
    const start = performance.now();

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ question })
        });

        const data = await response.json();

        return {
            request: id,
            status: response.status,
            success: data.success,
            message: data.message ?? null,
            cacheHit: data.cache?.hit,
            stored: data.cache?.stored,
            redisAvailable: data.cache?.redisAvailable,
            durationSeconds: Number(
                ((performance.now() - start) / 1000).toFixed(2)
            )
        };
    } catch (error) {
        return {
            request: id,
            success: false,
            error: error.message
        };
    }
};

console.log("Sending two concurrent requests...");

const results = await Promise.all([
    sendRequest(1),
    sendRequest(2)
]);

console.table(results);
