const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const User = require("../models/User");

const router = express.Router();


// =========================
// PASSWORD HASHING
// =========================

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");

    const hash = crypto
        .scryptSync(password, salt, 64)
        .toString("hex");

    return `${salt}:${hash}`;
}


function verifyPassword(password, storedPassword) {
    const [salt, storedHash] = storedPassword.split(":");

    if (!salt || !storedHash) {
        return false;
    }

    const hash = crypto
        .scryptSync(password, salt, 64)
        .toString("hex");

    return crypto.timingSafeEqual(
        Buffer.from(hash, "hex"),
        Buffer.from(storedHash, "hex")
    );
}


// =========================
// JWT
// =========================

function createToken(userId) {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
}


// =========================
// EMAIL TRANSPORTER
// =========================

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


// =========================
// SIGNUP
// =========================

router.post("/signup", async (req, res) => {

    try {

        const {
            name,
            email,
            password
        } = req.body;


        const normalizedEmail = String(email || "")
            .trim()
            .toLowerCase();


        if (!name || !normalizedEmail || !password) {

            return res.status(400).json({
                message:
                    "Name, email and password are required."
            });
        }


        if (password.length < 6) {

            return res.status(400).json({
                message:
                    "Password must be at least 6 characters."
            });
        }


        // Check existing user

        const existingUser = await User.findOne({
            email: normalizedEmail
        });


        if (existingUser) {

            return res.status(409).json({
                message:
                    "An account with this email already exists."
            });
        }


        // Hash password

        const passwordHash =
            hashPassword(password);


        // Create user

        const user = await User.create({

            name: String(name).trim(),

            email: normalizedEmail,

            passwordHash
        });


        // Generate JWT

        const token =
            createToken(user._id.toString());


        res.status(201).json({

            message:
                "Account created successfully.",

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });


    } catch (error) {


        // MongoDB duplicate key

        if (error.code === 11000) {

            return res.status(409).json({
                message:
                    "An account with this email already exists."
            });
        }


        console.error(
            "Signup error:",
            error
        );


        res.status(500).json({
            message:
                "Server error during signup."
        });
    }
});


// =========================
// LOGIN
// =========================

router.post("/login", async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        const normalizedEmail =
            String(email || "")
                .trim()
                .toLowerCase();


        const user = await User.findOne({
            email: normalizedEmail
        });


        if (
            !user ||
            !verifyPassword(
                String(password || ""),
                user.passwordHash
            )
        ) {

            return res.status(401).json({
                message:
                    "Invalid email or password."
            });
        }


        const token =
            createToken(user._id.toString());


        res.json({

            message:
                "Login successful.",

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });


    } catch (error) {

        console.error(
            "Login error:",
            error
        );


        res.status(500).json({
            message:
                "Server error during login."
        });
    }
});


// ======================================================
// FORGOT PASSWORD
// ======================================================

router.post("/forgot-password", async (req, res) => {

    try {

        const {
            email
        } = req.body;


        const normalizedEmail =
            String(email || "")
                .trim()
                .toLowerCase();


        if (!normalizedEmail) {

            return res.status(400).json({
                message:
                    "Email is required."
            });
        }


        const user = await User.findOne({
            email: normalizedEmail
        });


        // Do not reveal whether the email exists

        if (!user) {

            return res.json({
                message:
                    "If an account exists with this email, a password reset link has been sent."
            });
        }


        // =========================
        // GENERATE RESET TOKEN
        // =========================

        const resetToken =
            crypto.randomBytes(32).toString("hex");


        // Store HASHED token in database

        const hashedToken =
            crypto
                .createHash("sha256")
                .update(resetToken)
                .digest("hex");


        // Token expires after 15 minutes

        const resetTokenExpiry =
            new Date(
                Date.now() + 15 * 60 * 1000
            );


        user.resetPasswordToken =
            hashedToken;

        user.resetPasswordExpires =
            resetTokenExpiry;


        await user.save();


        // =========================
        // RESET LINK
        // =========================

        const frontendUrl =
            process.env.FRONTEND_URL ||
            "http://localhost:5173";


        const resetLink =
            `${frontendUrl}/reset-password?token=${resetToken}`;


        // =========================
        // SEND EMAIL
        // =========================

        await transporter.sendMail({

            from:
                `"Commitment" <${process.env.EMAIL_USER}>`,

            to:
                user.email,

            subject:
                "Reset your Commitment password",

            text:
                `You requested a password reset for your Commitment account.\n\n` +
                `Click the link below to reset your password:\n\n` +
                `${resetLink}\n\n` +
                `This link will expire in 15 minutes.\n\n` +
                `If you did not request this, you can safely ignore this email.`,

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 30px;
                    color: #192337;
                ">

                    <h2>
                        Reset your Commitment password
                    </h2>

                    <p>
                        You requested a password reset for
                        your Commitment account.
                    </p>

                    <p>
                        Click the button below to create
                        a new password.
                    </p>

                    <a
                        href="${resetLink}"
                        style="
                            display: inline-block;
                            padding: 12px 20px;
                            background: #192337;
                            color: white;
                            text-decoration: none;
                            border-radius: 8px;
                            font-weight: bold;
                        "
                    >
                        Reset Password
                    </a>

                    <p style="
                        margin-top: 24px;
                        color: #64748b;
                    ">
                        This link will expire in 15 minutes.
                    </p>

                    <p style="
                        color: #64748b;
                    ">
                        If you did not request this password
                        reset, you can safely ignore this email.
                    </p>

                </div>
            `
        });


        res.json({

            message:
                "If an account exists with this email, a password reset link has been sent."
        });


    } catch (error) {

        console.error(
            "Forgot password error:",
            error
        );


        res.status(500).json({
            message:
                "Unable to send password reset email."
        });
    }
});


// ======================================================
// RESET PASSWORD
// ======================================================

router.post("/reset-password", async (req, res) => {

    try {

        const {
            token,
            password
        } = req.body;


        if (!token || !password) {

            return res.status(400).json({
                message:
                    "Reset token and new password are required."
            });
        }


        if (password.length < 6) {

            return res.status(400).json({
                message:
                    "Password must be at least 6 characters."
            });
        }


        // =========================
        // HASH TOKEN
        // =========================

        const hashedToken =
            crypto
                .createHash("sha256")
                .update(token)
                .digest("hex");


        // =========================
        // FIND USER
        // =========================

        const user = await User.findOne({

            resetPasswordToken:
                hashedToken,

            resetPasswordExpires: {
                $gt: new Date()
            }
        });


        if (!user) {

            return res.status(400).json({
                message:
                    "Password reset link is invalid or expired."
            });
        }


        // =========================
        // UPDATE PASSWORD
        // =========================

        user.passwordHash =
            hashPassword(password);


        // Clear reset token

        user.resetPasswordToken =
            null;

        user.resetPasswordExpires =
            null;


        await user.save();


        res.json({

            message:
                "Password reset successfully."
        });


    } catch (error) {

        console.error(
            "Reset password error:",
            error
        );


        res.status(500).json({
            message:
                "Unable to reset password."
        });
    }
});


module.exports = router;