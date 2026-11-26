
import test from "node:test";
import assert from "node:assert/strict";
import { requireAdmin } from "../src/middleware/adminAuth.js";

function createResponse() {
    return {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        }
    };
}

function createRequest(key) {
    return {
        get(name) {
            return name === "x-admin-key" ? key : undefined;
        }
    };
}

test("Rejects requests without an admin key", () => {
    const previous = process.env.ADMIN_API_KEY;
    process.env.ADMIN_API_KEY = "test-secret-key";

    try {
        const res = createResponse();
        let nextCalled = false;

        requireAdmin(createRequest(undefined), res, () => {
            nextCalled = true;
        });

        assert.equal(res.statusCode, 401);
        assert.equal(nextCalled, false);
    } finally {
        if (previous === undefined) delete process.env.ADMIN_API_KEY;
        else process.env.ADMIN_API_KEY = previous;
    }
});

test("Rejects incorrect admin keys", () => {
    const previous = process.env.ADMIN_API_KEY;
    process.env.ADMIN_API_KEY = "test-secret-key";

    try {
        const res = createResponse();
        let nextCalled = false;

        requireAdmin(createRequest("wrong-key"), res, () => {
            nextCalled = true;
        });

        assert.equal(res.statusCode, 401);
        assert.equal(nextCalled, false);
    } finally {
        if (previous === undefined) delete process.env.ADMIN_API_KEY;
        else process.env.ADMIN_API_KEY = previous;
    }
});

test("Accepts a correct admin key", () => {
    const previous = process.env.ADMIN_API_KEY;
    process.env.ADMIN_API_KEY = "test-secret-key";

    try {
        const res = createResponse();
        let nextCalled = false;

        requireAdmin(createRequest("test-secret-key"), res, () => {
            nextCalled = true;
        });

        assert.equal(nextCalled, true);
    } finally {
        if (previous === undefined) delete process.env.ADMIN_API_KEY;
        else process.env.ADMIN_API_KEY = previous;
    }
});

test("Rejects admin operations when no key is configured", () => {
    const previous = process.env.ADMIN_API_KEY;
    delete process.env.ADMIN_API_KEY;

    try {
        const res = createResponse();
        let nextCalled = false;

        requireAdmin(createRequest("any-key"), res, () => {
            nextCalled = true;
        });

        assert.equal(res.statusCode, 503);
        assert.equal(nextCalled, false);
    } finally {
        if (previous === undefined) delete process.env.ADMIN_API_KEY;
        else process.env.ADMIN_API_KEY = previous;
    }
});
