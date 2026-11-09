import { generateAnswer } from "../services/llmService.js";
import { generateEmbedding } from "../services/embeddingService.js";
import {
    findCacheMatch,
    storeCacheEntry,
    deleteCacheEntry
} from "../services/vectorStore.js";

export const askQuestion = async (req, res) => {
    try {
        const { question } = req.body || {};

        if (typeof question !== "string" || !question.trim()) {
            return res.status(400).json({
                success: false,
                message: "A valid question is required"
            });
        }

        let embedding = null;
        let cacheResult = null;
        let redisAvailable = true;

        // 1. Try generating the embedding
        try {
            embedding = await generateEmbedding(question);

        } catch (error) {
            console.error("Embedding generation failed:", error.message);
            redisAvailable = false;
        }

        // 2. Search Redis only if embedding generation succeeded
        if (embedding) {
            try {
                cacheResult = await findCacheMatch(embedding);

                if (cacheResult.cacheHit) {
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

            } catch (error) {
                console.error("Redis cache search failed:", error.message);
                redisAvailable = false;
            }
        }

        // 3. Generate answer through Gemini
        const answer = await generateAnswer(question);

        // 4. Store the result only if cache operations are available
        if (redisAvailable && embedding) {
            try {
                await storeCacheEntry(question, answer, embedding);

            } catch (error) {
                console.error("Cache storage failed:", error.message);
                redisAvailable = false;
            }
        }

        // 5. Return the answer even if Redis failed
        return res.status(200).json({
            success: true,
            question,
            answer,
            cache: {
                hit: false,
                redisAvailable,
                message: redisAvailable
                    ? "Answer generated and stored in cache"
                    : "Answer generated without caching"
            }
        });

    } catch (error) {
        console.error("Controller Error:", error.message);

        return res.status(500).json({
            success: false,
            message: error.message
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