// services/user-service/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

const app = express();
app.use(cors());
app.use(express.json());

// 1. Connect to MongoDB
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/account-service-db";
console.log(process.env.MONGO_URI);

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Account Service connected to MongoDB"))
  .catch((err) =>
    console.error("Account Service MongoDB connection error:", err)
  );

// 2. Define a Transaction schema and model
const transactionSchema = new mongoose.Schema({
  id: String,
  fromUser: String,
  toUser: String,
  amount: Number,
  status: String,
  timestamp: String,
});

const Transaction = mongoose.model("Transaction", transactionSchema);

// Endpoint to store transactions
app.post("/transactions", async (req, res) => {
  try {
    const transactionData = req.body;
    const newTransaction = new Transaction(transactionData);
    await newTransaction.save();
    res.status(201).send("Transaction stored in account service");
  } catch (error) {
    console.error("Error storing transaction:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/transactions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const userTransactions = await Transaction.find({
      $or: [{ fromUser: userId }, { toUser: userId }],
    });
    res.json(userTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(3004, () => console.log("Account Service running on 3004"));
