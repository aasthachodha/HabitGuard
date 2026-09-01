const mongoose = require("mongoose");


const dailyProgressSchema = new mongoose.Schema(

    {

        userId: {

            type:
                mongoose.Schema.Types.ObjectId,

            ref:
                "User",

            required:
                true,

            index:
                true

        },


        commitmentId: {

            type:
                mongoose.Schema.Types.ObjectId,

            ref:
                "Commitment",

            required:
                true,

            index:
                true

        },


        date: {

            type:
                String,

            required:
                true

        },


        status: {

            type:
                String,

            enum:
                [
                    "completed",
                    "missed"
                ],

            required:
                true

        },


        completed: {

            type:
                Boolean,

            required:
                true

        },


        commitmentAmount: {

            type:
                Number,

            required:
                true

        },


        streak: {

            type:
                Number,

            required:
                true

        },


        completedAt: {

            type:
                Date,

            default:
                null

        },


        // =========================
        // PROOF INFORMATION
        // =========================

        proofUrl: {

            type:
                String,

            default:
                null

        },


        proofFileId: {

            type:
                String,

            default:
                null

        },


        // =========================
        // AI INFORMATION
        // =========================

        aiChallenge: {

            type:
                String,

            default:
                null

        },


        aiVerified: {

            type:
                Boolean,

            default:
                false

        },


        aiVerificationMessage: {

            type:
                String,

            default:
                null

        }

    },

    {

        timestamps:
            true

    }

);


// =========================
// ONE RECORD PER DAY
// =========================

dailyProgressSchema.index(

    {

        commitmentId:
            1,

        userId:
            1,

        date:
            1

    },

    {

        unique:
            true

    }

);


module.exports =
    mongoose.model(
        "DailyProgress",
        dailyProgressSchema
    );