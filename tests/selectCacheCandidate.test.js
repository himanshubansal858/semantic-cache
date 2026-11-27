
import test from "node:test";
import assert from "node:assert/strict";

import {
    selectCacheCandidate
} from "../src/utils/selectCacheCandidate.js";

const candidates = [
    {
        question: "What is a binary tree?",
        answer: "A binary tree has at most two children per node.",
        similarity: 0.961
    },
    {
        question: "Define a binary search tree.",
        answer: "A BST maintains an ordering property.",
        similarity: 0.945
    },
    {
        question: "What is an AVL tree?",
        answer: "An AVL tree is a self-balancing BST.",
        similarity: 0.921
    }
];

test("Selects a valid candidate even if it is not nearest", async () => {
    const validator = async (original) => ({
        valid: original === "Define a binary search tree.",
        reason: "Equivalent question"
    });

    const result = await selectCacheCandidate(
        "What is a binary search tree?",
        candidates,
        validator
    );

    assert.equal(result.cacheHit, true);
    assert.equal(
        result.answer,
        "A BST maintains an ordering property."
    );
});

test("Returns a miss when no candidate passes validation", async () => {
    const validator = async () => ({
        valid: false,
        reason: "Different question"
    });

    const result = await selectCacheCandidate(
        "What is a binary search tree?",
        candidates,
        validator
    );

    assert.equal(result.cacheHit, false);
});

test("Skips candidates below the similarity threshold", async () => {
    let calls = 0;

    const validator = async () => {
        calls++;
        return { valid: true };
    };

    const result = await selectCacheCandidate(
        "What is Java?",
        [{ question: "What is Python?", similarity: 0.75 }],
        validator
    );

    assert.equal(result.cacheHit, false);
    assert.equal(calls, 0);
});

test("Returns a miss for an empty candidate list", async () => {
    const validator = async () => ({ valid: true });

    const result = await selectCacheCandidate(
        "What is Java?",
        [],
        validator
    );

    assert.equal(result.cacheHit, false);
});

test("Exact normalized match skips the validator", async () => {
    let validatorCalls = 0;

    const validator = async () => {
        validatorCalls++;
        return { valid: false };
    };

    const candidates = [
        {
            question: "  WHAT   IS   JAVA?  ",
            answer: "Java is a programming language.",
            similarity: 0.99
        }
    ];

    const result = await selectCacheCandidate(
        "what is java?",
        candidates,
        validator
    );

    assert.equal(result.cacheHit, true);
    assert.equal(
        result.answer,
        "Java is a programming language."
    );
    assert.equal(validatorCalls, 0);
    assert.equal(
        result.validationReason,
        "Exact normalized question match"
    );
});
