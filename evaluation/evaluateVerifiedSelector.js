
import { technicalPairs } from "./technicalPairs.js";
import { selectVerifiedCandidate } from "../src/utils/selectVerifiedCandidate.js";

let tp = 0;
let tn = 0;
let fp = 0;
let fn = 0;
let totalLatency = 0;

for (const [index, pair] of technicalPairs.entries()) {
    const candidates = [{
        question: pair.question1,
        answer: "Cached answer for evaluation",
        similarity: 0.95
    }];

    const start = performance.now();

    // No semantic validator: measure the conservative baseline.
    const result = await selectVerifiedCandidate(
        pair.question2,
        candidates
    );

    const latency = performance.now() - start;
    totalLatency += latency;

    const predicted = result.cacheHit;
    const expected = pair.expectedMatch;

    if (predicted && expected) tp++;
    else if (!predicted && !expected) tn++;
    else if (predicted) fp++;
    else fn++;

    console.log({
        case: index + 1,
        expected,
        predicted,
        latencyMs: Number(latency.toFixed(3))
    });
}

const total = technicalPairs.length;

console.log("\nVerified Selector Results:", {
    accuracy: `${(((tp + tn) / total) * 100).toFixed(2)}%`,
    precision: tp + fp
        ? `${((tp / (tp + fp)) * 100).toFixed(2)}%`
        : "N/A",
    recall: tp + fn
        ? `${((tp / (tp + fn)) * 100).toFixed(2)}%`
        : "N/A",
    averageLatencyMs: Number((totalLatency / total).toFixed(3)),
    tp, tn, fp, fn
});
