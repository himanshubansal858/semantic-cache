
import { generateLocalEmbedding } from "../src/services/localEmbeddingService.js";

function showMemory(label) {
    const memory = process.memoryUsage();

    console.log(`\n${label}`);
    console.log(`RSS: ${(memory.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Heap: ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
}

showMemory("Before model initialization");

await generateLocalEmbedding("What is Redis?");
showMemory("After model initialization");

for (let i = 0; i < 20; i++) {
    await generateLocalEmbedding(
        `Explain distributed caching scenario ${i}`
    );
}

showMemory("After 20 embeddings");
