const express = require("express");
const multer = require("multer");
const ImageKit = require("@imagekit/nodejs");

const DailyProgress = require("../models/DailyProgress");
const DailyChallenge = require("../models/DailyChallenge");
const Commitment = require("../models/Commitment");

const authMiddleware = require("../middleware/authMiddleware");

const { verifyProof } = require("../utils/verifyProof");

const {
  generateDailyChallenge
} = require("../utils/challengeGenerator");

const router = express.Router();

router.use(authMiddleware);


/* ========================================================
   MULTER
======================================================== */

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    if (
      file.mimetype &&
      file.mimetype.startsWith("image/")
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only image files are allowed."
        )
      );
    }
  }
});


/* ========================================================
   IMAGEKIT
======================================================== */

const imagekit = new ImageKit({
  privateKey:
    process.env.IMAGEKIT_PRIVATE_KEY
});


/* ========================================================
   DATE
======================================================== */

function getDateKey() {
  const now = new Date();

  return now
    .toISOString()
    .slice(0, 10);
}


/* ========================================================
   DAILY CHALLENGE
======================================================== */

async function getOrCreateTodayChallenge(
  commitment,
  userId
) {
  const today = getDateKey();

  let challenge =
    await DailyChallenge.findOne({
      commitmentId: commitment._id,
      userId,
      date: today
    });

  if (challenge) {
    return challenge;
  }

  const text =
    await generateDailyChallenge({
      name: commitment.name,
      description: commitment.description,
      category: commitment.category
    });

  challenge =
    await DailyChallenge.create({
      userId,

      commitmentId:
        commitment._id,

      date: today,

      challenge:
        text ||
        `Complete today's "${commitment.name}" task as planned.`
    });

  return challenge;
}


/* ========================================================
   UPLOAD + GEMINI AI VERIFICATION
======================================================== */

router.post(
  "/upload",
  upload.single("proof"),

  async (req, res) => {

    try {

      /* --------------------------------------------------
         CHECK IMAGE
      -------------------------------------------------- */

      if (!req.file) {

        return res.status(400).json({
          message:
            "Please select an image."
        });
      }


      /* --------------------------------------------------
         CHECK COMMITMENT
      -------------------------------------------------- */

      const {
        commitmentId
      } = req.body;

      if (!commitmentId) {

        return res.status(400).json({
          message:
            "Commitment ID is required."
        });
      }


      const commitment =
        await Commitment.findOne({

          _id: commitmentId,

          userId:
            req.user.id
        });


      if (!commitment) {

        return res.status(404).json({
          message:
            "Commitment not found."
        });
      }


      /* --------------------------------------------------
         CHECK TODAY'S RECORD
      -------------------------------------------------- */

      const today =
        getDateKey();


      const existingProgress =
        await DailyProgress.findOne({

          commitmentId:
            commitment._id,

          userId:
            req.user.id,

          date:
            today
        });


      if (existingProgress) {

        return res.status(409).json({
          message:
            "Today's commitment has already been recorded."
        });
      }


      /* --------------------------------------------------
         GET TODAY'S AI CHALLENGE
      -------------------------------------------------- */

      const challenge =
        await getOrCreateTodayChallenge(
          commitment,
          req.user.id
        );


      /* --------------------------------------------------
         CHECK IMAGEKIT
      -------------------------------------------------- */

      if (
        !process.env.IMAGEKIT_PRIVATE_KEY
      ) {

        return res.status(500).json({
          message:
            "ImageKit configuration is missing."
        });
      }


      /* --------------------------------------------------
         UPLOAD IMAGE TO IMAGEKIT
      -------------------------------------------------- */

      const extension =
        req.file.originalname
          .split(".")
          .pop();


      const result =
        await imagekit.files.upload({

          file:
            req.file.buffer.toString(
              "base64"
            ),

          fileName:
            `proof-${req.user.id}-${commitmentId}-${Date.now()}.${extension}`,

          folder:
            "/commitment-proofs"
        });


      if (
        !result ||
        !result.url
      ) {

        return res.status(500).json({
          message:
            "Image upload failed."
        });
      }


      /* --------------------------------------------------
         GEMINI AI VERIFICATION
         
         IMPORTANT:
         New verifyProof.js expects:

         verifyProof(
           imageBuffer,
           mimeType,
           commitment
         )
      -------------------------------------------------- */

      let verification;

      try {

        verification =
          await verifyProof(

            req.file.buffer,

            req.file.mimetype,

            {
              name:
                commitment.name,

              description:
                commitment.description,

              category:
                commitment.category
            }

          );

      } catch (aiError) {

        console.error(
          "Gemini verification error:",
          aiError
        );


        /*
         Save uploaded proof information,
         but DO NOT start streak.
        */

        commitment.todayProofUrl =
          result.url;

        commitment.todayProofFileId =
          result.fileId || null;

        commitment.todayProofVerified =
          false;

        commitment.todayProofConfidence =
          0;

        commitment.todayProofVerificationMessage =
          aiError.message ||
          "AI verification failed.";

        commitment.todayProofChallenge =
          challenge.challenge;

        await commitment.save();


        return res.status(503).json({

          message:
            "Image uploaded, but AI verification could not be completed.",

          verified:
            false,

          confidence:
            0,

          reason:
            aiError.message ||
            "AI verification failed. Please try again.",

          proofUrl:
            result.url,

          proofFileId:
            result.fileId || null,

          challenge:
            challenge.challenge

        });
      }


      /* --------------------------------------------------
         VERIFICATION RESULT
      -------------------------------------------------- */

      const verified =
        verification?.verified === true;


      const confidence =
        Number(
          verification?.confidence || 0
        );


      const reason =
        verification?.reason ||
        "No verification explanation was provided.";


      /* --------------------------------------------------
         SAVE TEMPORARY PROOF
         
         IMPORTANT:
         Uploading/verifying proof does NOT
         change the streak.

         Streak changes only after Submit.
      -------------------------------------------------- */

      commitment.todayProofUrl =
        result.url;

      commitment.todayProofFileId =
        result.fileId || null;

      commitment.todayProofVerified =
        verified;

      commitment.todayProofConfidence =
        confidence;

      commitment.todayProofVerificationMessage =
        reason;

      commitment.todayProofChallenge =
        challenge.challenge;


      await commitment.save();


      /* --------------------------------------------------
         REJECTED
      -------------------------------------------------- */

      if (!verified) {

        return res.json({

          message:
            "Proof was not accepted by AI.",

          verified:
            false,

          confidence,

          reason,

          challenge:
            challenge.challenge,

          proofUrl:
            result.url,

          proofFileId:
            result.fileId || null

        });
      }


      /* --------------------------------------------------
         VERIFIED
      -------------------------------------------------- */

      return res.json({

        message:
          "Proof verified successfully. You can now submit today's commitment.",

        verified:
          true,

        confidence,

        reason,

        challenge:
          challenge.challenge,

        proofUrl:
          result.url,

        proofFileId:
          result.fileId || null

      });

    } catch (error) {

      console.error(
        "Proof upload error:",
        error
      );

      return res.status(500).json({

        message:
          error.message ||
          "Failed to upload and verify proof."

      });
    }
  }
);


