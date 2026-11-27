
import {
    AutoTokenizer,
    AutoModelForSequenceClassification
} from "@huggingface/transformers";

const modelId = "Xenova/nli-deberta-v3-xsmall";

console.log("Loading NLI model...");

const tokenizer = await AutoTokenizer.from_pretrained(modelId);

const model = await AutoModelForSequenceClassification.from_pretrained(
    modelId,
    { dtype: "q8" }
);

console.log("Model loaded.");
console.log("Model labels:", model.config.id2label);

const pairs = [
    [
        "Java is a programming language.",
        "Java is used to write software."
    ],
    [
        "A binary tree allows at most two children per node.",
        "Every binary tree has the binary search tree ordering property."
    ],
    [
        "Breadth-first search explores a graph level by level.",
        "Depth-first search explores a graph level by level."
    ],
    [
        "A stack follows last-in, first-out order.",
        "A stack follows last-in, first-out order."
    ]
];

const softmax = (values) => {
    const max = Math.max(...values);
    const exps = values.map(x => Math.exp(x - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(x => x / sum);
};

for (const [premise, hypothesis] of pairs) {
    const inputs = tokenizer(premise, {
        text_pair: hypothesis,
        truncation: true
    });

    const start = performance.now();
    const output = await model(inputs);
    const latencyMs = performance.now() - start;

    const logits = Array.from(output.logits.data);
    const probabilities = softmax(logits);

    const scores = Object.fromEntries(
        probabilities.map((score, i) => [
            model.config.id2label[i] ?? `LABEL_${i}`,
            Number(score.toFixed(4))
        ])
    );

    console.log({
        premise,
        hypothesis,
        scores,
        latencyMs: Number(latencyMs.toFixed(2))
    });
}
