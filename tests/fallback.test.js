
import test, { mock } from "node:test";
import assert from "node:assert/strict";

let embeddingFails = false;
let searchFails = false;
let geminiFails = false;

const service = (path) =>
    new URL(path, import.meta.url).href;

mock.module(service("../src/services/embeddingService.js"), {
    exports: {
        generateEmbedding: async () => {
            if (embeddingFails) {
                throw new Error("Embedding unavailable");
            }
            return Array(768).fill(0.1);
        }
    }
});

mock.module(service("../src/services/llmService.js"), {
    exports: {
        generateAnswerWithRetry: async () => {
            if (geminiFails) {
                throw new Error("Gemini unavailable");
            }
            return "Mocked Gemini answer";
        }
    }
});

mock.module(service("../src/services/metricsService.js"), {
    exports: {
        METRIC_NAMES: {
            TOTAL_REQUESTS: "totalRequests",
            CACHE_HITS: "cacheHits",
            CACHE_MISSES: "cacheMisses"
        },
        incrementMetric: async () => {}
    }
});


mock.module(service("../src/services/vectorStore.js"), {
    exports: {
        findCacheMatch: async () => {
            if (searchFails) {
                throw new Error("Redis unavailable");
            }
            return { cacheHit: false };
        },

        findVerifiedCacheMatch: async () => {
            if (searchFails) {
                throw new Error("Redis unavailable");
            }
            return { cacheHit: false };
        },

        storeCacheEntry: async () => null,
        deleteCacheEntry: async () => false,
        storeCacheEntryWithLock: async () => null,
        acquireCacheLock: async () => false,
        releaseCacheLock: async () => true,
        renewCacheLock: async () => true
    }
});


const { askQuestion } = await import(
    "../src/controllers/llmController.js"
);

function createMockResponse() {
    return {
        statusCode: 200,
        body: null,
        locals: {},
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        }
    };
}

test("Embedding failure falls back to Gemini", async () => {
    embeddingFails = true;
    searchFails = false;
    geminiFails = false;

    const req = { body: { question: "What is Java?" } };
    const res = createMockResponse();

    await askQuestion(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.answer, "Mocked Gemini answer");
    assert.equal(res.body.cache.hit, false);
    assert.equal(res.body.cache.redisAvailable, false);
});

test("Redis search failure falls back to Gemini", async () => {
    embeddingFails = false;
    searchFails = true;
    geminiFails = false;

    const req = { body: { question: "What is Java?" } };
    const res = createMockResponse();

    await askQuestion(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.cache.redisAvailable, false);
    assert.equal(res.locals.cacheOutcome, "miss");
});


test("Gemini unavailability returns HTTP 503", async () => {
    embeddingFails = true;
    searchFails = false;
    geminiFails = true;

    const req = {
        body: { question: "What is Java?" }
    };

    const res = createMockResponse();

    await askQuestion(req, res);

    assert.equal(res.statusCode, 503);
    assert.equal(res.body.success, false);

    assert.equal(
        res.body.message,
        "AI service is temporarily unavailable. Please try again later."
    );
});

