
import { technicalPairs } from "./technicalPairs.js";

import {
    hasTechnicalConflict
} from "../src/utils/technicalTermGuard.js";

let tp = 0;
let tn = 0;
let fp = 0;
let fn = 0;

for (const [index, pair] of technicalPairs.entries()) {
    const conflict = hasTechnicalConflict(
        pair.question1,
        pair.question2
    );

    // Experimental heuristic:
    // No detected conflict is treated as a match.
    const predicted = !conflict;
    const expected = pair.expectedMatch;

    if (predicted && expected) tp++;
    else if (!predicted && !expected) tn++;
    else if (predicted) fp++;
    else fn++;

    console.log({
        case: index + 1,
        expected,
        predicted,
        conflict
    });
}

const total = tp + tn + fp + fn;

console.log("\nTechnical Guard Evaluation:", {
    accuracy: `${(((tp + tn) / total) * 100).toFixed(2)}%`,
    precision: tp + fp
        ? `${((tp / (tp + fp)) * 100).toFixed(2)}%`
        : "N/A",
    recall: tp + fn
        ? `${((tp / (tp + fn)) * 100).toFixed(2)}%`
        : "N/A",
    tp,
    tn,
    fp,
    fn
});
