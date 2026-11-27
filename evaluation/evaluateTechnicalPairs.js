
import {
    AutoTokenizer,
    AutoModelForSequenceClassification
} from "@huggingface/transformers";

import { technicalPairs } from "./technicalPairs.js";

const modelId = "cross-encoder/quora-distilroberta-base";

const tokenizer = await AutoTokenizer.from_pretrained(modelId);

const model = await AutoModelForSequenceClassification.from_pretrained(
    modelId,
    { dtype: "fp32" }
);

const sigmoid = (x) => 1 / (1 + Math.exp(-x));

let tp = 0, tn = 0, fp = 0, fn = 0;

for (const [index, pair] of technicalPairs.entries()) {
    const inputs = tokenizer(pair.question1, {
        text_pair: pair.question2,
        truncation: true
    });

    const output = await model(inputs);
    const score = sigmoid(Number(output.logits.data[0]));
    const predicted = score >= 0.5;

    if (predicted && pair.expectedMatch) tp++;
    else if (!predicted && !pair.expectedMatch) tn++;
    else if (predicted) fp++;
    else fn++;

    console.log({
        case: index + 1,
        expected: pair.expectedMatch,
        predicted,
        score: Number(score.toFixed(4))
    });
}

console.log("\nFinal metrics:", {
    accuracy: `${(((tp + tn) / technicalPairs.length) * 100).toFixed(2)}%`,
    tp, tn, fp, fn
});
