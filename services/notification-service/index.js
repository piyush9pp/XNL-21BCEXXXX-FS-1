// services/notification-service/index.js
import "dotenv/config";
import { Kafka } from "kafkajs";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import express from "express";

const app = express();
app.use(express.json());

// 1. Connect to MongoDB (optional if you want to store notifications)
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/notification-service-db";
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Notification Service connected to MongoDB"))
  .catch((err) =>
    console.error("Notification Service MongoDB connection error:", err)
  );

// Notification Schema
const notificationSchema = new mongoose.Schema({
  email: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});
const Notification = mongoose.model("Notification", notificationSchema);

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your-email@gmail.com", // Replace with your email
    pass: "your-email-password", // Replace with App Password
  },
});

// Kafka setup
const kafka = new Kafka({
  clientId: "notification-service",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "notification-group" });
const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "transactions", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const transaction = JSON.parse(message.value.toString());

      const emailContent = `Transaction of $${transaction.amount} to ${transaction.toUser} is ${transaction.status}`;

      // Send email
      await transporter.sendMail({
        from: "your-email@gmail.com",
        to: transaction.fromUser,
        subject: "Transaction Notification",
        text: emailContent,
      });

      // Log notification in database
      await Notification.create({
        email: transaction.fromUser,
        message: emailContent,
      });
    },
  });
};

// 1️⃣ Route to fetch notification logs
app.get("/notifications/:email", async (req, res) => {
  const logs = await Notification.find({ email: req.params.email });
  res.json(logs);
});

run();
app.listen(3003, () => console.log("Notification Service running on 3003"));
