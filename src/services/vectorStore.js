import { randomUUID } from "node:crypto";
import { getRedisClient } from "../config/redis.js";
import { evaluateCacheMatch } from "../utils/cacheDecision.js";

const INDEX_NAME = "idx:semantic_cache";

export const createVectorIndex = async () => {
    try {
        const client = getRedisClient();

        // Check whether the index already exists
        const indexes = await client.sendCommand(["FT._LIST"]);

        if (indexes.includes(INDEX_NAME)) {
            console.log("Vector index already exists:", INDEX_NAME);
            return;
        }

        // Create the vector index
        await client.sendCommand([
            "FT.CREATE",
            INDEX_NAME,
            "ON", "HASH",
            "PREFIX", "1", "cache:",
            "SCHEMA",
            "question", "TEXT",
            "answer", "TEXT",
            "embedding", "VECTOR",
            "FLAT", "6",
            "TYPE", "FLOAT32",
            "DIM", "768",
            "DISTANCE_METRIC", "COSINE"
        ]);

        console.log("Vector index created successfully:", INDEX_NAME);

    } catch (error) {
        console.error("Vector index creation failed:", error.message);
        throw error;
    }
};

export const storeCacheEntry = async (question, answer, embedding) => {
    try {
        const client = getRedisClient();

        if (!question?.trim() || !answer?.trim()) {
            throw new Error("Question and answer are required");
        }

        if (embedding.length !== 768) {
            throw new Error("Embedding must contain 768 values");
        }

        // Generate a unique Redis key
        const key = `cache:${randomUUID()}`;

        // Convert embedding into FLOAT32 binary data
        const embeddingBuffer = Buffer.from(
            new Float32Array(embedding).buffer
        );

        // Store all three fields in a Redis Hash
        await client.hSet(key, {
            question,
            answer,
            embedding: embeddingBuffer
        });
        // Set cache expiration to 24 hours
        await client.expire(key, 86400);

        console.log("Cache entry stored:", key);

        return key;

    } catch (error) {
        console.error("Redis storage error:", error.message);
        throw error;
    }
};

export const getCacheEntry = async (key) => {
    try {
        const client = getRedisClient();

        const question = await client.hGet(key, "question");
        const answer = await client.hGet(key, "answer");

        if (!question || !answer) {
            return null;
        }

        return {
            key,
            question,
            answer
        };

    } catch (error) {
        console.error("Redis retrieval error:", error.message);
        throw error;
    }
};


export const searchSimilarCache = async (embedding) => {
    try {
        const client = getRedisClient();

        if (embedding.length !== 768) {
            throw new Error("Embedding must contain 768 values");
        }

        const queryBuffer = Buffer.from(
            new Float32Array(embedding).buffer
        );

        const result = await client.sendCommand([
            "FT.SEARCH",
            INDEX_NAME,
            "*=>[KNN 1 @embedding $query_vector AS distance]",
            "PARAMS",
            "2",
            "query_vector",
            queryBuffer,
            "SORTBY",
            "distance",
            "RETURN",
            "3",
            "question",
            "answer",
            "distance",
            "DIALECT",
            "2"
        ]);

        if (result.total_results === 0) {
            return null;
        }

        const matchedEntry = result.results[0];
        const attributes = matchedEntry.extra_attributes;

        const distance = Number(attributes.distance);
        const similarity = Math.max(0, Math.min(1, 1 - distance));

        return {
            key: matchedEntry.id,
            question: attributes.question,
            answer: attributes.answer,
            similarity
        };

    } catch (error) {
        console.error("Vector search error:", error.message);
        throw error;
    }
};

export const findCacheMatch = async (embedding) => {
    const match = await searchSimilarCache(embedding);
    return evaluateCacheMatch(match);
};
export const deleteCacheEntry = async (key) => {
    try {
        const client = getRedisClient();

        const result = await client.del(key);

        return result === 1;

    } catch (error) {
        console.error("Cache deletion error:", error.message);
        throw error;
    }
};

export const acquireCacheLock = async (lockKey, token) => {
    const client = getRedisClient();

    const result = await client.set(lockKey, token, {
        NX: true,
        PX: 30000
    });

    return result === "OK";
};

export const releaseCacheLock = async (lockKey, token) => {
    const client = getRedisClient();

    const result = await client.sendCommand([
        "EVAL",
        `
        if redis.call("GET", KEYS[1]) == ARGV[1] then
            return redis.call("DEL", KEYS[1])
        else
            return 0
        end
        `,
        "1",
        lockKey,
        token
    ]);

    return result === 1;
};

export const renewCacheLock = async (lockKey, token) => {
    const client = getRedisClient();

    const result = await client.sendCommand([
        "EVAL",
        `
        if redis.call("GET", KEYS[1]) == ARGV[1] then
            return redis.call("PEXPIRE", KEYS[1], ARGV[2])
        else
            return 0
        end
        `,
        "1",
        lockKey,
        token,
        "30000"
    ]);

    return result === 1;
};

export const storeCacheEntryWithLock = async (
    question,
    answer,
    embedding,
    lockKey,
    lockToken
) => {
    const client = getRedisClient();

    if (!question?.trim() || !answer?.trim()) {
        throw new Error("Question and answer are required");
    }

    if (embedding?.length !== 768) {
        throw new Error("Embedding must contain 768 values");
    }

    const cacheKey = `cache:${randomUUID()}`;

    const embeddingBuffer = Buffer.from(
        new Float32Array(embedding).buffer
    );

    const result = await client.sendCommand([
        "EVAL",
        `
        if redis.call("GET", KEYS[1]) ~= ARGV[1] then
            return 0
        end

        redis.call(
            "HSET",
            KEYS[2],
            "question", ARGV[2],
            "answer", ARGV[3],
            "embedding", ARGV[4]
        )

        redis.call("EXPIRE", KEYS[2], 86400)

        return 1
        `,
        "2",
        lockKey,
        cacheKey,
        lockToken,
        question,
        answer,
        embeddingBuffer
    ]);

    return result === 1 ? cacheKey : null;
};