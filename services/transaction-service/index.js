// services/transaction-service/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import mongoose from "mongoose";
import { Kafka } from "kafkajs";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect("mongodb://localhost:27017/transaction-service-db", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Transaction Service connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  id: String,
  fromUser: String,
  toUser: String,
  amount: Number,
  status: String,
  timestamp: String,
});

const Transaction = mongoose.model("Transaction", transactionSchema);

// Kafka setup
const kafka = new Kafka({
  clientId: "transaction-service",
  brokers: ["localhost:9092"],
});
const producer = kafka.producer();

// Plaid Configuration
const PLAID_CLIENT_ID = "your_plaid_client_id";
const PLAID_SECRET = "your_plaid_secret";
const PLAID_ENV = PlaidEnvironments.sandbox; // Use 'development' or 'production' for real accounts

const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PLAID_ENV,
    clientId: PLAID_CLIENT_ID,
    secret: PLAID_SECRET,
  })
);

// 🚀 **Transaction Endpoint**
app.post("/transactions", async (req, res) => {
  const { fromUser, toUser, amount } = req.body;

  try {
    // Step 1️⃣: Fetch user’s bank details from User Service
    const userResponse = await axios.get(
      `http://localhost:3001/check-bank/${fromUser}`
    );
    const { linked, accountId } = userResponse.data;

    if (!linked) {
      return res
        .status(400)
        .json({ message: "User has not linked a bank account" });
    }

    // Step 2️⃣: Simulate Payment with Plaid Sandbox (Replace with real transaction flow in production)
    const transactionId = uuidv4();
    const transactionEvent = {
      id: transactionId,
      fromUser,
      toUser,
      amount,
      status: "PENDING",
      timestamp: new Date().toISOString(),
    };

    try {
      // Mock a successful Plaid payment transfer (Plaid does not directly handle payments, so we simulate it)
      const plaidResponse = await plaidClient.sandboxPublicTokenCreate({
        institution_id: "ins_1",
        initial_products: ["auth"],
      });

      if (plaidResponse.data.public_token) {
        transactionEvent.status = "SUCCESS";
      } else {
        transactionEvent.status = "FAILED";
      }
    } catch (error) {
      console.error("Plaid transaction simulation error:", error);
      transactionEvent.status = "FAILED";
    }

    // Step 3️⃣: Store transaction in MongoDB
    const newTransaction = new Transaction(transactionEvent);
    await newTransaction.save();

    // Step 4️⃣: Send transaction event to Kafka for notification service
    await producer.connect();
    await producer.send({
      topic: "transactions",
      messages: [{ key: fromUser, value: JSON.stringify(transactionEvent) }],
    });

    // Step 5️⃣: Notify Account Service to store transaction record
    await axios.post("http://localhost:3004/transactions", transactionEvent);

    res.status(202).json({
      message: `Transaction ${transactionEvent.status}`,
      transactionId,
    });
  } catch (error) {
    console.error("Transaction Processing Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Start Server
app.listen(3002, () => console.log("Transaction Service running on 3002"));

// import { Kafka } from 'kafkajs';
// import express from 'express';
// import cors from 'cors';
// import { v4 as uuidv4 } from 'uuid';
// import axios from 'axios';
// import mongoose from 'mongoose';

// const app = express();
// app.use(cors());
// app.use(express.json());

// // 1. Connect to MongoDB
// const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/transaction-service-db';
// mongoose
//   .connect(MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log('Transaction Service connected to MongoDB'))
//   .catch(err => console.error('Transaction Service MongoDB connection error:', err));

// // 2. Define a Transaction schema and model
// const transactionSchema = new mongoose.Schema({
//   id: String,
//   fromUser: String,
//   toUser: String,
//   amount: Number,
//   status: String,
//   timestamp: String,
// });

// const Transaction = mongoose.model('Transaction', transactionSchema);

// // Kafka setup
// const kafka = new Kafka({
//   clientId: 'transaction-service',
//   brokers: ['localhost:9092'],
// });

// const producer = kafka.producer();

// // Transaction Endpoint
// app.post('/transactions', async (req, res) => {
//   const { fromUser, toUser, amount } = req.body;

//   const transactionEvent = {
//     id: uuidv4(),
//     fromUser,
//     toUser,
//     amount,
//     status: 'PENDING',
//     timestamp: new Date().toISOString(),
//   };

//   try {
//     // Store transaction in MongoDB
//     const newTransaction = new Transaction(transactionEvent);
//     await newTransaction.save();

//     // Send the event to Kafka
//     await producer.connect();
//     await producer.send({
//       topic: 'transactions',
//       messages: [
//         {
//           key: fromUser, // Ensures ordering for the same user
//           value: JSON.stringify(transactionEvent),
//         },
//       ],
//     });

//     // Notify the Account Service (just like before)
//     await axios.post('http://localhost:3004/transactions', transactionEvent);

//     res
//       .status(202)
//       .json({ message: 'Transaction being processed', transactionId: transactionEvent.id });
//   } catch (error) {
//     console.error('Error in transaction POST:', error);
//     res.status(500).send('Internal Server Error');
//   }
// });

// app.listen(3002, () => console.log('Transaction Service running on 3002'));
