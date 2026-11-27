
import test from "node:test";
import assert from "node:assert/strict";

const simulatedValidation = async (signal) => {
    await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, 10000);

        signal.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(new Error("Validation aborted"));
        }, { once: true });
    });

    return { valid: true };
};

test("Aborts slow validation", async () => {
    const signal = AbortSignal.timeout(100);

    const start = performance.now();

    await assert.rejects(
        simulatedValidation(signal),
        /Validation aborted/
    );

    const elapsed = performance.now() - start;

    assert.ok(elapsed < 1000);
});
