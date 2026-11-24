import { getRedisClient } from "../config/redis.js";

export const trackResponseTime = (req, res, next) => {
    const start = process.hrtime.bigint();

    res.once("finish", () => {
        const elapsedNs = process.hrtime.bigint() - start;
        const elapsedMs = Number(elapsedNs) / 1_000_000;

        // Record metrics without delaying the HTTP response
        try {
            const client = getRedisClient();

            const transaction = client.multi()
                .hIncrBy("analytics:metrics", "completedRequests", 1)
                .hIncrBy(
                    "analytics:metrics",
                    "totalResponseTimeMs",
                    Math.round(elapsedMs)
                );
            if (res.statusCode >= 400) {
                transaction.hIncrBy(
                    "analytics:metrics",
                    "failedRequests",
                    1
                );
            }

            if (res.statusCode >= 200 && res.statusCode < 300) {
                if (res.locals.cacheOutcome === "hit") {
                    transaction
                        .hIncrBy("analytics:metrics", "cacheHitCompleted", 1)
                        .hIncrBy(
                            "analytics:metrics",
                            "cacheHitResponseTimeMs",
                            Math.round(elapsedMs)
                        );
                } else if (res.locals.cacheOutcome === "miss") {
                    transaction
                        .hIncrBy("analytics:metrics", "cacheMissCompleted", 1)
                        .hIncrBy(
                            "analytics:metrics",
                            "cacheMissResponseTimeMs",
                            Math.round(elapsedMs)
                        );
                }
            }
            console.log("Analytics debug:", {
                statusCode: res.statusCode,
                failed: res.statusCode >= 400
            });
            transaction.exec().catch((error) => {
                console.error("Response metrics failed:", error.message);
            });
        } catch (error) {
            console.error("Response metrics unavailable:", error.message);
        }
    });

    next();
};