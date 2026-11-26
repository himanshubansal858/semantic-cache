
import test from "node:test";
import assert from "node:assert/strict";

import {
    validateSemanticMatch
} from "../src/services/matchValidator.js";

// Test 1: Identical questions
test("Accepts identical questions", async () => {
    const result = await validateSemanticMatch(
        "What is Java?",
        "What is Java?"
    );

    assert.equal(result.valid, true);
});

// Test 2: Ignore capitalization and extra spaces
test("Accepts questions with different casing and spacing", async () => {
    const result = await validateSemanticMatch(
        "What is Java?",
        "  WHAT   IS   JAVA?  "
    );

    assert.equal(result.valid, true);
});

// Test 3: Reject different concepts
test("Rejects binary tree vs binary search tree", async () => {
    const result = await validateSemanticMatch(
        "What is a binary tree?",
        "What is a binary search tree?"
    );

    assert.equal(result.valid, false);
});

// Test 4: Reject paraphrases in the exact-match baseline
test("Rejects paraphrases in the exact-match baseline", async () => {
    const result = await validateSemanticMatch(
        "What is Java?",
        "Explain the Java programming language."
    );

    assert.equal(result.valid, false);
});

// Test 5: Reject empty questions
test("Rejects empty questions", async () => {
    const result = await validateSemanticMatch(
        "",
        "What is Java?"
    );

    assert.equal(result.valid, false);
});

// Test 6: Reject invalid input types
test("Rejects non-string inputs", async () => {
    const result = await validateSemanticMatch(
        null,
        "What is Java?"
    );

    assert.equal(result.valid, false);
});
