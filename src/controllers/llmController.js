import { generateAnswerWithRetry } from "../services/llmService.js";
import { generateEmbedding } from "../services/embeddingService.js";
import {
    storeCacheEntry,
    deleteCacheEntry,
    storeCacheEntryWithLock,
    acquireCacheLock,
    findVerifiedCacheMatch,
    releaseCacheLock,
    renewCacheLock
} from "../services/vectorStore.js";
import { validateQuestion } from "../utils/validateQuestion.js";
import { randomUUID, createHash } from "node:crypto";
import {
    incrementMetric,
    METRIC_NAMES
} from "../services/metricsService.js";

const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
const startLockRenewal = (lockKey, lockToken) => {
    let lockLost = false;
    let stopped = false;
    let renewalInProgress = null;

    const interval = setInterval(() => {
        if (stopped || lockLost || renewalInProgress) {
            return;
        }

        renewalInProgress = (async () => {
            try {
                const renewed = await renewCacheLock(
                    lockKey,
                    lockToken
                );

                if (!renewed) {
                    lockLost = true;
                    console.error("Redis lock ownership lost.");
                }
            } catch (error) {
                lockLost = true;
                console.error("Lock renewal failed:", error.message);
            }
        })().finally(() => {
            renewalInProgress = null;
        });

    }, 10000);

    return {
        stop: async () => {
            stopped = true;
            clearInterval(interval);

            if (renewalInProgress) {
                await renewalInProgress;
            }
        },

        isLockLost: () => lockLost
    };
};
export const askQuestion = async (req, res) => {
    try {
        await incrementMetric(METRIC_NAMES.TOTAL_REQUESTS);
        const validation = validateQuestion(req.body?.question);

        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }

        const question = validation.question;

        let embedding = null;
        let cacheResult = null;
        let redisAvailable = true;
        let lockKey = null;
        let lockToken = null;
        let lockAcquired = false;
        let cacheStored = false;

        // 1. Try generating the embedding
        try {
            embedding = await generateEmbedding(question);

        } catch (error) {
            console.error("Embedding generation failed:", error.message);
            redisAvailable = false;
        }

        // 2. Search Redis only if embedding generation succeeded
        if (redisAvailable && embedding) {
            try {

                cacheResult = await findVerifiedCacheMatch(
                    embedding,
                    question,
                    async (
                        cachedQuestion,
                        incomingQuestion,
                        cachedAnswer,
                        remainingMs
                    ) => {
                        const { validateCachedAnswer } = await import(
                            "../services/answerAwareValidator.js"
                        );

                        return validateCachedAnswer(
                            cachedQuestion,
                            incomingQuestion,
                            cachedAnswer,
                            remainingMs
                        );
                    }
                );

                if (cacheResult.cacheHit) {
                    await incrementMetric(METRIC_NAMES.CACHE_HITS);
                    res.locals.cacheOutcome = "hit";
                    return res.status(200).json({
                        success: true,
                        question,
                        answer: cacheResult.answer,
                        cache: {
                            hit: true,
                            similarity: cacheResult.similarity,
                            redisAvailable: true
                        }
                    });
                }
                // Initial lookup succeeded, but no suitable cached answer exists
                await incrementMetric(METRIC_NAMES.CACHE_MISSES);

            } catch (error) {
                console.error("Redis cache search failed:", error.message);
                redisAvailable = false;
            }
        }
        // 3. Try acquiring a Redis lock
        if (redisAvailable && embedding) {
            try {
                const normalizedQuestion = question.trim().toLowerCase();

                const questionHash = createHash("sha256")
                    .update(normalizedQuestion)
                    .digest("hex");

                lockKey = `lock:${questionHash}`;
                lockToken = randomUUID();

                lockAcquired = await acquireCacheLock(lockKey, lockToken);

                if (lockAcquired) {
                    console.log("Cache lock acquired:", lockKey);
                } else {
                    console.log("Another request is processing this question.");
                }

            } catch (error) {
                console.error("Lock acquisition failed:", error.message);
                redisAvailable = false;
            }
        }
        if (redisAvailable && embedding && !lockAcquired) {
            for (let attempt = 0; attempt < 100; attempt++) {
                await sleep(200);

                try {
                    const match = await findVerifiedCacheMatch(
                        embedding,
                        question
                    );

                    if (match.cacheHit) {
                        await incrementMetric(METRIC_NAMES.CACHE_HITS);
                        res.locals.cacheOutcome = "hit";
                        return res.status(200).json({
                            success: true,
                            question,
                            answer: match.answer,
                            cache: {
                                hit: true,
                                similarity: match.similarity,
                                redisAvailable: true
                            }
                        });
                    }

                    // Try to acquire the lock again
                    lockAcquired = await acquireCacheLock(lockKey, lockToken);

                    if (lockAcquired) {
                        console.log("Cache lock acquired after waiting.");
                        break;
                    }

                } catch (error) {
                    console.error("Lock retry failed:", error.message);
                    redisAvailable = false;
                    break;
                }
            }
        }
        // Stop if another request still owns the lock
        if (redisAvailable && embedding && !lockAcquired) {
            return res.status(503).json({
                success: false,
                message: "This question is already being processed. Please retry shortly."
            });
        }
        // Start renewing the lock while processing
        const lockRenewal = lockAcquired
            ? startLockRenewal(lockKey, lockToken)
            : null;
        try {
            // Recheck the cache after acquiring the lock
            if (redisAvailable && embedding && lockAcquired) {
                try {
                    const match = await findVerifiedCacheMatch(
                        embedding,
                        question
                    );

                    if (match.cacheHit) {
                        await incrementMetric(METRIC_NAMES.CACHE_HITS);
                        res.locals.cacheOutcome = "hit";
                        return res.status(200).json({
                            success: true,
                            question,
                            answer: match.answer,
                            cache: {
                                hit: true,
                                similarity: match.similarity,
                                redisAvailable: true
                            }
                        });
                    }
                } catch (error) {
                    console.error("Cache recheck failed:", error.message);
                    redisAvailable = false;
                }
            }

            // Generate an answer through Gemini
            let answer = await generateAnswerWithRetry(question);
            // Check whether lock renewal failed
            if (lockRenewal?.isLockLost()) {
                console.error("Lock ownership lost. Skipping cache operations.");
                redisAvailable = false;
            }
            // 4. Check Redis again before storing
            if (redisAvailable && embedding) {
                try {

                    const existingMatch = await findVerifiedCacheMatch(
                        embedding,
                        question
                        // No semantic validator: only exact normalized matches
                        // can be accepted here.
                    );

                    if (existingMatch.cacheHit) {
                        // An identical question is already cached.
                        // Keep the newly generated answer unchanged.
                        console.log(
                            "Exact duplicate cache entry detected. Skipping storage."
                        );

                    } else {
                        if (lockAcquired) {
                            const storedKey = await storeCacheEntryWithLock(
                                question,
                                answer,
                                embedding,
                                lockKey,
                                lockToken
                            );

                            if (storedKey) {
                                cacheStored = true;
                                console.log("Cache entry stored:", storedKey);
                            } else {
                                console.log(
                                    "Cache storage skipped because lock ownership was lost."
                                );
                            }
                        } else {
                            console.log("Cache storage skipped: no Redis lock.");
                        }
                    }

                } catch (error) {
                    console.error("Cache storage/deduplication failed:", error.message);
                    redisAvailable = false;
                }
            }


            // 5. Return the answer even if Redis failed
            res.locals.cacheOutcome = "miss";
            return res.status(200).json({
                success: true,
                question,
                answer,
                cache: {
                    hit: false,
                    stored: cacheStored,
                    redisAvailable,
                    message: !redisAvailable
                        ? "Answer generated without caching"
                        : cacheStored
                            ? "Answer generated and stored in cache"
                            : "Answer returned without creating a new cache entry"
                }
            });
        } finally {
            // Stop automatic lock renewal
            if (lockRenewal) {
                await lockRenewal.stop();
            }

            // Release the Redis lock
            if (lockAcquired) {
                try {
                    const released = await releaseCacheLock(lockKey, lockToken);

                    if (released) {
                        console.log("Cache lock released:", lockKey);
                    } else {
                        console.log("Lock was already expired or ownership changed.");
                    }

                } catch (error) {
                    console.error("Failed to release cache lock:", error.message);
                }
            }
        }

    } catch (error) {
        console.error("Controller Error:", error.message);

        const errorText = String(error.message || "");

        const isUnavailable =
            error.status === 503 ||
            error.code === 503 ||
            /"code"\s*:\s*503/.test(errorText) ||
            /UNAVAILABLE|high demand/i.test(errorText);

        return res.status(isUnavailable ? 503 : 500).json({
            success: false,
            message: isUnavailable
                ? "AI service is temporarily unavailable. Please try again later."
                : "Unable to process your request."
        });
    }
};
export const removeCache = async (req, res) => {
    try {
        const { key } = req.params;

        if (!key || !key.startsWith("cache:")) {
            return res.status(400).json({
                success: false,
                message: "Valid cache key is required"
            });
        }

        const deleted = await deleteCacheEntry(key);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Cache entry not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Cache entry deleted successfully"
        });

    } catch (error) {
        console.error("Cache deletion controller error:", error.message);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};