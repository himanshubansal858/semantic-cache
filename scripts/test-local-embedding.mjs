
import { generateLocalEmbedding } from "../src/services/localEmbeddingService.js";

const questions = [
    "What is a binary search tree?",
    "Explain how a BST works.",
    "What is dynamic programming?",
    "How does Redis caching work?"
];

for (let i = 0; i < questions.length; i++) {
    const start = performance.now();

    const embedding = await generateLocalEmbedding(questions[i]);

    const time = performance.now() - start;

    console.log(`Question ${i + 1}`);
    console.log(`Dimensions: ${embedding.length}`);
    console.log(`Time: ${time.toFixed(2)} ms`);
    console.log("-------------------------");
}
