import "dotenv/config";

import { evaluationDataset } from "./dataset.js";
import { generateEmbedding } from "../src/services/embeddingService.js";
import { writeFile } from "node:fs/promises";

const SIMILARITY_THRESHOLD = 0.90;

const cosineSimilarity = (a, b) => {
    if (a.length !== b.length) {
        throw new Error("Embedding dimensions do not match");
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        magnitudeA += a[i] * a[i];
        magnitudeB += b[i] * b[i];
    }

    if (magnitudeA === 0 || magnitudeB === 0) {
        throw new Error("Cannot calculate similarity for zero vectors");
    }

    return dotProduct / (
        Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB)
    );
};
const results = [];
const evaluate = async () => {
    let correct = 0;
    let tp = 0;
    let tn = 0;
    let fp = 0;
    let fn = 0;

    for (const item of evaluationDataset) {
        const embedding1 = await generateEmbedding(item.question1);
        const embedding2 = await generateEmbedding(item.question2);

        const similarity = cosineSimilarity(embedding1, embedding2);
        results.push({
            question1: item.question1,
            question2: item.question2,
            expectedMatch: item.expectedMatch,
            similarity
        });
        const predictedMatch = similarity >= SIMILARITY_THRESHOLD;

        if (predictedMatch === item.expectedMatch) {
            correct++;
        }

        if (predictedMatch && item.expectedMatch) {
            tp++;
        } else if (!predictedMatch && !item.expectedMatch) {
            tn++;
        } else if (predictedMatch && !item.expectedMatch) {
            fp++;
        } else {
            fn++;
        }
        console.log({
            question1: item.question1,
            question2: item.question2,
            expectedMatch: item.expectedMatch,
            similarity: Number(similarity.toFixed(4)),
            predictedMatch,
            correct: predictedMatch === item.expectedMatch
        });

    }

    console.log("\nEvaluation completed");
    console.log(`Correct predictions: ${correct}/${evaluationDataset.length}`);
    console.log(
        `Accuracy: ${((correct / evaluationDataset.length) * 100).toFixed(2)}%`
    );
    const precision = tp + fp > 0
        ? tp / (tp + fp)
        : 0;

    const recall = tp + fn > 0
        ? tp / (tp + fn)
        : 0;

    const f1Score = precision + recall > 0
        ? 2 * precision * recall / (precision + recall)
        : 0;

    console.log("\nConfusion Matrix:");
    console.log({ tp, tn, fp, fn });

    console.log(`Precision: ${(precision * 100).toFixed(2)}%`);
    console.log(`Recall: ${(recall * 100).toFixed(2)}%`);
    console.log(`F1 Score: ${(f1Score * 100).toFixed(2)}%`);
    await writeFile(
        new URL("./similarity-results.json", import.meta.url),
        JSON.stringify(results, null, 2),
        "utf8"
    );

    console.log("Similarity results saved successfully.");
};

evaluate().catch((error) => {
    console.error("Evaluation failed:", error.message);
    process.exitCode = 1;
});