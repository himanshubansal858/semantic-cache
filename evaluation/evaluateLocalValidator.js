
import {
    AutoTokenizer,
    AutoModelForSequenceClassification
} from "@huggingface/transformers";

import { evaluationDataset } from "./dataset.js";

const modelId = "cross-encoder/quora-distilroberta-base";

console.log("Loading model...");

const tokenizer = await AutoTokenizer.from_pretrained(modelId);

const model = await AutoModelForSequenceClassification.from_pretrained(
    modelId,
    { dtype: "fp32" }
);

console.log("Model loaded. Starting evaluation...");

const sigmoid = (value) => 1 / (1 + Math.exp(-value));

let tp = 0;
let tn = 0;
let fp = 0;
let fn = 0;
let totalLatency = 0;

for (const [index, item] of evaluationDataset.entries()) {
    const start = performance.now();

    const inputs = tokenizer(item.question1, {
        text_pair: item.question2,
        truncation: true
    });

    const output = await model(inputs);

    const latency = performance.now() - start;
    totalLatency += latency;

    const logit = Number(output.logits.data[0]);
    const score = sigmoid(logit);

    const predicted = score >= 0.50;
    const expected = item.expectedMatch;

    if (predicted && expected) tp++;
    else if (!predicted && !expected) tn++;
    else if (predicted && !expected) fp++;
    else fn++;

    console.log({
        case: index + 1,
        expected,
        predicted,
        score: Number(score.toFixed(4)),
        latencyMs: Number(latency.toFixed(2))
    });
}

const evaluated = tp + tn + fp + fn;

const accuracy = (tp + tn) / evaluated * 100;
const precision = tp + fp ? tp / (tp + fp) * 100 : null;
const recall = tp + fn ? tp / (tp + fn) * 100 : 0;

console.log("\nLocal Validator Results");
console.log({ tp, tn, fp, fn });
console.log(`Accuracy: ${accuracy.toFixed(2)}%`);
console.log(
    `Precision: ${precision === null ? "N/A" : precision.toFixed(2) + "%"}`
);
console.log(`Recall: ${recall.toFixed(2)}%`);
console.log(
    `Average inference latency: ${(totalLatency / evaluated).toFixed(2)} ms`
);
