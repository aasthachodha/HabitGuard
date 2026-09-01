const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Commitment = require("../models/Commitment");

const router = express.Router();

router.use(authMiddleware);

/*
========================================================
MOCK PAYMENT / TEST TRANSACTION
========================================================
This simulates a successful payment for demonstration.
No real money is transferred.
*/

router.post("/test-payment", async (req, res) => {
  try {
    const { commitmentId, amount } = req.body;

    if (!commitmentId) {
      return res.status(400).json({
        message: "Commitment ID is required."
      });
    }

    const commitment = await Commitment.findOne({
      _id: commitmentId,
      userId: req.user.id
    });

    if (!commitment) {
      return res.status(404).json({
        message: "Commitment not found."
      });
    }

    const paymentAmount =
      Number(amount) ||
      Number(commitment.currentCommitment) ||
      Number(commitment.startingCommitment) ||
      0;

    if (paymentAmount <= 0) {
      return res.status(400).json({
        message: "Invalid commitment amount."
      });
    }

    const transactionId =
      `TEST-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    commitment.lastPaymentStatus = "paid";
    commitment.lastPaymentAmount = paymentAmount;
    commitment.lastTransactionId = transactionId;
    commitment.lastPaymentDate = new Date();

    await commitment.save();

    return res.json({
      success: true,
      testMode: true,
      message: "Test payment successful.",
      transactionId,
      amount: paymentAmount,
      paymentStatus: "paid"
    });

  } catch (error) {
    console.error("Test payment error:", error);

    return res.status(500).json({
      message: "Test payment failed."
    });
  }
});


/*
========================================================
PAYMENT STATUS
========================================================
*/

router.get("/status/:commitmentId", async (req, res) => {
  try {
    const commitment = await Commitment.findOne({
      _id: req.params.commitmentId,
      userId: req.user.id
    });

    if (!commitment) {
      return res.status(404).json({
        message: "Commitment not found."
      });
    }

    return res.json({
      testMode: true,
      paymentStatus:
        commitment.lastPaymentStatus || "pending",
      amount:
        commitment.lastPaymentAmount || 0,
      transactionId:
        commitment.lastTransactionId || null,
      paymentDate:
        commitment.lastPaymentDate || null
    });

  } catch (error) {
    console.error("Payment status error:", error);

    return res.status(500).json({
      message: "Could not fetch payment status."
    });
  }
});


module.exports = router;