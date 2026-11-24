
import "dotenv/config";

import { evaluationDataset } from "./dataset.js";
import { validateMatchWithLLM } from "../src/services/matchValidator.js";

let tp = 0, tn = 0, fp = 0, fn = 0;
let totalTimeMs = 0;
let failedValidations = 0;
let successfulTimeMs = 0;

for (const [index, item] of evaluationDataset.entries()) {
    const start = performance.now();

    const result = await validateMatchWithLLM(
        item.question1,
        item.question2
    );

    const elapsed = performance.now() - start;
    if (result.error) {
        failedValidations++;

        console.log({
            case: index + 1,
            status: "API_ERROR",
            reason: result.reason
        });

        continue;
    }

    successfulTimeMs += elapsed;

    const predicted = result.valid;
    const expected = item.expectedMatch;

    if (predicted && expected) tp++;
    else if (!predicted && !expected) tn++;
    else if (predicted && !expected) fp++;
    else fn++;

    console.log({
        case: index + 1,
        expected,
        predicted,
        correct: predicted === expected,
        reason: result.reason,
        latencyMs: elapsed.toFixed(2)
    });
}

const evaluated = tp + tn + fp + fn;

const accuracy = evaluated
    ? (tp + tn) / evaluated * 100
    : 0;

const averageTime = evaluated
    ? successfulTimeMs / evaluated
    : 0;

console.log(`Evaluated: ${evaluated}`);
console.log(`API Failures: ${failedValidations}`);
