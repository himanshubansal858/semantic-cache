
import { evaluationDataset } from "./dataset.js";
import { validateSemanticMatch } from "../src/services/matchValidator.js";

const evaluateValidator = async () => {
    let tp = 0;
    let tn = 0;
    let fp = 0;
    let fn = 0;

    for (const item of evaluationDataset) {
        const result = await validateSemanticMatch(
            item.question1,
            item.question2
        );

        const predicted = result.valid;
        const expected = item.expectedMatch;

        if (predicted && expected) tp++;
        else if (!predicted && !expected) tn++;
        else if (predicted && !expected) fp++;
        else fn++;

        console.log({
            question1: item.question1,
            question2: item.question2,
            expected,
            predicted,
            reason: result.reason
        });
    }

    const accuracy = (tp + tn) / evaluationDataset.length * 100;
    const precision = tp + fp > 0 ? tp / (tp + fp) * 100 : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) * 100 : 0;

    console.log("\nValidator Evaluation:");
    console.log({ tp, tn, fp, fn });
    console.log(`Accuracy: ${accuracy.toFixed(2)}%`);
    console.log(`Precision: ${precision.toFixed(2)}%`);
    console.log(`Recall: ${recall.toFixed(2)}%`);
};

evaluateValidator().catch(console.error);
