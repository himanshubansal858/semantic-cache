
import test from "node:test";
import assert from "node:assert/strict";

import { selectCacheCandidate } from "../src/utils/selectCacheCandidate.js";
import { validateSemanticMatch } from "../src/services/matchValidator.js";

test("Rejects an incorrect nearest candidate", async () => {
    const candidates = [
        {
            question: "What is a binary tree?",
            answer: "A binary tree has at most two children.",
            similarity: 0.961
        },
        {
            question: "What is a binary search tree?",
            answer: "A BST maintains an ordering property.",
            similarity: 0.945
        }
    ];

    const result = await selectCacheCandidate(
        "What is a binary search tree?",
        candidates,
        validateSemanticMatch
    );

    assert.equal(result.cacheHit, true);
    assert.equal(
        result.answer,
        "A BST maintains an ordering property."
    );
});

test("Rejects candidates that are not equivalent", async () => {
    const candidates = [
        {
            question: "Explain breadth-first search.",
            answer: "BFS explores nodes level by level.",
            similarity: 0.927
        }
    ];

    const result = await selectCacheCandidate(
        "Explain depth-first search.",
        candidates,
        validateSemanticMatch
    );

    assert.equal(result.cacheHit, false);
});

test("Exact-match baseline rejects valid paraphrases", async () => {
    const candidates = [
        {
            question: "What is Java?",
            answer: "Java is a programming language.",
            similarity: 0.934
        }
    ];

    const result = await selectCacheCandidate(
        "Explain the Java programming language.",
        candidates,
        validateSemanticMatch
    );

    assert.equal(result.cacheHit, false);
});
