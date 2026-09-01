const mongoose = require("mongoose");

const commitmentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            required: true,
            trim: true
        },

        frequency: {
            type: String,
            default: "daily"
        },

        durationDays: {
            type: Number,
            required: true,
            min: 1,
            default: 30
        },

        startingCommitment: {
            type: Number,
            required: true,
            min: 1,
            default: 100
        },

        currentCommitment: {
            type: Number,
            required: true,
            min: 1,
            default: 100
        },

        escalationMultiplier: {
            type: Number,
            required: true,
            default: 2
        },

        maximumCommitment: {
            type: Number,
            required: true,
            min: 1,
            default: 800
        },

        deadline: {
            type: String,
            default: "21:00"
        },

        startDate: {
            type: Date,
            required: true
        },

        endDate: {
            type: Date,
            required: true
        },

        currentStreak: {
            type: Number,
            default: 0
        },

        longestStreak: {
            type: Number,
            default: 0
        },

        daysCompleted: {
            type: Number,
            default: 0
        },

        status: {
            type: String,
            enum: ["active", "completed"],
            default: "active"
        },

        /* =========================
           TODAY'S PROOF
        ========================= */

        todayProofUrl: {
            type: String,
            default: null
        },

        todayProofFileId: {
            type: String,
            default: null
        },

        todayProofVerified: {
            type: Boolean,
            default: false
        },

        todayProofConfidence: {
            type: Number,
            default: 0
        },

        todayProofVerificationMessage: {
            type: String,
            default: ""
        },

        todayProofChallenge: {
            type: String,
            default: ""
        },

        /* =========================
           TEST PAYMENT
        ========================= */

        lastPaymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed"],
            default: "pending"
        },

        lastPaymentAmount: {
            type: Number,
            default: 0
        },

        lastTransactionId: {
            type: String,
            default: null
        },

        lastPaymentDate: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.model("Commitment", commitmentSchema);