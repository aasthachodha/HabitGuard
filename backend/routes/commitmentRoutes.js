const express = require("express");

const Commitment =
    require("../models/Commitment");

const DailyProgress =
    require("../models/DailyProgress");

const DailyChallenge =
    require("../models/DailyChallenge");

const authMiddleware =
    require("../middleware/authMiddleware");

const {
    generateDailyChallenge
} = require("../utils/challengeGenerator");

const router = express.Router();

router.use(authMiddleware);


/*
========================================================
DATE HELPERS
========================================================
*/

function getDateKey(date = new Date()) {

    return new Date(date)
        .toISOString()
        .slice(0, 10);
}


function dateDifference(
    date1,
    date2
) {

    const first =
        new Date(
            `${getDateKey(date1)}T00:00:00Z`
        );

    const second =
        new Date(
            `${getDateKey(date2)}T00:00:00Z`
        );

    return Math.round(
        (
            first.getTime() -
            second.getTime()
        ) / 86400000
    );
}


/*
========================================================
CALCULATE CURRENT STREAK
========================================================
*/

function calculateCurrentStreak(
    records
) {

    const completed =
        records
            .filter(
                item =>
                    item.status ===
                    "completed"
            )
            .sort(
                (a, b) =>
                    new Date(
                        `${a.date}T00:00:00Z`
                    ) -
                    new Date(
                        `${b.date}T00:00:00Z`
                    )
            );


    if (!completed.length) {
        return 0;
    }


    const today =
        getDateKey();


    const last =
        completed[
            completed.length - 1
        ];


    /*
    Streak is current ONLY when the
    latest completed record is today.
    */

    if (
        last.date !== today
    ) {

        return 0;
    }


    let streak = 1;


    for (
        let i = completed.length - 1;
        i > 0;
        i--
    ) {

        const current =
            completed[i];

        const previous =
            completed[i - 1];


        const gap =
            dateDifference(
                current.date,
                previous.date
            );


        if (gap === 1) {

            streak++;

        } else {

            break;
        }
    }


    return streak;
}


/*
========================================================
CALCULATE LONGEST STREAK
========================================================
*/

function calculateLongestStreak(
    records
) {

    const completed =
        records
            .filter(
                item =>
                    item.status ===
                    "completed"
            )
            .sort(
                (a, b) =>
                    new Date(
                        `${a.date}T00:00:00Z`
                    ) -
                    new Date(
                        `${b.date}T00:00:00Z`
                    )
            );


    let longest = 0;
    let running = 0;
    let previousDate = null;


    for (
        const record of completed
    ) {

        if (!previousDate) {

            running = 1;

        } else {

            const gap =
                dateDifference(
                    record.date,
                    previousDate
                );


            if (gap === 1) {

                running++;

            } else {

                running = 1;
            }
        }


        longest =
            Math.max(
                longest,
                running
            );


        previousDate =
            record.date;
    }


    return longest;
}


/*
========================================================
GET ALL COMMITMENTS
========================================================
*/

router.get(
    "/",

    async (req, res) => {

        try {

            const commitments =
                await Commitment.find({

                    userId:
                        req.user.id

                }).sort({
                    createdAt: -1
                });


            return res.json({
                commitments
            });

        } catch (error) {

            console.error(
                "Get commitments error:",
                error
            );

            return res.status(500).json({

                message:
                    "Failed to fetch commitments."
            });
        }
    }
);


/*
========================================================
CREATE COMMITMENT
========================================================
*/

router.post(
    "/",

    async (req, res) => {

        try {

            const {
                name,
                description,
                category,
                frequency = "daily",
                durationDays = 30,
                startingCommitment = 100,
                escalationMultiplier = 2,
                maximumCommitment = 800,
                deadline = "21:00"
            } = req.body;


            if (
                !name ||
                !description ||
                !category
            ) {

                return res.status(400).json({

                    message:
                        "Name, description and category are required."
                });
            }


            const duration =
                Math.max(
                    1,
                    Number(durationDays) ||
                    30
                );


            const starting =
                Math.max(
                    1,
                    Number(
                        startingCommitment
                    ) || 100
                );


            const multiplier =
                Math.max(
                    1,
                    Number(
                        escalationMultiplier
                    ) || 2
                );


            const maximum =
                Math.max(
                    starting,
                    Number(
                        maximumCommitment
                    ) || 800
                );


            const startDate =
                new Date();


            startDate.setHours(
                0,
                0,
                0,
                0
            );


            const endDate =
                new Date(
                    startDate.getTime() +
                    (
                        duration - 1
                    ) *
                    86400000
                );


            const commitment =
                await Commitment.create({

                    userId:
                        req.user.id,

                    name:
                        String(name).trim(),

                    description:
                        String(
                            description
                        ).trim(),

                    category:
                        String(
                            category
                        ).trim(),

                    frequency,

                    durationDays:
                        duration,

                    startingCommitment:
                        starting,

                    currentCommitment:
                        starting,

                    escalationMultiplier:
                        multiplier,

                    maximumCommitment:
                        maximum,

                    deadline,

                    startDate,

                    endDate,

                    currentStreak:
                        0,

                    longestStreak:
                        0,

                    daysCompleted:
                        0,

                    status:
                        "active",

                    todayProofUrl:
                        null,

                    todayProofFileId:
                        null,

                    todayProofVerified:
                        false,

                    todayProofConfidence:
                        0,

                    todayProofVerificationMessage:
                        null,

                    todayProofChallenge:
                        null
                });


            return res.status(201).json({

                message:
                    "Commitment created successfully.",

                commitment
            });

        } catch (error) {

            console.error(
                "Create commitment error:",
                error
            );

            return res.status(500).json({

                message:
                    "Failed to create commitment."
            });
        }
    }
);