/* ========================================================
   VERIFY EXISTING IMAGE URL
======================================================== */

router.post(
  "/verify",

  async (req, res) => {

    try {

      const {
        commitmentId,
        proofUrl,
        proofFileId
      } = req.body;


      if (
        !commitmentId ||
        !proofUrl
      ) {

        return res.status(400).json({

          message:
            "Commitment ID and proof image URL are required."

        });
      }


      const commitment =
        await Commitment.findOne({

          _id:
            commitmentId,

          userId:
            req.user.id

        });


      if (!commitment) {

        return res.status(404).json({

          message:
            "Commitment not found."

        });
      }


      const challenge =
        await getOrCreateTodayChallenge(
          commitment,
          req.user.id
        );


      /*
       * Download the existing image URL
       * so the new verifyProof function
       * receives an image buffer.
       */

      const imageResponse =
        await fetch(proofUrl);


      if (!imageResponse.ok) {

        throw new Error(
          "Could not download proof image."
        );
      }


      const arrayBuffer =
        await imageResponse.arrayBuffer();


      const imageBuffer =
        Buffer.from(arrayBuffer);


      const mimeType =
        imageResponse.headers.get(
          "content-type"
        ) || "image/jpeg";


      const result =
        await verifyProof(

          imageBuffer,

          mimeType,

          {
            name:
              commitment.name,

            description:
              commitment.description,

            category:
              commitment.category
          }

        );


      const verified =
        result?.verified === true;


      const confidence =
        Number(
          result?.confidence || 0
        );


      const reason =
        result?.reason || "";


      commitment.todayProofUrl =
        proofUrl;

      commitment.todayProofFileId =
        proofFileId || null;

      commitment.todayProofVerified =
        verified;

      commitment.todayProofConfidence =
        confidence;

      commitment.todayProofVerificationMessage =
        reason;

      commitment.todayProofChallenge =
        challenge.challenge;


      await commitment.save();


      return res.json({

        message:
          verified
            ? "Proof verified successfully."
            : "Proof was not accepted.",

        verified,

        confidence,

        reason,

        challenge:
          challenge.challenge

      });

    } catch (error) {

      console.error(
        "Verification error:",
        error
      );

      return res.status(500).json({

        message:
          error.message ||
          "Failed to verify proof."

      });
    }
  }
);


module.exports = router;