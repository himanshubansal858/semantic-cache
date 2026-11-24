
import { readFile, writeFile } from "node:fs/promises";

const results = JSON.parse(
    await readFile(
        new URL("./similarity-results.json", import.meta.url),
        "utf8"
    )
);

// Predictions recorded from our previous LLM evaluation.
// null indicates that the API request failed.
const llmPredictions = [
    true,  // Java paraphrase
    true,  // Binary tree paraphrase
    false, // Binary tree vs BST
    true,  // BFS paraphrase
    false, // BFS vs DFS
    false, // Stack vs LIFO
    false, // Stack vs Queue
    true,  // SQL paraphrase
    false, // SQL vs NoSQL
    null   // API quota exceeded
];

function calculateMetrics(predictions, dataset) {
    let tp = 0, tn = 0, fp = 0, fn = 0;
    let errors = 0;

    dataset.forEach((item, i) => {
        const predicted = predictions[i];
        const expected = item.expectedMatch;

        if (predicted === null) {
            errors++;
            return;
        }

        if (predicted && expected) tp++;
        else if (!predicted && !expected) tn++;
        else if (predicted && !expected) fp++;
        else fn++;
    });

    const evaluated = tp + tn + fp + fn;

    const accuracy = evaluated
        ? (tp + tn) / evaluated * 100
        : 0;

    const precision = tp + fp
        ? tp / (tp + fp) * 100
        : null;

    const recall = tp + fn
        ? tp / (tp + fn) * 100
        : 0;

    const f1 = precision !== null && precision + recall > 0
        ? 2 * precision * recall / (precision + recall)
        : null;

    return {
        evaluated,
        errors,
        tp,
        tn,
        fp,
        fn,
        accuracy: Number(accuracy.toFixed(2)),
        precision: precision === null
            ? null
            : Number(precision.toFixed(2)),
        recall: Number(recall.toFixed(2)),
        f1: f1 === null ? null : Number(f1.toFixed(2))
    };
}

const embeddingPredictions = results.map(
    item => item.similarity >= 0.90
);

const exactMatchPredictions = results.map(
    item => {
        const normalize = text =>
            text.trim().toLowerCase().replace(/\s+/g, " ");

        return normalize(item.question1) ===
               normalize(item.question2);
    }
);

const report = {
    datasetSize: results.length,
    embeddingThreshold: 0.90,
    embedding: calculateMetrics(
        embeddingPredictions,
        results
    ),
    exactMatch: calculateMetrics(
        exactMatchPredictions,
        results
    ),
    llm: {
        ...calculateMetrics(llmPredictions, results),
        averageLatencyMs: 9668.57
    }
};

await writeFile(
    new URL("./evaluation-report.json", import.meta.url),
    JSON.stringify(report, null, 2),
    "utf8"
);

console.log("\nSemantic Cache Evaluation Report");
console.log(JSON.stringify(report, null, 2));
