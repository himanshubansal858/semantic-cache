
import test from "node:test";
import assert from "node:assert/strict";

import {
    selectVerifiedCandidate
} from "../src/utils/selectVerifiedCandidate.js";

test("Accepts exact normalized match without AI validation", async () => {
    const candidates = [{
        question: "  WHAT IS JAVA? ",
        answer: "Java is a programming language.",
        similarity: 0.99
    }];

    const result = await selectVerifiedCandidate(
        "what is java?",
        candidates
    );

    assert.equal(result.cacheHit, true);
});

test("Rejects a known technical conflict", async () => {
    const candidates = [{
        question: "Explain BFS",
        answer: "BFS explores nodes level by level.",
        similarity: 0.95
    }];

    const result = await selectVerifiedCandidate(
        "Explain DFS",
        candidates
    );

    assert.equal(result.cacheHit, false);
});

test("Does not accept UNKNOWN without semantic validation", async () => {
    const candidates = [{
        question: "What is a binary tree?",
        answer: "A binary tree has at most two children.",
        similarity: 0.961
    }];

    const result = await selectVerifiedCandidate(
        "What is a binary search tree?",
        candidates
    );

    assert.equal(result.cacheHit, false);
});

test("Can select a lower-ranked verified candidate", async () => {
    const candidates = [
        {
            question: "What is a binary tree?",
            answer: "Binary tree answer.",
            similarity: 0.961
        },
        {
            question: "What is a binary search tree?",
            answer: "BST answer.",
            similarity: 0.945
        }
    ];

    const result = await selectVerifiedCandidate(
        "What is a binary search tree?",
        candidates
    );

    assert.equal(result.cacheHit, true);
    assert.equal(result.answer, "BST answer.");
});

test("Accepts paraphrase when semantic validator approves", async () => {
    const candidates = [{
        question: "What is Java?",
        answer: "Java is a programming language.",
        similarity: 0.934
    }];

    const validator = async () => ({
        valid: true,
        reason: "Equivalent questions"
    });

    const result = await selectVerifiedCandidate(
        "Explain the Java programming language.",
        candidates,
        validator
    );

    assert.equal(result.cacheHit, true);
});

test("Rejects uncertain matches when validator fails", async () => {
    const candidates = [{
        question: "What is Java?",
        answer: "Java answer.",
        similarity: 0.934
    }];

    const validator = async () => {
        throw new Error("Validator unavailable");
    };

    const result = await selectVerifiedCandidate(
        "Explain the Java programming language.",
        candidates,
        validator
    );

    assert.equal(result.cacheHit, false);
});

test("Passes cached answer to answer-aware validator", async () => {
    const candidates = [
        {
            question: "What is database indexing?",
            answer: "An index is a separate data structure.",
            similarity: 0.95
        }
    ];

    let receivedAnswer = null;

    const validator = async (
        cachedQuestion,
        incomingQuestion,
        cachedAnswer
    ) => {
        receivedAnswer = cachedAnswer;

        return {
            valid: false,
            reason: "Answer does not explain why indexes are used"
        };
    };

    const result = await selectVerifiedCandidate(
        "Why do databases use indexes?",
        candidates,
        validator
    );

    assert.equal(
        receivedAnswer,
        "An index is a separate data structure."
    );

    assert.equal(result.cacheHit, false);
});

test("Passes decreasing time budgets to candidates", async () => {
    const candidates = [
        {
            question: "Explain database indexing.",
            answer: "An index is a data structure.",
            similarity: 0.97
        },
        {
            question: "Explain database indexes.",
            answer: "Indexes accelerate database queries.",
            similarity: 0.95
        }
    ];

    const receivedBudgets = [];

    const validator = async (
        cachedQuestion,
        incomingQuestion,
        cachedAnswer,
        remainingMs
    ) => {
        receivedBudgets.push(remainingMs);

        // Simulate validation processing time.
        await new Promise(resolve => setTimeout(resolve, 100));

        return {
            valid: false,
            reason: "Insufficient answer"
        };
    };

    const result = await selectVerifiedCandidate(
        "Why are database indexes useful?",
        candidates,
        validator
    );

    assert.equal(result.cacheHit, false);
    assert.equal(receivedBudgets.length, 2);

    // Second candidate must receive less time.
    assert.ok(receivedBudgets[1] < receivedBudgets[0]);

    // Neither candidate should exceed the initial budget.
    assert.ok(receivedBudgets[0] <= 2000);
    assert.ok(receivedBudgets[1] > 0);
});


test("Stops waiting when validator exceeds total deadline", async () => {
    const candidates = [{
        question: "Explain database indexes.",
        answer: "Indexes accelerate database queries.",
        similarity: 0.95
    }];

    // Deliberately ignores the timeout argument.
    const slowValidator = async () => {
        await new Promise(resolve => setTimeout(resolve, 3000));
        return { valid: true };
    };

    const start = performance.now();

    const result = await selectVerifiedCandidate(
        "Why do databases use indexes?",
        candidates,
        slowValidator
    );

    const elapsed = performance.now() - start;

    assert.equal(result.cacheHit, false);
    assert.ok(
        elapsed < 2500,
        `Selector exceeded deadline: ${elapsed.toFixed(0)} ms`
    );
});
