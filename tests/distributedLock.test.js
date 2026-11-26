
import test, { mock } from "node:test";
import assert from "node:assert/strict";

let redisSetResult = "OK";
let redisEvalResult = 1;
let lastSetArgs = null;
let lastCommand = null;

mock.module(
    new URL("../src/config/redis.js", import.meta.url).href,
    {
        exports: {
            getRedisClient: () => ({
                set: async (...args) => {
                    lastSetArgs = args;
                    return redisSetResult;
                },
                sendCommand: async (command) => {
                    lastCommand = command;
                    return redisEvalResult;
                }
            })
        }
    }
);

const {
    acquireCacheLock,
    releaseCacheLock,
    renewCacheLock,
    storeCacheEntryWithLock
} = await import("../src/services/vectorStore.js");

test("Acquires lock when Redis returns OK", async () => {
    redisSetResult = "OK";

    const acquired = await acquireCacheLock(
        "lock:test",
        "token-123"
    );

    assert.equal(acquired, true);

    assert.deepEqual(lastSetArgs, [
        "lock:test",
        "token-123",
        {
            NX: true,
            PX: 30000
        }
    ]);
});

test("Rejects lock acquisition when already locked", async () => {
    redisSetResult = null;

    const acquired = await acquireCacheLock(
        "lock:test",
        "token-456"
    );

    assert.equal(acquired, false);
});

test("Releases lock when Redis confirms ownership", async () => {
    redisEvalResult = 1;

    const released = await releaseCacheLock(
        "lock:test",
        "token-123"
    );

    assert.equal(released, true);
    assert.equal(lastCommand[0], "EVAL");
    assert.equal(lastCommand[2], "1");
    assert.equal(lastCommand[3], "lock:test");
    assert.equal(lastCommand[4], "token-123");
});

test("Does not release lock when token mismatches", async () => {
    redisEvalResult = 0;

    const released = await releaseCacheLock(
        "lock:test",
        "wrong-token"
    );

    assert.equal(released, false);
});

test("Renews lock when ownership is valid", async () => {
    redisEvalResult = 1;

    const renewed = await renewCacheLock(
        "lock:test",
        "token-123"
    );

    assert.equal(renewed, true);
    assert.equal(lastCommand[0], "EVAL");
    assert.equal(lastCommand[4], "token-123");
    assert.equal(lastCommand[5], "30000");
});

test("Does not renew a lock owned by another token", async () => {
    redisEvalResult = 0;

    const renewed = await renewCacheLock(
        "lock:test",
        "wrong-token"
    );

    assert.equal(renewed, false);
});


const embedding = Array(768).fill(0.1);

test("Stores cache entry when lock is still owned", async () => {
    redisEvalResult = 1;

    const key = await storeCacheEntryWithLock(
        "What is Java?",
        "Java is a programming language.",
        embedding,
        "lock:test",
        "token-123"
    );

    assert.ok(key.startsWith("cache:"));
    assert.equal(lastCommand[0], "EVAL");
    assert.equal(lastCommand[2], "2");

    // Verify correct lock key and token
    assert.equal(lastCommand[3], "lock:test");
    assert.equal(lastCommand[5], "token-123");

    // Verify that the embedding is stored as binary data
    assert.ok(Buffer.isBuffer(lastCommand[8]));
});

test("Does not store entry if lock ownership is lost", async () => {
    redisEvalResult = 0;

    const key = await storeCacheEntryWithLock(
        "What is Java?",
        "Java is a programming language.",
        embedding,
        "lock:test",
        "wrong-token"
    );

    assert.equal(key, null);
});

test("Rejects invalid embedding dimensions", async () => {
    await assert.rejects(
        storeCacheEntryWithLock(
            "What is Java?",
            "Java is a programming language.",
            [0.1, 0.2],
            "lock:test",
            "token-123"
        ),
        /Embedding must contain 768 values/
    );
});
