import { getRedisClient } from "../config/redis.js";

const METRICS_KEY = "analytics:metrics";

export const incrementMetric = async (metricName) => {
    try {
        const client = getRedisClient();

        await client.hIncrBy(
            METRICS_KEY,
            metricName,
            1
        );

        return true;
    } catch (error) {
        console.error(
            `Failed to increment metric ${metricName}:`,
            error.message
        );

        return false;
    }
};
export const getMetrics = async () => {
    try {
        const client = getRedisClient();

        const metrics = await client.hGetAll(METRICS_KEY);

        return {
            totalRequests: Number(metrics.totalRequests || 0),
            cacheHits: Number(metrics.cacheHits || 0),
            cacheMisses: Number(metrics.cacheMisses || 0),
            llmCalls: Number(metrics.llmCalls || 0),
            totalResponseTimeMs: Number(metrics.totalResponseTimeMs || 0),
            completedRequests: Number(metrics.completedRequests || 0),
            cacheHitResponseTimeMs: Number(
                metrics.cacheHitResponseTimeMs || 0
            ),
            cacheMissResponseTimeMs: Number(
                metrics.cacheMissResponseTimeMs || 0
            ),
            cacheHitCompleted: Number(
                metrics.cacheHitCompleted || 0
            ),
            cacheMissCompleted: Number(
                metrics.cacheMissCompleted || 0
            ),
            failedRequests: Number(metrics.failedRequests || 0)
        };

    } catch (error) {
        console.error("Failed to retrieve metrics:", error.message);
        throw error;
    }
};
export const resetMetrics = async () => {
    const client = getRedisClient();

    const deleted = await client.del(METRICS_KEY);

    return deleted === 1;
};
export const METRIC_NAMES = {
    TOTAL_REQUESTS: "totalRequests",
    CACHE_HITS: "cacheHits",
    CACHE_MISSES: "cacheMisses",
    LLM_CALLS: "llmCalls",
    TOTAL_RESPONSE_TIME: "totalResponseTimeMs",
    COMPLETED_REQUESTS: "completedRequests",
    CACHE_HIT_RESPONSE_TIME: "cacheHitResponseTimeMs",
    CACHE_MISS_RESPONSE_TIME: "cacheMissResponseTimeMs",
    CACHE_HIT_COMPLETED: "cacheHitCompleted",
    CACHE_MISS_COMPLETED: "cacheMissCompleted",
    FAILED_REQUESTS: "failedRequests"
};
