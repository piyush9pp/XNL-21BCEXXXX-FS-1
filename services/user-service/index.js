
import "dotenv/config";
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";
import mongoose from "mongoose";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid"; // Use require

const app = express();
app.use(cors());
app.use(express.json());


const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/user-service-db";
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("User Service connected to MongoDB"))
  .catch((err) => console.error("User Service MongoDB connection error:", err));


const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  bankDetails: {
    accessToken: String,
    accountId: String,
    institutionName: String,
  },
});
const User = mongoose.model("User", userSchema);


const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = process.env.PLAID_ENV; // Get the env from env variables.

const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": PLAID_CLIENT_ID,
      "PLAID-SECRET": PLAID_SECRET,
      "Plaid-Version": "2020-09-14",
    },
  },
});

const plaidClient = new PlaidApi(configuration);


app.post("/create-link-token", async (req, res) => {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: req.body.email },
      client_name: "Your App Name",
      products: ["auth"],
      country_codes: ["US"],
      language: "en",
    });

    res.json({ link_token: response.data.link_token });
  } catch (error) {
    console.error("Error creating link token:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/exchange-token", async (req, res) => {
  const { public_token, email } = req.body;

  try {
    const tokenResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });
    const { access_token } = tokenResponse.data;

    const accountsResponse = await plaidClient.accountsGet({ access_token });
    const account = accountsResponse.data.accounts[0];


    await User.findOneAndUpdate(
      { email },
      {
        bankDetails: {
          accessToken: access_token,
          accountId: account.account_id,
          institutionName: account.name,
        },
      },
      { new: true, upsert: true }
    );

    res.json({
      message: "Bank linked successfully",
      accountId: account.account_id,
    });
  } catch (error) {
    console.error("Error linking bank:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/check-bank/:email", async (req, res) => {
  const user = await User.findOne({ email: req.params.email });

  if (user?.bankDetails?.accessToken) {
    res.json({ linked: true, accountId: user.bankDetails.accountId });
  } else {
    res.json({ linked: false });
  }
});

app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("User already exists");
    }


    const hashedPassword = await bcrypt.hash(password, 10);


    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).send("User created");
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).send("Invalid credentials");
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).send("Invalid credentials");
    }


    const token = jwt.sign({ email }, "secret_key", { expiresIn: "1h" });
    res.json({ token });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(3001, () => console.log("User Service running on 3001"));
