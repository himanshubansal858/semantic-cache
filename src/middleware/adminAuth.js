
import { timingSafeEqual } from "node:crypto";

export const requireAdmin = (req, res, next) => {
    const expectedKey = process.env.ADMIN_API_KEY;
    const providedKey = req.get("x-admin-key");

    if (!expectedKey) {
        return res.status(503).json({
            success: false,
            message: "Admin operations are not configured"
        });
    }

    if (!providedKey) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }

    const expected = Buffer.from(expectedKey);
    const provided = Buffer.from(providedKey);

    if (
        expected.length !== provided.length ||
        !timingSafeEqual(expected, provided)
    ) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }

    next();
};
