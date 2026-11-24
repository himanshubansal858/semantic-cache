import { getMetrics,resetMetrics } from "../services/metricsService.js";

export const getAnalytics = async (req, res) => {
    try {
        const metrics = await getMetrics();

        const cacheLookups = metrics.cacheHits + metrics.cacheMisses;

        const cacheHitRate = cacheLookups > 0
            ? (metrics.cacheHits / cacheLookups) * 100
            : 0;

        const averageResponseTimeMs = metrics.completedRequests > 0
            ? metrics.totalResponseTimeMs / metrics.completedRequests
            : 0;
        const averageCacheHitMs = metrics.cacheHitCompleted > 0
            ? metrics.cacheHitResponseTimeMs / metrics.cacheHitCompleted
            : 0;

        const averageCacheMissMs = metrics.cacheMissCompleted > 0
            ? metrics.cacheMissResponseTimeMs / metrics.cacheMissCompleted
            : 0;

        const speedup = averageCacheHitMs > 0 && metrics.cacheMissCompleted > 0
            ? averageCacheMissMs / averageCacheHitMs
            : null;

        return res.status(200).json({
            success: true,
            metrics: {
                ...metrics,
                cacheHitRate: Number(cacheHitRate.toFixed(2)),
                averageResponseTimeMs: Number(
                    averageResponseTimeMs.toFixed(2)
                ),
                averageCacheHitMs: Number(averageCacheHitMs.toFixed(2)),
                averageCacheMissMs: Number(averageCacheMissMs.toFixed(2)),
                speedup: speedup === null ? null : Number(speedup.toFixed(2)),
                failedRequests: Number(metrics.failedRequests || 0)
            }
        });

    } catch (error) {
        console.error("Analytics error:", error.message);

        return res.status(503).json({
            success: false,
            message: "Analytics are temporarily unavailable"
        });
    }
};export const resetAnalytics = async (req, res) => {
    try {
        if (process.env.NODE_ENV !== "development") {
            return res.status(403).json({
                success: false,
                message: "Analytics reset is only available in development"
            });
        }

        await resetMetrics();

        return res.status(200).json({
            success: true,
            message: "Analytics metrics reset successfully"
        });

    } catch (error) {
        console.error("Analytics reset failed:", error.message);

        return res.status(503).json({
            success: false,
            message: "Unable to reset analytics"
        });
    }
};