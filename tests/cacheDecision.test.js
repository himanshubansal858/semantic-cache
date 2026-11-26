
import test from "node:test";
import assert from "node:assert/strict";

import {
    evaluateCacheMatch
} from "../src/utils/cacheDecision.js";

test("Returns cache miss when no entry exists", () => {
    const result = evaluateCacheMatch(null);

    assert.equal(result.cacheHit, false);
});

test("Accepts a similarity above 0.90", () => {
    const result = evaluateCacheMatch({
        key: "cache:test",
        question: "What is Java?",
        answer: "Java is a programming language.",
        similarity: 0.95
    });

    assert.equal(result.cacheHit, true);
    assert.equal(
        result.answer,
        "Java is a programming language."
    );
});

test("Accepts a similarity exactly at 0.90", () => {
    const result = evaluateCacheMatch({
        similarity: 0.90
    });

    assert.equal(result.cacheHit, true);
});

test("Rejects a similarity below 0.90", () => {
    const result = evaluateCacheMatch({
        similarity: 0.899
    });

    assert.equal(result.cacheHit, false);
});

test("Returns the similarity for a rejected match", () => {
    const result = evaluateCacheMatch({
        similarity: 0.75
    });

    assert.equal(result.similarity, 0.75);
    assert.equal(result.cacheHit, false);
});
