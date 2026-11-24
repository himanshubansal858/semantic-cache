
import { readFile } from "node:fs/promises";

const data = JSON.parse(
    await readFile(
        new URL("./similarity-results.json", import.meta.url),
        "utf8"
    )
);

const thresholds = [0.85, 0.90, 0.93, 0.95, 0.98];

for (const threshold of thresholds) {
    let tp = 0, tn = 0, fp = 0, fn = 0;

    for (const item of data) {
        const predictedMatch = item.similarity >= threshold;

        if (predictedMatch && item.expectedMatch) tp++;
        else if (!predictedMatch && !item.expectedMatch) tn++;
        else if (predictedMatch && !item.expectedMatch) fp++;
        else fn++;
    }

    const accuracy = ((tp + tn) / data.length) * 100;
    const precision = tp + fp ? (tp / (tp + fp)) * 100 : 0;
    const recall = tp + fn ? (tp / (tp + fn)) * 100 : 0;

    console.log({
        threshold,
        accuracy: accuracy.toFixed(2) + "%",
        precision: precision.toFixed(2) + "%",
        recall: recall.toFixed(2) + "%",
        falsePositives: fp,
        falseNegatives: fn
    });
}
