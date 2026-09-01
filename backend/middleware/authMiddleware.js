const jwt = require("jsonwebtoken");

const User = require("../models/User");

async function authMiddleware(req, res, next) {

    try {

        const header = req.headers.authorization || "";

        const token = header.startsWith("Bearer ")
            ? header.slice(7)
            : null;

        if (!token) {
            return res.status(401).json({
                message: "Not authorized. Please log in."
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.userId)
            .select("-passwordHash");

        if (!user) {
            return res.status(401).json({
                message: "User no longer exists."
            });
        }

        req.user = {
            id: user._id.toString(),
            name: user.name,
            email: user.email
        };

        next();

    } catch (error) {

        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError"
        ) {
            return res.status(401).json({
                message: "Invalid or expired token. Please log in again."
            });
        }

        console.error("Authentication error:", error);

        return res.status(500).json({
            message: "Authentication error."
        });
    }
}

module.exports = authMiddleware;