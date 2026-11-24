
import "dotenv/config";

import { validateMatchWithLLM } from "../src/services/matchValidator.js";

const testCases = [
    {
        original: "What is a binary tree?",
        incoming: "What is a binary search tree?",
        expected: false
    },
    {
        original: "What is Java?",
        incoming: "Explain the Java programming language.",
        expected: true
    }
];

const runTests = async () => {
    for (const test of testCases) {
        console.log("\nTesting:");
        console.log("Original:", test.original);
        console.log("Incoming:", test.incoming);

        const start = performance.now();

        const result = await validateMatchWithLLM(
            test.original,
            test.incoming
        );

        const duration = performance.now() - start;

        console.log("Expected:", test.expected);
        console.log("Predicted:", result.valid);
        console.log("Reason:", result.reason);
        console.log("Correct:", result.valid === test.expected);
        console.log("Validation Time:", duration.toFixed(2), "ms");
    }
};

runTests().catch(error => {
    console.error("Test failed:", error.message);
    process.exitCode = 1;
});
