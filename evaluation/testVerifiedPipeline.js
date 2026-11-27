
import "dotenv/config";

import {
    selectVerifiedCandidate
} from "../src/utils/selectVerifiedCandidate.js";

import {
    validateCachedAnswer
} from "../src/services/answerAwareValidator.js";

const incomingQuestion = "Why do databases use indexes?";

const candidates = [
    {
        key: "test:1",
        question: "What is database indexing?",
        answer: "An index is a separate data structure maintained by a database.",
        similarity: 0.97
    },
    {
        key: "test:2",
        question: "Explain the purpose of database indexes.",
        answer: "Indexes speed up record lookup and query execution by reducing the need to scan entire tables.",
        similarity: 0.94
    }
];

let validatorCalls = 0;

const validator = async (
    cachedQuestion,
    newQuestion,
    cachedAnswer
) => {
    validatorCalls++;

    const start = performance.now();

    const result = await validateCachedAnswer(
        cachedQuestion,
        newQuestion,
        cachedAnswer
    );

    console.log({
        candidate: cachedQuestion,
        result,
        latencyMs: Number(
            (performance.now() - start).toFixed(2)
        )
    });

    return result;
};

const start = performance.now();

const result = await selectVerifiedCandidate(
    incomingQuestion,
    candidates,
    validator
);

console.log("\nFinal result:", result);
console.log("Validator calls:", validatorCalls);
console.log(
    "Total latency:",
    (performance.now() - start).toFixed(2),
    "ms"
);

if (
    result.cacheHit !== true ||
    result.key !== "test:2"
) {
    console.error("Pipeline did not select the expected candidate.");
    process.exitCode = 1;
}
