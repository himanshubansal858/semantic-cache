
import test from "node:test";
import assert from "node:assert/strict";

import {
    preValidateMatch
} from "../src/utils/preValidateMatch.js";

test("Accepts exact normalized questions", () => {
    const result = preValidateMatch(
        "  WHAT IS JAVA? ",
        "what is java?"
    );

    assert.equal(result.status, "ACCEPT");
});

test("Rejects known conflicting terms", () => {
    const result = preValidateMatch(
        "Explain BFS",
        "Explain DFS"
    );

    assert.equal(result.status, "REJECT");
});

test("Does not assume unrelated questions are equivalent", () => {
    const result = preValidateMatch(
        "What is Java?",
        "How does garbage collection work?"
    );

    assert.equal(result.status, "UNKNOWN");
});

test("Leaves valid paraphrases for semantic validation", () => {
    const result = preValidateMatch(
        "What is Java?",
        "Explain the Java programming language."
    );

    assert.equal(result.status, "UNKNOWN");
});

test("Does not accept binary tree vs BST", () => {
    const result = preValidateMatch(
        "What is a binary tree?",
        "What is a binary search tree?"
    );

    assert.notEqual(result.status, "ACCEPT");
});
