
import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { once } from "node:events";

import { rateLimit } from "express-rate-limit";

test("Blocks requests exceeding the configured limit", async () => {
    const app = express();

    const limiter = rateLimit({
        windowMs: 60_000,
        limit: 2,
        standardHeaders: "draft-8",
        legacyHeaders: false
    });

    app.use("/test", limiter);
    app.get("/test", (req, res) => {
        res.json({ success: true });
    });

    const server = app.listen(0);
    await once(server, "listening");

    try {
        const { port } = server.address();

        const url = `http://127.0.0.1:${port}/test`;

        const first = await fetch(url);
        const second = await fetch(url);
        const third = await fetch(url);

        assert.equal(first.status, 200);
        assert.equal(second.status, 200);
        assert.equal(third.status, 429);

    } finally {
        server.closeAllConnections();
        await new Promise((resolve, reject) => {
            server.close(err =>
                err ? reject(err) : resolve()
            );
        });
    }
});
