const mongoose = require("mongoose");

const dailyChallengeSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        commitmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Commitment",
            required: true,
            index: true
        },

        date: {
            type: String,
            required: true
        },

        challenge: {
            type: String,
            required: true
        },

        generatedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);


// Only ONE challenge per commitment per day
dailyChallengeSchema.index(
    {
        commitmentId: 1,
        userId: 1,
        date: 1
    },
    {
        unique: true
    }
);


module.exports = mongoose.model(
    "DailyChallenge",
    dailyChallengeSchema
);