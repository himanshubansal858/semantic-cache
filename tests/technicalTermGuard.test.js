
import test from "node:test";
import assert from "node:assert/strict";

import {
    hasTechnicalConflict
} from "../src/utils/technicalTermGuard.js";

test("Detects BFS vs DFS", () => {
    assert.equal(
        hasTechnicalConflict("Explain BFS", "Explain DFS"),
        true
    );
});

test("Detects stack vs queue", () => {
    assert.equal(
        hasTechnicalConflict("What is a stack?", "What is a queue?"),
        true
    );
});

test("Detects SQL vs NoSQL", () => {
    assert.equal(
        hasTechnicalConflict("Explain SQL", "Explain NoSQL"),
        true
    );
});

test("Allows matching concepts", () => {
    assert.equal(
        hasTechnicalConflict("What is Redis?", "Explain Redis"),
        false
    );
});

test("Allows equivalent technical paraphrases", () => {
    assert.equal(
        hasTechnicalConflict(
            "What is Java?",
            "Explain the Java programming language."
        ),
        false
    );
});
test("Detects expanded BFS vs DFS", () => {
    assert.equal(
        hasTechnicalConflict(
            "Explain breadth-first search.",
            "Explain depth-first search."
        ),
        true
    );
});

test("Detects Redis vs MongoDB", () => {
    assert.equal(
        hasTechnicalConflict(
            "What is Redis?",
            "What is MongoDB?"
        ),
        true
    );
});