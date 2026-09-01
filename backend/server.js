require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const commitmentRoutes = require("./routes/commitmentRoutes");
const proofRoutes = require("./routes/proofRoutes");
const paymentRoutes = require("./models/Payment");
const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

connectDB();

app.get("/", (req, res) => {
  res.json({ message: "Commitment Habits backend is running" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/commitments", commitmentRoutes);
app.use("/api/proof", proofRoutes);
app.use("/api/payment", paymentRoutes);

app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});