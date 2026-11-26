
import test from "node:test";
import assert from "node:assert/strict";

import {
    validateQuestion,
    MAX_QUESTION_LENGTH
} from "../src/utils/validateQuestion.js";

test("Accepts a valid question", () => {
    const result = validateQuestion("What is Java?");

    assert.equal(result.valid, true);
    assert.equal(result.question, "What is Java?");
});

test("Trims extra whitespace", () => {
    const result = validateQuestion("  What is Java?  ");

    assert.equal(result.valid, true);
    assert.equal(result.question, "What is Java?");
});

test("Rejects empty questions", () => {
    const result = validateQuestion("   ");

    assert.equal(result.valid, false);
});

test("Rejects non-string input", () => {
    assert.equal(validateQuestion(null).valid, false);
    assert.equal(validateQuestion(123).valid, false);
    assert.equal(validateQuestion({}).valid, false);
});

test("Accepts the maximum allowed length", () => {
    const result = validateQuestion("a".repeat(MAX_QUESTION_LENGTH));

    assert.equal(result.valid, true);
});

test("Rejects questions exceeding the limit", () => {
    const result = validateQuestion("a".repeat(MAX_QUESTION_LENGTH + 1));

    assert.equal(result.valid, false);
});
