const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const db = require("./database/db");
const transactionRoutes = require("./routes/transactionRoutes");
const financialRoutes = require("./routes/financialRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// 1. Serve static files from 'public' folder (located one level up from 'src')
app.use(express.static(path.join(__dirname, "..", "public")));

// 2. API Routes
app.use("/api/transactions", transactionRoutes);
app.use("/api/financial", financialRoutes);
app.use("/api/settings", settingsRoutes);
// 3. Serve dashboard.html on root '/' request
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "dashboard.html"));
});

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({ message: "Lily backend is running!" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Lily server running on port ${PORT}`);
});

// Database Connection Test
db.query("SELECT NOW()")
    .then(() => {
        console.log(" Connected to Supabase PostgreSQL");
    })
    .catch(err => {
        console.error(" Database Error:", err.message);
    });

// Graceful Shutdown
process.on("SIGINT", async () => {
    console.log("Closing database connection pool...");
    if (db.end) await db.end();
    process.exit(0);
});