/*
========================================================
GET SINGLE COMMITMENT
========================================================
*/

router.get(
    "/:id",

    async (req, res) => {

        try {

            const commitment =
                await Commitment.findOne({

                    _id:
                        req.params.id,

                    userId:
                        req.user.id
                });


            if (!commitment) {

                return res.status(404).json({

                    message:
                        "Commitment not found."
                });
            }


            const progress =
                await DailyProgress.find({

                    commitmentId:
                        commitment._id,

                    userId:
                        req.user.id

                }).sort({
                    date: 1
                });


            /*
            Keep backend streak synchronized
            with actual database records.
            */

            commitment.currentStreak =
                calculateCurrentStreak(
                    progress
                );

            commitment.longestStreak =
                calculateLongestStreak(
                    progress
                );

            commitment.daysCompleted =
                progress.filter(
                    item =>
                        item.status ===
                        "completed"
                ).length;


            await commitment.save();


            return res.json({

                commitment,

                progress
            });

        } catch (error) {

            console.error(
                "Get commitment error:",
                error
            );

            return res.status(500).json({

                message:
                    "Failed to fetch commitment."
            });
        }
    }
);


/*
========================================================
TODAY AI CHALLENGE
========================================================
*/

router.get(
    "/:id/today-challenge",

    async (req, res) => {

        try {

            const commitment =
                await Commitment.findOne({

                    _id:
                        req.params.id,

                    userId:
                        req.user.id
                });


            if (!commitment) {

                return res.status(404).json({

                    message:
                        "Commitment not found."
                });
            }


            const today =
                getDateKey();


            let challenge =
                await DailyChallenge.findOne({

                    commitmentId:
                        commitment._id,

                    userId:
                        req.user.id,

                    date:
                        today
                });


            if (!challenge) {

                const text =
                    await generateDailyChallenge({

                        name:
                            commitment.name,

                        description:
                            commitment.description,

                        category:
                            commitment.category
                    });


                challenge =
                    await DailyChallenge.create({

                        userId:
                            req.user.id,

                        commitmentId:
                            commitment._id,

                        date:
                            today,

                        challenge:
                            text ||
                            `Complete today's "${commitment.name}" task as planned.`
                    });
            }


            return res.json({

                challenge:
                    challenge.challenge,

                verified:
                    Boolean(
                        commitment.todayProofVerified
                    )
            });

        } catch (error) {

            console.error(
                "Challenge error:",
                error
            );

            return res.json({

                challenge:
                    "Complete today's commitment according to your plan and provide genuine proof of your work.",

                verified:
                    false
            });
        }
    }
);


/*
========================================================
SUBMIT TODAY
========================================================
*/

