const express = require("express");
const cors = require("cors");
require("dotenv").config();

const transactionRoutes =
    require("./routes/transactionRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/transactions", transactionRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Lily server running on port ${PORT}`);
});