# XNL-21BCEXXXX-FS-1

## 🚀 Web Service Deployment on Render

This repository contains a **Node.js**-based web service that is deployed on **Render**.

## 📌 Features
- **User Authentication** (Signup/Login with JWT)
- **Bank Account Linking** (Plaid API integration)
- **Transaction Management** (Initiate & View Transactions)
- **Real-Time Notifications** (WebSockets & Kafka)
- **Financial Data Visualization** (Charts using Recharts)
- **Responsive UI** (Material-UI, React, Tailwind CSS)

## 🛠️ Installation & Setup

### 1️⃣ Clone the Repository
```sh
git clone https://github.com/piyush9pp/XNL-21BCEXXXX-FS-1.git
cd XNL-21BCEXXXX-FS-1
```

### 2️⃣ Install Dependencies
#### If using `npm`
```sh
npm install
```
#### If using `yarn`
```sh
yarn install
```

### 3️⃣ Environment Variables (Required)
Create a `.env` file in the root directory and add the following:
```env
MONGO_URI=mongodb+srv://yourdbconnectionstring
JWT_SECRET=yourjwtsecret
PLAID_CLIENT_ID=yourplaidclientid
PLAID_SECRET=yourplaidsecret
```

### 4️⃣ Start the Application
#### If using `npm`
```sh
npm start
```
#### If using `yarn`
```sh
yarn start
```

## 🌍 Deployment on Render
### **Deployment Settings:**
- **Branch:** `main`
- **Region:** `Singapore (Southeast Asia)`
- **Build Command:** `yarn install` or `npm install`
- **Start Command:** `yarn start` or `npm start`
- **Environment Variables:** Add the `.env` variables in Render settings

### **Live Deployment:**
After deployment, the service will be available at:
```
https://xnl-21bcxxxxx-fs-1.onrender.com
```

## 🏗️ Tech Stack
- **Frontend:** React.js, Material-UI, Tailwind CSS
- **Backend:** Node.js, Express.js, MongoDB
- **Real-time:** WebSockets, Kafka
- **Payments & Banking:** Plaid API
- **Deployment:** Render


