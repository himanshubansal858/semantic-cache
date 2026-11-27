
import {
    AutoTokenizer,
    AutoModelForSequenceClassification
} from "@huggingface/transformers";

import { heldOutPairs } from "./heldOutPairs.js";

const modelId = "Xenova/nli-deberta-v3-xsmall";

console.log("Loading NLI model...");

const tokenizer = await AutoTokenizer.from_pretrained(modelId);

const model = await AutoModelForSequenceClassification.from_pretrained(
    modelId,
    { dtype: "q8" }
);

const labels = model.config.id2label;

const entailmentIndex = Object.entries(labels)
    .find(([, label]) =>
        label.toLowerCase() === "entailment"
    )?.[0];

if (entailmentIndex === undefined) {
    throw new Error("Entailment label not found");
}

const softmax = (values) => {
    const max = Math.max(...values);
    const exp = values.map(x => Math.exp(x - max));
    const total = exp.reduce((a, b) => a + b, 0);

    return exp.map(x => x / total);
};

const getEntailmentScore = async (first, second) => {
    const inputs = tokenizer(first, {
        text_pair: second,
        truncation: true
    });

    const output = await model(inputs);
    const logits = Array.from(output.logits.data);

    return softmax(logits)[Number(entailmentIndex)];
};

let tp = 0;
let tn = 0;
let fp = 0;
let fn = 0;

const threshold = 0.50;
let totalLatency = 0;

console.log("Starting evaluation...");

for (const [index, pair] of heldOutPairs.entries()) {
    const start = performance.now();

    const forward = await getEntailmentScore(
        pair.question1,
        pair.question2
    );

    const backward = await getEntailmentScore(
        pair.question2,
        pair.question1
    );

    const latency = performance.now() - start;
    totalLatency += latency;

    const score = Math.min(forward, backward);
    const predicted = score >= threshold;
    const expected = pair.expectedMatch;

    if (predicted && expected) tp++;
    else if (!predicted && !expected) tn++;
    else if (predicted) fp++;
    else fn++;

    console.log({
        case: index + 1,
        expected,
        predicted,
        forward: Number(forward.toFixed(4)),
        backward: Number(backward.toFixed(4)),
        score: Number(score.toFixed(4))
    });
}

const total = heldOutPairs.length;

console.log("\nBidirectional NLI Results:", {
    accuracy: `${(((tp + tn) / total) * 100).toFixed(2)}%`,
    precision: tp + fp
        ? `${((tp / (tp + fp)) * 100).toFixed(2)}%`
        : "N/A",
    recall: tp + fn
        ? `${((tp / (tp + fn)) * 100).toFixed(2)}%`
        : "N/A",
    averageLatencyMs: Number(
        (totalLatency / total).toFixed(2)
    ),
    tp, tn, fp, fn
});