router.post(
    "/:id/progress",

    async (req, res) => {

        try {

            const commitment =
                await Commitment.findOne({

                    _id:
                        req.params.id,

                    userId:
                        req.user.id
                });


            if (!commitment) {

                return res.status(404).json({

                    message:
                        "Commitment not found."
                });
            }


            const today =
                getDateKey();


            const existing =
                await DailyProgress.findOne({

                    commitmentId:
                        commitment._id,

                    userId:
                        req.user.id,

                    date:
                        today
                });


            if (existing) {

                return res.status(409).json({

                    message:
                        "Today's commitment has already been recorded."
                });
            }


            /*
            COMPLETION MUST HAVE VERIFIED PROOF.
            */

            if (
                !commitment.todayProofUrl
            ) {

                return res.status(400).json({

                    message:
                        "Please upload today's proof image first.",

                    verified:
                        false
                });
            }


            if (
                !commitment.todayProofVerified
            ) {

                return res.status(400).json({

                    message:
                        "AI has not verified today's proof. Please upload a valid proof image.",

                    verified:
                        false
                });
            }


            /*
            Calculate streak BEFORE creating
            today's record.
            */

            const previous =
                await DailyProgress.find({

                    commitmentId:
                        commitment._id,

                    userId:
                        req.user.id,

                    status:
                        "completed"

                }).sort({
                    date: -1
                });


            let newStreak = 1;


            if (previous.length > 0) {

                const last =
                    previous[0];


                const gap =
                    dateDifference(
                        today,
                        last.date
                    );


                if (gap === 1) {

                    newStreak =
                        Number(
                            last.streak || 0
                        ) + 1;
                }
            }


            const amount =
                Number(
                    commitment.currentCommitment
                );


            /*
            CREATE THE DAILY RECORD.
            */

            const progress =
                await DailyProgress.create({

                    userId:
                        req.user.id,

                    commitmentId:
                        commitment._id,

                    date:
                        today,

                    status:
                        "completed",

                    completed:
                        true,

                    commitmentAmount:
                        amount,

                    streak:
                        newStreak,

                    completedAt:
                        new Date(),

                    proofUrl:
                        commitment.todayProofUrl,

                    proofFileId:
                        commitment.todayProofFileId,

                    aiChallenge:
                        commitment.todayProofChallenge,

                    aiVerified:
                        true,

                    aiVerificationMessage:
                        commitment.todayProofVerificationMessage,

                    aiConfidence:
                        commitment.todayProofConfidence
                });


            /*
            NOW update commitment.
            */

            commitment.currentStreak =
                newStreak;


            commitment.longestStreak =
                Math.max(

                    Number(
                        commitment.longestStreak ||
                        0
                    ),

                    newStreak
                );


            commitment.daysCompleted =
                Number(
                    commitment.daysCompleted ||
                    0
                ) + 1;


            /*
            IMPORTANT:
            Day number is based on COMPLETED
            records.

            First successful submission = Day 1.
            Five successful submissions = Day 5.
            */

            if (
                commitment.daysCompleted >=
                commitment.durationDays
            ) {

                commitment.daysCompleted =
                    commitment.durationDays;

                commitment.status =
                    "completed";
            }


            /*
            Clear temporary proof AFTER
            successful database submission.
            */

            commitment.todayProofUrl =
                null;

            commitment.todayProofFileId =
                null;

            commitment.todayProofVerified =
                false;

            commitment.todayProofConfidence =
                0;

            commitment.todayProofVerificationMessage =
                null;

            commitment.todayProofChallenge =
                null;


            await commitment.save();


            return res.status(201).json({

                message:
                    "Today's commitment submitted successfully.",

                commitment,

                progress
            });

        } catch (error) {

            if (
                error.code === 11000
            ) {

                return res.status(409).json({

                    message:
                        "Today's commitment has already been recorded."
                });
            }


            console.error(
                "Submit progress error:",
                error
            );


            return res.status(500).json({

                message:
                    error.message ||
                    "Failed to submit today's commitment."
            });
        }
    }
);


/*
========================================================
RESET TODAY
========================================================
*/

router.post(
    "/:id/reset-today",

    async (req, res) => {

        try {

            const commitment =
                await Commitment.findOne({

                    _id:
                        req.params.id,

                    userId:
                        req.user.id
                });


            if (!commitment) {

                return res.status(404).json({

                    message:
                        "Commitment not found."
                });
            }


            const today =
                getDateKey();


            const record =
                await DailyProgress.findOneAndDelete({

                    commitmentId:
                        commitment._id,

                    userId:
                        req.user.id,

                    date:
                        today
                });


            if (!record) {

                return res.status(404).json({

                    message:
                        "No progress record exists for today."
                });
            }


            const records =
                await DailyProgress.find({

                    commitmentId:
                        commitment._id,

                    userId:
                        req.user.id
                });


            commitment.currentStreak =
                calculateCurrentStreak(
                    records
                );


            commitment.longestStreak =
                calculateLongestStreak(
                    records
                );


            commitment.daysCompleted =
                records.filter(
                    item =>
                        item.status ===
                        "completed"
                ).length;


            commitment.status =
                commitment.daysCompleted >=
                commitment.durationDays
                    ? "completed"
                    : "active";


            await commitment.save();


            return res.json({

                message:
                    "Today's progress has been reset.",

                commitment
            });

        } catch (error) {

            console.error(
                "Reset error:",
                error
            );

            return res.status(500).json({

                message:
                    "Failed to reset today's progress."
            });
        }
    }
);


module.exports = router;